import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSessionCode, generateAdminToken } from '@/lib/utils';

// POST /api/sessions — create a new poll session
export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Ensure unique session code
    let sessionCode = generateSessionCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.pollSession.findUnique({ where: { sessionCode } });
      if (!existing) break;
      sessionCode = generateSessionCode();
      attempts++;
    }

    const adminToken = generateAdminToken();

    const session = await prisma.pollSession.create({
      data: {
        sessionCode,
        title: title.trim(),
        adminToken,
        status: 'waiting',
      },
      include: { questions: { include: { options: true } } },
    });

    return NextResponse.json({
      id: session.id,
      sessionCode: session.sessionCode,
      title: session.title,
      status: session.status,
      adminToken: session.adminToken,
      questions: session.questions,
      createdAt: session.createdAt,
    });
  } catch (err) {
    console.error('[POST /api/sessions]', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
