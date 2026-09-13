import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createEmbedding, projectEmbeddingText } from '@/lib/embeddings';
import { getStoredEmbedding, storeEmbedding } from '@/lib/vector-search';
import { normalizeUrl } from '@/lib/dedup';
import { rateLimit } from '@/lib/rate-limit';
import { evaluateUsefulness } from '@/lib/project-quality';
import { canManageProject } from '@/lib/permissions';
import { generateTechRadar } from '@/lib/tech-radar';

interface EnrichedMetadata { title: string; shortDescription: string; tags: string[]; license: string | null; category: string | null; }
const enrichmentTimes = new Map<string, number>();

async function githubMetadata(url: URL): Promise<Partial<EnrichedMetadata> & { starsCount?: number; language?: string; lastCommitDate?: Date }> {
  if (url.hostname !== 'github.com') return {};
  const [owner, repo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) return {};
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'OpenSourcery' }, next: { revalidate: 3600 } });
  if (!response.ok) return {};
  const data = await response.json() as { name?: string; description?: string | null; license?: { spdx_id?: string | null } | null; stargazers_count?: number; language?: string | null; pushed_at?: string | null };
  return { title: data.name, shortDescription: data.description ?? undefined, license: data.license?.spdx_id ?? undefined, starsCount: data.stargazers_count, language: data.language ?? undefined, lastCommitDate: data.pushed_at ? new Date(data.pushed_at) : undefined };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const body = await request.json() as { url?: string; projectId?: string };
    if (!body.url) return NextResponse.json({ error: 'A project URL is required.' }, { status: 400 });
    const normalized = normalizeUrl(body.url);
    if (!await rateLimit(`enrich:${session.user.id}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many enrichment requests.' }, { status: 429 });
    }
    const lastRun = enrichmentTimes.get(normalized) ?? 0;
    if (Date.now() - lastRun < 3600000) return NextResponse.json({ error: 'This URL was enriched recently. Try again later.' }, { status: 429 });
    enrichmentTimes.set(normalized, Date.now());
    const url = new URL(normalized);
    const github = await githubMetadata(url);
    const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    let metadata: EnrichedMetadata = { title: github.title ?? url.pathname.split('/').filter(Boolean).pop() ?? url.hostname, shortDescription: github.shortDescription ?? `Open-source project from ${url.hostname}.`, tags: [], license: github.license ?? null, category: null };
    if (client) {
      const completion = await client.chat.completions.create({ model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a project metadata extractor. Visit the given URL and extract the project\'s title, a short description (max 280 chars), tags (array of strings), license, and category. Return valid JSON only.' }, { role: 'user', content: `URL: ${normalized}\nGitHub metadata: ${JSON.stringify(github)}` }] });
      const content = completion.choices[0]?.message.content;
      if (content) metadata = { ...metadata, ...JSON.parse(content) as Partial<EnrichedMetadata>, shortDescription: (JSON.parse(content) as Partial<EnrichedMetadata>).shortDescription?.slice(0, 280) ?? metadata.shortDescription };
    }

    // Judge whether this project is worth including before persisting it
    const verdict = await evaluateUsefulness(
      client,
      {
        starsCount: github.starsCount,
        lastCommitDate: github.lastCommitDate,
        hasLicense: Boolean(metadata.license),
        hasDescription: Boolean(metadata.shortDescription),
      },
      { title: metadata.title, description: metadata.shortDescription, url: normalized }
    );

    if (body.projectId) {
      const existing = await db.project.findUnique({
        where: { id: body.projectId },
        select: { id: true, submittedById: true, status: true },
      });
      if (!existing) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
      if (!canManageProject(session.user, existing.submittedById)) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }

      const project = await db.project.update({
        where: { id: body.projectId },
        data: {
          title: metadata.title,
          shortDescription: metadata.shortDescription,
          tags: metadata.tags,
          license: metadata.license,
          category: metadata.category,
          starsCount: github.starsCount ?? undefined,
          language: github.language ? [github.language] : undefined,
          lastCommitDate: github.lastCommitDate,
          status: verdict.status === 'approved' ? 'APPROVED' : 'FLAGGED',
        },
      });
      if (verdict.status === 'approved') {
        await generateTechRadar({ id: project.id, title: project.title, shortDescription: project.shortDescription, sourceUrl: project.sourceUrl, tags: project.tags });
        const embedding = await createEmbedding(projectEmbeddingText(project));
        await storeEmbedding(project.id, embedding);
      }
    }
    return NextResponse.json({ data: metadata, verdict });
  } catch { return NextResponse.json({ error: 'Unable to enrich this project right now.' }, { status: 500 }); }
}
