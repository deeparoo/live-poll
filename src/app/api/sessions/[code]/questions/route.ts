import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/sessions/[code]/questions — add a question
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await req.json();
    const { adminToken, text, type, options } = body;

    if (!text || !type) {
      return NextResponse.json({ error: 'text and type required' }, { status: 400 });
    }

    const session = await prisma.pollSession.findUnique({
      where: { sessionCode: params.code.toUpperCase() },
      include: { questions: true },
    });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.adminToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = session.questions.length;

    const question = await prisma.question.create({
      data: {
        sessionId: session.id,
        text: text.trim(),
        type,
        order,
        options: {
          create: (options ?? []).map((opt: { text: string }, i: number) => ({
            text: opt.text.trim(),
            order: i,
          })),
        },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    console.error('[POST /api/sessions/[code]/questions]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
