import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    // Only return currently-active bookmarks
    const saved = await db.userSavedProject.findMany({
      where: { userId: session.user.id, active: true },
      select: { projectId: true },
    });
    return NextResponse.json({ data: saved.map((item) => item.projectId) });
  } catch {
    return NextResponse.json({ error: 'Unable to load bookmarks.' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    if (!await rateLimit(`bookmark-post:${session.user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json() as { projectId?: string };
    if (!body.projectId) return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });

    const existing = await db.userSavedProject.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId: body.projectId } },
    });

    if (existing) {
      // Record already exists (active or soft-deleted).
      // Reactivate if needed — NO reputation change under any condition.
      // Reputation, once granted, is permanent and not re-grantable.
      if (!existing.active) {
        await db.userSavedProject.update({
          where: { userId_projectId: { userId: session.user.id, projectId: body.projectId } },
          data: { active: true, savedAt: new Date() },
        });
      }
      return NextResponse.json({ data: { saved: true } }, { status: 200 });
    }

    // First-ever bookmark for this (user, project) pair — grant reputation once, permanently.
    const project = await db.project.findUnique({
      where: { id: body.projectId },
      select: { submittedById: true },
    });

    await db.userSavedProject.create({
      data: {
        userId: session.user.id,
        projectId: body.projectId,
        active: true,
        reputationGranted: true, // audit flag only — never read back to gate any decision
      },
    });

    // Grant bookmarker +1
    await db.user.update({
      where: { id: session.user.id },
      data: { reputation: { increment: 1 } },
    });

    // Grant submitter +2 (skip self-bookmarks)
    if (project?.submittedById && project.submittedById !== session.user.id) {
      await db.user.update({
        where: { id: project.submittedById },
        data: { reputation: { increment: 2 } },
      });
    }

    return NextResponse.json({ data: { saved: true } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to save project.' }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    if (!await rateLimit(`bookmark-delete:${session.user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const projectId = new URL(request.url).searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 });

    const existing = await db.userSavedProject.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } },
    });

    if (existing?.active) {
      // Soft-delete only. Reputation is never reversed under any condition —
      // decrementing on unbookmark would allow farming by cycling, and
      // withholding the earned reputation is the correct security property.
      await db.userSavedProject.update({
        where: { userId_projectId: { userId: session.user.id, projectId } },
        data: { active: false },
      });
    }

    return NextResponse.json({ data: { saved: false } });
  } catch {
    return NextResponse.json({ error: 'Unable to remove bookmark.' }, { status: 500 });
  }
}
