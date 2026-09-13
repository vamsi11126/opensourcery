import { NextResponse } from 'next/server';
import { getListedProjectsCount } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const count = await getListedProjectsCount();
    return NextResponse.json({ data: { count } });
  } catch {
    return NextResponse.json({ error: 'Unable to load project count.' }, { status: 500 });
  }
}
