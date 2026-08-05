import OpenAI from 'openai';
import { db } from '@/lib/db';

export interface CandidateSource { name: string; url: string; type: string; }
export const candidateSources: CandidateSource[] = [
  { name: 'GitHub Trending', url: 'https://github.com/trending', type: 'github_trending' },
  { name: 'Awesome lists', url: 'https://github.com/sindresorhus/awesome', type: 'awesome_repo' },
  { name: 'GitLab Explore', url: 'https://gitlab.com/explore/projects', type: 'gitlab_explore' },
  { name: 'npm top packages', url: 'https://api.npmjs.org/downloads/point/last-month/{package}', type: 'npm_top' },
  { name: 'PyPI top packages', url: 'https://pypi.org/simple/', type: 'pypi_top' },
  { name: 'SourceForge', url: 'https://sourceforge.net/directory/', type: 'sourceforge' },
  { name: 'GitHub topic pages', url: 'https://github.com/topics/{topic}', type: 'github_topic' },
];

/** Choose and persist five high-quality sources, skipping recently scraped entries. */
export async function selectSources(options: { forceRefresh?: boolean; useAi?: boolean } = {}): Promise<CandidateSource[]> {
  let selected = candidateSources.slice(0, 5);
  if (options.useAi !== false && process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({ model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a source curator for an open-source project catalog. Given the list of candidate sources below, pick exactly 5 that will yield the highest-quality open-source projects for our catalog. Prioritize clear licenses, active maintenance, good documentation, diverse categories, and community adoption. Return a JSON object with a sources array; each item must contain name, url, and type.' }, { role: 'user', content: JSON.stringify(candidateSources) }] });
      const content = response.choices[0]?.message.content;
      if (content) { const parsed = JSON.parse(content) as { sources?: CandidateSource[] }; const allowed = new Set(candidateSources.map((source) => source.url)); const valid = (parsed.sources ?? []).filter((source) => allowed.has(source.url)); if (valid.length === 5) selected = valid; }
    } catch { /* deterministic candidates remain a safe fallback */ }
  }
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const persisted: CandidateSource[] = [];
  for (const source of selected) {
    const existing = await db.scrapedSource.findUnique({ where: { url: source.url } });
    if (!options.forceRefresh && existing?.lastScrapedAt && existing.lastScrapedAt > weekAgo) continue;
    await db.scrapedSource.upsert({ where: { url: source.url }, update: { name: source.name, type: source.type, isActive: true }, create: source });
    persisted.push(source);
  }
  return persisted;
}
