import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    const body = await request.json() as { isActive?: boolean };
    if (typeof body.isActive !== 'boolean') return NextResponse.json({ error: 'isActive must be boolean.' }, { status: 400 });
    const data = await db.scrapedSource.update({ where: { id: params.id }, data: { isActive: body.isActive } });
    return NextResponse.json({ data });
  } catch { return NextResponse.json({ error: 'Unable to update source.' }, { status: 500 }); }
}
