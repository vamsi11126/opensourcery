import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const initialSources = [
  { name: 'GitHub Trending Weekly', url: 'https://github.com/trending?since=weekly', type: 'github_trending' },
  { name: 'GitHub Trending JavaScript', url: 'https://github.com/trending/javascript?since=weekly', type: 'github_trending' },
  { name: 'GitHub Trending Python', url: 'https://github.com/trending/python?since=weekly', type: 'github_trending' },
  { name: 'Awesome Lists', url: 'https://github.com/sindresorhus/awesome', type: 'awesome_repo' },
  { name: 'npm Top Packages', url: 'https://www.npmjs.com/', type: 'npm_top' },
];
async function main(): Promise<void> { for (const source of initialSources) await db.scrapedSource.upsert({ where: { url: source.url }, update: { name: source.name, type: source.type, isActive: true }, create: source }); }
main().finally(() => db.$disconnect());
