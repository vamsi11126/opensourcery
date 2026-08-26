import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scrapeSource } from '@/lib/scraper';
import { selectSources } from '@/lib/source-selector';

export const maxDuration = 300;

function isCronRequest(request: Request): boolean { const secret = process.env.CRON_SECRET; return Boolean(secret && request.headers.get('x-vercel-cron-secret') === secret); }

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!isCronRequest(request) && (!session || session.user.role !== 'ADMIN')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    const cronRequest = isCronRequest(request);
    await selectSources({ forceRefresh: !cronRequest, useAi: cronRequest });
    const sources = await db.scrapedSource.findMany({ where: { isActive: true } });
    const results = await Promise.all(sources.map((source) => scrapeSource(source)));
    return NextResponse.json({ data: { sourcesScraped: results.length, projectsFound: results.reduce((sum, result) => sum + result.projectsFound, 0), projectsNew: results.reduce((sum, result) => sum + result.projectsNew, 0), projectsUpdated: results.reduce((sum, result) => sum + result.projectsUpdated, 0), results } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Scrape run failed.' }, { status: 500 }); }
}

export async function GET(request: Request): Promise<NextResponse> {
  try { const session = await auth(); if (!isCronRequest(request) && (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR'))) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 }); const data = await db.scrapeLog.findMany({ orderBy: { startedAt: 'desc' }, take: 20, include: { source: { select: { name: true, type: true } } } }); return NextResponse.json({ data }); } catch { return NextResponse.json({ error: 'Unable to load scrape logs.' }, { status: 500 }); }
}
