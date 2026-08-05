import OpenAI from 'openai';
import { db } from '@/lib/db';

export interface TechRadarResult {
  highlights: string[];
  techStack: string[];
  alternativeTo: string[];
  contributorNotes: string;
  category: string;
  summaryMarkdown: string;
}

export const TECH_RADAR_PROMPT = `You are a principal software architect and open-source tech radar analyst.
Your task is to analyze an open-source project's repository title, description, and README text to generate a comprehensive AI Tech Radar summary.

Generate a JSON object matching this exact schema:
{
  "highlights": string[] (3-4 concise, impactful bullet points explaining why developers should use this project),
  "techStack": string[] (4-6 key frameworks, libraries, languages, or tools used, e.g., ["React", "TypeScript", "PostgreSQL", "Docker"]),
  "alternativeTo": string[] (1-3 commercial or proprietary software products this open-source project replaces or competes with, e.g., ["Notion", "Firebase", "Datadog", "Zapier", "Auth0"]),
  "contributorNotes": string (1-2 sentences summarizing how beginner-friendly the repo is for open-source contributors),
  "category": string (Primary category, e.g. "Developer Tools", "AI & Machine Learning", "Database & Storage", "Web Frameworks", "DevOps & Infrastructure", "Security & Auth", "Productivity")
}`;

async function fetchReadmeContent(repoUrl: string): Promise<string> {
  try {
    const url = new URL(repoUrl);
    if (!url.hostname.includes('github.com')) return '';
    
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return '';
    
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, '');

    let response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
    if (!response.ok) {
      response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
    }
    
    if (!response.ok) return '';
    const text = await response.text();
    return text.slice(0, 4000);
  } catch {
    return '';
  }
}

/** Generate AI Tech Radar analysis for an open-source project. */
export async function generateTechRadar(
  project: { id: string; title: string; shortDescription: string; sourceUrl: string; tags: string[] }
): Promise<TechRadarResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const readme = await fetchReadmeContent(project.sourceUrl);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: TECH_RADAR_PROMPT },
        {
          role: 'user',
          content: `Title: ${project.title}
Short Description: ${project.shortDescription}
URL: ${project.sourceUrl}
Tags: ${project.tags.join(', ')}
README Excerpt:
${readme || 'No README text available.'}`,
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      highlights?: string[];
      techStack?: string[];
      alternativeTo?: string[];
      contributorNotes?: string;
      category?: string;
    };

    const highlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];
    const techStack = Array.isArray(parsed.techStack) ? parsed.techStack : [];
    const alternativeTo = Array.isArray(parsed.alternativeTo) ? parsed.alternativeTo : [];
    const contributorNotes = parsed.contributorNotes ?? 'Open for community contributions.';
    const category = parsed.category ?? 'Developer Tools';

    const summaryMarkdown = `
### ⚡ AI Tech Radar Insights

**Key Highlights:**
${highlights.map((h) => `- ${h}`).join('\n')}

${alternativeTo.length ? `**Open-Source Alternative To:** ${alternativeTo.join(', ')}\n` : ''}
**Tech Stack:** ${techStack.join(', ')}

**Contributor Guidance:** ${contributorNotes}
`.trim();

    await db.project.update({
      where: { id: project.id },
      data: {
        longDescription: summaryMarkdown,
        category,
        tags: Array.from(new Set([...project.tags, ...techStack, ...alternativeTo.map(a => `alt-${a.toLowerCase().replace(/[^a-z0-9]/g, '')}`)]))
      },
    });

    return {
      highlights,
      techStack,
      alternativeTo,
      contributorNotes,
      category,
      summaryMarkdown,
    };
  } catch {
    return null;
  }
}
