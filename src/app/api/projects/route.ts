import { NextResponse } from 'next/server'; import { db } from '@/lib/db';
export async function GET(): Promise<NextResponse> { try { const data = await db.project.findMany({ where: { status: 'APPROVED' }, orderBy: { starsCount: 'desc' }, take: 50 }); return NextResponse.json({ data }); } catch { return NextResponse.json({ error: 'Unable to load projects.' }, { status: 500 }); } }
