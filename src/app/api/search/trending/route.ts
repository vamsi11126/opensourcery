import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const revalidate = 300;
export async function GET(): Promise<NextResponse> { try { const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); const logs = await db.searchLog.findMany({ where: { createdAt: { gte: since } }, select: { query: true } }); const counts = new Map<string, number>(); logs.forEach((log) => counts.set(log.query, (counts.get(log.query) ?? 0) + 1)); const data = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([query, count]) => ({ query, count })); return NextResponse.json({ data }); } catch { return NextResponse.json({ error: 'Unable to load trending searches.' }, { status: 500 }); } }
