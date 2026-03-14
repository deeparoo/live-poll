import { prisma } from './prisma';
import { normalizeWord } from './utils';
import type { QuestionResults, QuestionType } from '@/types';

export async function calculateResults(questionId: string): Promise<QuestionResults | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      options: { orderBy: { order: 'asc' } },
      votes: true,
    },
  });

  if (!question) return null;

  const totalVotes = question.votes.length;
  const type = question.type as QuestionType;

  // --- Word cloud ---
  if (type === 'word_cloud') {
    const wordCounts = new Map<string, number>();
    for (const vote of question.votes) {
      if (vote.wordValue) {
        const word = normalizeWord(vote.wordValue);
        wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
      }
    }
    const words = Array.from(wordCounts.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);

    return { questionId: question.id, questionText: question.text, questionType: type, totalVotes, words };
  }

  // --- Rating ---
  if (type === 'rating') {
    const maxRating = question.options[0] ? parseInt(question.options[0].text, 10) || 5 : 5;
    const ratingCounts = new Map<number, number>();
    let sum = 0;

    for (const vote of question.votes) {
      if (vote.ratingValue != null) {
        ratingCounts.set(vote.ratingValue, (ratingCounts.get(vote.ratingValue) ?? 0) + 1);
        sum += vote.ratingValue;
      }
    }

    const averageRating = totalVotes > 0 ? Math.round((sum / totalVotes) * 10) / 10 : 0;
    const ratingDistribution = Array.from({ length: maxRating }, (_, i) => ({
      rating: i + 1,
      count: ratingCounts.get(i + 1) ?? 0,
    }));

    return {
      questionId: question.id,
      questionText: question.text,
      questionType: type,
      totalVotes,
      averageRating,
      ratingDistribution,
      maxRating,
    };
  }

  // --- Multiple choice / multiple answer / yes_no ---
  const optionCounts = new Map<string, number>(question.options.map((o) => [o.id, 0]));
  for (const vote of question.votes) {
    if (vote.optionId) {
      optionCounts.set(vote.optionId, (optionCounts.get(vote.optionId) ?? 0) + 1);
    }
  }

  const options = question.options.map((opt) => {
    const count = optionCounts.get(opt.id) ?? 0;
    return {
      optionId: opt.id,
      text: opt.text,
      count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
    };
  });

  return {
    questionId: question.id,
    questionText: question.text,
    questionType: type,
    totalVotes,
    options,
  };
}
