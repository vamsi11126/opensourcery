import { db } from '@/lib/db';

export interface ProjectWithDistance {
  id: string; title: string; slug: string; shortDescription: string; longDescription: string | null;
  sourceUrl: string; homepageUrl: string | null; license: string | null; language: string[];
  tags: string[]; category: string | null; starsCount: number; lastCommitDate: Date | null; distance: number;
}

export interface VectorSearchParams { embedding: number[]; category?: string; license?: string; language?: string; minStars?: number; tags?: string[]; limit?: number; excludeId?: string; }

function vectorLiteral(values: number[]): string { return `[${values.map((value) => Number.isFinite(value) ? value.toString() : '0').join(',')}]`; }
function sqlString(value: string): string { return `'${value.replaceAll("'", "''")}'`; }

export async function vectorSearch(params: VectorSearchParams): Promise<ProjectWithDistance[]> {
  const limitValue = typeof params.limit === 'number' && params.limit > 0 ? Math.max(1, Math.min(params.limit, 500)) : null;
  const conditions = [`status = 'APPROVED'`];
  if (params.category) conditions.push(`category = ${sqlString(params.category)}`);
  if (params.license) conditions.push(`license = ${sqlString(params.license)}`);
  if (params.language) conditions.push(`${sqlString(params.language)} = ANY(language)`);
  if (typeof params.minStars === 'number') conditions.push(`"starsCount" >= ${Math.max(0, Math.floor(params.minStars))}`);
  if (params.tags?.length) conditions.push(`tags @> ARRAY[${params.tags.map(sqlString).join(',')}]::text[]`);
  if (params.excludeId) conditions.push(`id <> ${sqlString(params.excludeId)}`);
  const limitClause = limitValue ? ` LIMIT ${limitValue}` : '';
  const sql = `SELECT id, title, slug, "shortDescription", "longDescription", "sourceUrl", "homepageUrl", license, language, tags, category, "starsCount", "lastCommitDate", embedding <-> CAST(${sqlString(vectorLiteral(params.embedding))} AS vector) AS distance FROM "Project" WHERE ${conditions.join(' AND ')} ORDER BY distance${limitClause}`;
  try {
    const rows = await db.$queryRawUnsafe<ProjectWithDistance[]>(sql);
    return rows.map((row) => ({ ...row, distance: Number(row.distance) }));
  } catch {
    return [];
  }
}

export async function getStoredEmbedding(projectId: string): Promise<number[] | null> {
  try {
    const rows = await db.$queryRawUnsafe<Array<{ embedding: string | null }>>(`SELECT embedding::text AS embedding FROM "Project" WHERE id = ${sqlString(projectId)}`);
    const raw = rows[0]?.embedding;
    if (!raw) return null;
    return raw.replace(/[\[\]]/g, '').split(',').map(Number).filter(Number.isFinite);
  } catch { return null; }
}

export async function storeEmbedding(projectId: string, embedding: number[]): Promise<void> {
  await db.$executeRawUnsafe(`UPDATE "Project" SET embedding = CAST(${sqlString(vectorLiteral(embedding))} AS vector) WHERE id = ${sqlString(projectId)}`);
}

/** Find semantically similar open-source projects using vector distance. */
export async function findSimilarProjects(projectId: string, limit = 4): Promise<ProjectWithDistance[]> {
  const embedding = await getStoredEmbedding(projectId);
  if (!embedding) return [];
  return vectorSearch({ embedding, excludeId: projectId, limit });
}

/** Search open-source alternatives to a proprietary software tool. */
export async function searchAlternatives(proprietaryTool: string, limit = 6): Promise<ProjectWithDistance[]> {
  const altTag = `alt-${proprietaryTool.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const dbMatches = await db.project.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { tags: { has: altTag } },
        { longDescription: { contains: proprietaryTool, mode: 'insensitive' } },
      ],
    },
    take: limit,
  });

  if (dbMatches.length > 0) {
    return dbMatches.map((p) => ({ ...p, distance: 0 }));
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const { createEmbedding } = await import('@/lib/embeddings');
      const embedding = await createEmbedding(`Open source software alternative competing with ${proprietaryTool}`);
      return vectorSearch({ embedding, limit });
    } catch {
      return [];
    }
  }

  return [];
}
