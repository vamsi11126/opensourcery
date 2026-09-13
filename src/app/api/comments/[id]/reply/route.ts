import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (!await rateLimit(`comment:${session.user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many comments. Try again later.' }, { status: 429 });
    }
    const body = await request.json() as { content?: string };
    const content = body.content?.trim() ?? '';
    if (!content || content.length > 4000) {
      return NextResponse.json({ error: 'Reply must be between 1 and 4000 characters.' }, { status: 400 });
    }
    const parent = await db.comment.findUnique({ where: { id: params.id }, select: { id: true, projectId: true } });
    if (!parent) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
    const data = await db.comment.create({
      data: { content, projectId: parent.projectId, parentId: parent.id, authorId: session.user.id },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to create reply.' }, { status: 500 });
  }
}
