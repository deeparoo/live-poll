import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/sessions/[code]/questions/[questionId] — update question + options
export async function PUT(
  req: NextRequest,
  { params }: { params: { code: string; questionId: string } }
) {
  try {
    const body = await req.json();
    const { adminToken, text, type, options } = body;

    const session = await prisma.pollSession.findUnique({
      where: { sessionCode: params.code.toUpperCase() },
    });
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.adminToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete old options and recreate to avoid partial-update complexity
    await prisma.option.deleteMany({ where: { questionId: params.questionId } });

    const question = await prisma.question.update({
      where: { id: params.questionId },
      data: {
        ...(text !== undefined && { text: text.trim() }),
        ...(type !== undefined && { type }),
        options: {
          create: (options ?? []).map((opt: { text: string }, i: number) => ({
            text: opt.text.trim(),
            order: i,
          })),
        },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json(question);
  } catch (err) {
    console.error('[PUT /api/.../questions/[questionId]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/sessions/[code]/questions/[questionId] — remove a question
export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string; questionId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const adminToken = searchParams.get('adminToken');

    const session = await prisma.pollSession.findUnique({
      where: { sessionCode: params.code.toUpperCase() },
    });
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.adminToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.question.delete({ where: { id: params.questionId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE .../questions/[questionId]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
