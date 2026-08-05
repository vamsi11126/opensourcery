import OpenAI from 'openai';
import { db } from '@/lib/db';

const blockedTerms: Array<[RegExp, string]> = [
  [/\b(child sexual|csam|sexual minor)\b/i, 'illegal-sexual-content'],
  [/\b(malware|ransomware|keylogger|credential stealer|botnet|trojan)\b/i, 'malware'],
  [/\b(phishing|password stealer|stolen credentials)\b/i, 'phishing'],
  [/\b(hack bank|carding|credit card dump|ssn dump)\b/i, 'financial-crime'],
  [/\b(terrorist recruitment|how to make a bomb)\b/i, 'violent-illegal-content'],
  [/\b(?:\d[ -]*?){13,19}\b/, 'payment-card-number'],
  [/\b\d{3}-\d{2}-\d{4}\b/, 'social-security-number'],
  [/(?:evil|malware|phish|credential)[-\w]*\.(?:tk|top|zip|click|xyz)\b/i, 'known-malware-domain'],
];

export interface ModerationInput {
  title: string;
  description: string;
  tags: string[];
  sourceUrl?: string;
  projectId?: string;
  trustedSource?: boolean;
}

export interface ModerationResult {
  isClean: boolean;
  autoApprove: boolean;
  flags: string[];
  reason?: string;
}

export const RESOURCE_VERIFICATION_PROMPT = `You are an expert open-source security and content verification auditor for OpenSourcery.
Your task is to strictly verify software project submissions and scraped resources to determine if they are authentic, legitimate, and safe open-source software projects eligible for auto-approval.

STRICT VERIFICATION CRITERIA:
1. OPEN-SOURCE AUTHENTICITY: Must be a real, genuine open-source software repository, package, framework, tool, library, or application (e.g., hosted on GitHub, GitLab, PyPI, npm, SourceForge). REJECT/FLAG domain parking, link farms, SEO spam, ad networks, personal blogs without software code, or non-software services.
2. CONTENT QUALITY & COMPLETENESS: Title and description must be coherent, informative, and accurately describe technical software functionality. REJECT gibberish, single-character placeholders, or misleading content.
3. SAFETY & POLICY COMPLIANCE: Zero tolerance for malware, trojans, ransomware, phishing, carding, illegal content, secret/credential leaks, or hate speech.

Return a JSON object matching this exact schema:
{
  "isClean": boolean (true if free of safety, malware, or policy violations),
  "approved": boolean (true ONLY if it strictly satisfies all authenticity, quality, and safety criteria for auto-approval into the public catalog),
  "flags": string[] (array of specific flag tags if any issues found, e.g. ["spam", "non-software", "malware", "low-quality"]),
  "reason": string (brief 1-2 sentence explanation of the verification decision)
}`;

/** Check project metadata with local patterns, OpenAI safety moderation, and LLM strict resource verification. */
export async function checkContent(input: ModerationInput): Promise<ModerationResult> {
  const text = [input.title, input.description, ...input.tags, input.sourceUrl ?? ''].join(' ');
  const flags = blockedTerms.flatMap(([pattern, flag]) => pattern.test(text) ? [flag] : []);
  let autoApprove = input.trustedSource ?? false;
  let reason = '';

  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Pass 1: Safety Moderation Check
      const modResult = await client.moderations.create({ model: 'omni-moderation-latest', input: text });
      const moderation = modResult.results[0];
      if (moderation?.flagged) {
        Object.entries(moderation.categories).forEach(([category, flagged]) => {
          if (flagged) flags.push(category);
        });
      }

      // Pass 2: LLM Strict Resource Verification & Quality Auto-Approval
      if (flags.length === 0) {
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: RESOURCE_VERIFICATION_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                title: input.title,
                description: input.description,
                tags: input.tags,
                sourceUrl: input.sourceUrl ?? '',
                trustedSource: Boolean(input.trustedSource),
              }),
            },
          ],
        });

        const content = response.choices[0]?.message.content;
        if (content) {
          const parsed = JSON.parse(content) as {
            isClean?: boolean;
            approved?: boolean;
            flags?: string[];
            reason?: string;
          };
          
          if (Array.isArray(parsed.flags)) {
            flags.push(...parsed.flags);
          }
          if (typeof parsed.approved === 'boolean') {
            autoApprove = parsed.approved;
          }
          if (typeof parsed.reason === 'string') {
            reason = parsed.reason;
          }
        }
      }
    } catch {
      // Fallback: If OpenAI API fails, rely on local blocked terms and trusted source status
      autoApprove = flags.length === 0 && Boolean(input.trustedSource);
    }
  }

  const uniqueFlags = Array.from(new Set(flags));
  const isClean = uniqueFlags.length === 0;
  const shouldApprove = isClean && autoApprove;

  if (input.projectId) {
    const status = !isClean || uniqueFlags.length > 0 
      ? 'FLAGGED' 
      : (shouldApprove ? 'APPROVED' : 'PENDING');
      
    await db.project.update({
      where: { id: input.projectId },
      data: {
        status,
        moderationFlags: uniqueFlags,
        approvedAt: shouldApprove ? new Date() : undefined,
      },
    });
  }

  return { isClean, autoApprove: shouldApprove, flags: uniqueFlags, reason };
}
