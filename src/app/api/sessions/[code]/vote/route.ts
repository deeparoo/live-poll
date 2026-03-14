import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateResults } from '@/lib/results';
import { scheduleBroadcast } from '@/lib/broadcast';
import { normalizeWord } from '@/lib/utils';

// POST /api/sessions/[code]/vote — submit a vote
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await req.json();
    const { questionId, optionId, ratingValue, wordValue, deviceHash } = body as {
      questionId: string;
      optionId?: string;
      ratingValue?: number;
      wordValue?: string;
      deviceHash: string;
    };

    if (!questionId || !deviceHash) {
      return NextResponse.json({ error: 'questionId and deviceHash required' }, { status: 400 });
    }

    // Validate device hash length to prevent abuse
    if (deviceHash.length > 256) {
      return NextResponse.json({ error: 'Invalid deviceHash' }, { status: 400 });
    }

    const sessionCode = params.code.toUpperCase();

    // Verify session is active and question is active
    const session = await prisma.pollSession.findUnique({
      where: { sessionCode },
    });

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 409 });
    }

    const question = await prisma.question.findFirst({
      where: { id: questionId, sessionId: session.id, isActive: true },
      include: { options: true },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found or not active' }, { status: 409 });
    }

    // Validate vote payload per question type
    if (question.type === 'word_cloud') {
      if (!wordValue || typeof wordValue !== 'string') {
        return NextResponse.json({ error: 'wordValue required for word cloud' }, { status: 400 });
      }
    } else if (question.type === 'rating') {
      if (ratingValue == null || typeof ratingValue !== 'number') {
        return NextResponse.json({ error: 'ratingValue required for rating' }, { status: 400 });
      }
      const maxRating = question.options[0] ? parseInt(question.options[0].text, 10) || 5 : 5;
      if (ratingValue < 1 || ratingValue > maxRating) {
        return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 });
      }
    } else {
      if (!optionId) {
        return NextResponse.json({ error: 'optionId required' }, { status: 400 });
      }
      const validOption = question.options.some((o) => o.id === optionId);
      if (!validOption) {
        return NextResponse.json({ error: 'Invalid optionId' }, { status: 400 });
      }
    }

    try {
      await prisma.userVote.create({
        data: {
          sessionCode,
          questionId,
          optionId: optionId ?? null,
          ratingValue: ratingValue ?? null,
          wordValue: wordValue ? normalizeWord(wordValue) : null,
          deviceHash,
        },
      });
    } catch (err: unknown) {
      // Unique constraint violation = already voted
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return NextResponse.json({ error: 'Already voted', alreadyVoted: true }, { status: 409 });
      }
      throw err;
    }

    // Throttled broadcast to all session participants
    scheduleBroadcast(sessionCode, async () => {
      const results = await calculateResults(questionId);
      globalThis.io?.to(`session:${sessionCode}`).emit('results:update', results);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /vote]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
