import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { normalizeUrl } from '@/lib/dedup';
import { checkContent } from '@/lib/moderation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { slugify } from '@/lib/utils';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    const ip = getClientIp(request);
    const key = `submit:${session?.user.id ?? ip}`;
    if (!await rateLimit(key, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
    }

    const body = await request.json() as Record<string, unknown>;
    const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const shortDescription = typeof body.shortDescription === 'string' ? body.shortDescription.trim() : '';
    const tags = typeof body.tags === 'string'
      ? body.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    if (!sourceUrl || !title || !shortDescription || shortDescription.length > 280) {
      return NextResponse.json(
        { error: 'Source URL, title, and a short description are required.' },
        { status: 400 },
      );
    }

    let normalized: string;
    try {
      normalized = normalizeUrl(sourceUrl);
    } catch {
      return NextResponse.json({ error: 'Enter a valid source URL.' }, { status: 400 });
    }

    if (await db.project.findUnique({ where: { sourceUrl: normalized } })) {
      return NextResponse.json({ error: 'This project has already been submitted.' }, { status: 409 });
    }

    const moderation = await checkContent({ title, description: shortDescription, tags });
    const slug = `${slugify(title) || `project-${Date.now()}`}-${Math.random().toString(36).slice(2, 7)}`;

    const project = await db.project.create({
      data: {
        title,
        slug,
        shortDescription,
        sourceUrl: normalized,
        tags,
        license: typeof body.license === 'string' ? body.license.trim() || null : null,
        language: [],
        moderationFlags: moderation.flags,
        status: moderation.isClean ? 'PENDING' : 'FLAGGED',
        submittedById: session?.user.id,
      },
    });

    return NextResponse.json({ data: { id: project.id, slug: project.slug, status: project.status } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to submit project.' }, { status: 500 });
  }
}
