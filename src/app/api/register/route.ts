import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    if (!await rateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = typeof input.email === 'string' ? input.email.toLowerCase().trim() : '';
    const password = typeof input.password === 'string' ? input.password : '';

    if (!name || !email.includes('@') || password.length < 8) {
      return NextResponse.json(
        { error: 'Name, valid email, and an 8-character password are required.' },
        { status: 400 },
      );
    }

    if (await db.user.findUnique({ where: { email } })) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    // All new registrations get the default USER role — no exceptions in code.
    // To promote a user to ADMIN, run: npx tsx scripts/promote-admin.ts <email>
    await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password, 12),
      },
    });

    return NextResponse.json({ data: { created: true } }, { status: 201 });
  } catch (error) {
    console.error('Registration failed:', error);
    const message = error instanceof Error ? error.message : '';
    if (
      message.includes("Can't reach database server") ||
      message.includes('PrismaClientInitializationError')
    ) {
      return NextResponse.json(
        { error: 'The database is temporarily unavailable. Please try again when the database is online.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 });
  }
}
