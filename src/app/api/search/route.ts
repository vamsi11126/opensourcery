import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createEmbedding } from '@/lib/embeddings';
import { vectorSearch, type ProjectWithDistance, type VectorSearchParams } from '@/lib/vector-search';

interface SearchBody { query?: string; filters?: { category?: string; license?: string; language?: string; minStars?: number; tags?: string[] }; }

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as SearchBody;
    const query = body.query?.trim() ?? '';
    const filters = body.filters ?? {};
    if (query) { const session = await auth(); await db.searchLog.create({ data: { query: query.slice(0, 200), userId: session?.user?.id } }); }
    const where = { status: 'APPROVED' as const, ...(filters.category ? { category: filters.category } : {}), ...(filters.license ? { license: filters.license } : {}), ...(filters.language ? { language: { has: filters.language } } : {}), ...(typeof filters.minStars === 'number' ? { starsCount: { gte: filters.minStars } } : {}), ...(filters.tags?.length ? { tags: { hasEvery: filters.tags } } : {}), ...(query ? { OR: [{ title: { contains: query, mode: 'insensitive' as const } }, { shortDescription: { contains: query, mode: 'insensitive' as const } }, { longDescription: { contains: query, mode: 'insensitive' as const } }] } : {}) };
    if (!query) {
      const projects = await db.project.findMany({ where, orderBy: { submittedAt: 'desc' } });
      return NextResponse.json({ data: projects.map((project) => ({ ...project, embedding: undefined, distance: 0 })) });
    }
    let embedding: number[];
    try { embedding = await createEmbedding(query); } catch {
      const fallback = await db.project.findMany({ where, orderBy: { starsCount: 'desc' } });
      return NextResponse.json({ data: fallback.map((project) => ({ ...project, embedding: undefined, distance: 1 })) });
    }
    const searchParams: VectorSearchParams = { embedding, ...filters, limit: 20 };
    let data: ProjectWithDistance[] = await vectorSearch(searchParams);
    if (!data.length) {
      const fallback = await db.project.findMany({ where, orderBy: { starsCount: 'desc' } });
      data = fallback.map((project) => ({ ...project, embedding: 0, distance: 1 })) as unknown as ProjectWithDistance[];
    }
    return NextResponse.json({ data });
  } catch { return NextResponse.json({ error: 'Search is temporarily unavailable.' }, { status: 500 }); }
}
