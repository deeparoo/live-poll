import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sessions/[code] — fetch session with questions
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await prisma.pollSession.findUnique({
      where: { sessionCode: params.code.toUpperCase() },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Strip admin token from public response
    const { adminToken: _, ...publicSession } = session;
    return NextResponse.json(publicSession);
  } catch (err) {
    console.error('[GET /api/sessions/[code]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/sessions/[code] — update session (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await req.json();
    const { adminToken, title, bgImage, status } = body;

    const session = await prisma.pollSession.findUnique({
      where: { sessionCode: params.code.toUpperCase() },
    });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.adminToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await prisma.pollSession.update({
      where: { id: session.id },
      data: {
        ...(title !== undefined && { title }),
        ...(bgImage !== undefined && { bgImage }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ status: updated.status, title: updated.title });
  } catch (err) {
    console.error('[PATCH /api/sessions/[code]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
