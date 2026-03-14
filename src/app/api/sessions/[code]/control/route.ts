import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateResults } from '@/lib/results';

type ControlAction = 'start' | 'stop' | 'reset' | 'end';

// POST /api/sessions/[code]/control — admin poll controls
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await req.json();
    const { adminToken, action, questionId } = body as {
      adminToken: string;
      action: ControlAction;
      questionId?: string;
    };

    const session = await prisma.pollSession.findUnique({
      where: { sessionCode: params.code.toUpperCase() },
      include: { questions: { include: { options: true } } },
    });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (session.adminToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const io = globalThis.io;
    const room = `session:${params.code.toUpperCase()}`;

    if (action === 'start') {
      if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 });

      // Deactivate all questions, activate the selected one
      await prisma.question.updateMany({
        where: { sessionId: session.id },
        data: { isActive: false },
      });
      await prisma.question.update({
        where: { id: questionId },
        data: { isActive: true },
      });
      await prisma.pollSession.update({
        where: { id: session.id },
        data: { status: 'active' },
      });

      const question = session.questions.find((q) => q.id === questionId);
      const results = await calculateResults(questionId);

      io?.to(room).emit('poll:started', { question, results });
      return NextResponse.json({ success: true, action: 'started' });
    }

    if (action === 'stop') {
      // Find the active question
      const activeQ = session.questions.find((q) => q.isActive);
      if (activeQ) {
        await prisma.question.update({ where: { id: activeQ.id }, data: { isActive: false } });
      }
      await prisma.pollSession.update({
        where: { id: session.id },
        data: { status: 'waiting' },
      });

      io?.to(room).emit('poll:stopped');
      return NextResponse.json({ success: true, action: 'stopped' });
    }

    if (action === 'reset') {
      if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 });

      await prisma.userVote.deleteMany({ where: { questionId } });
      const results = await calculateResults(questionId);

      io?.to(room).emit('poll:reset', { questionId });
      io?.to(room).emit('results:update', results);
      return NextResponse.json({ success: true, action: 'reset' });
    }

    if (action === 'end') {
      await prisma.question.updateMany({
        where: { sessionId: session.id },
        data: { isActive: false },
      });
      await prisma.pollSession.update({
        where: { id: session.id },
        data: { status: 'ended' },
      });

      io?.to(room).emit('session:ended');
      return NextResponse.json({ success: true, action: 'ended' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[POST /control]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
