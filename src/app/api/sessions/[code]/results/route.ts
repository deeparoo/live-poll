import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateResults } from '@/lib/results';

// GET /api/sessions/[code]/results?questionId=xxx — fetch current results
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    const session = await prisma.pollSession.findUnique({
      where: { sessionCode: params.code.toUpperCase() },
      include: {
        questions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const targetId = questionId ?? session.questions[0]?.id;
    if (!targetId) {
      return NextResponse.json({ results: null, totalVotes: 0 });
    }

    const results = await calculateResults(targetId);
    return NextResponse.json(results);
  } catch (err) {
    console.error('[GET /results]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
