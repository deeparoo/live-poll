'use client';

import type { QuestionResults } from '@/types';
import PollBarChart from '@/components/charts/PollBarChart';
import PollPieChart from '@/components/charts/PollPieChart';
import WordCloud from '@/components/charts/WordCloud';
import RatingDisplay from '@/components/charts/RatingDisplay';

interface ResultsDisplayProps {
  results: QuestionResults;
  chartType?: 'bar' | 'pie';
}

export default function ResultsDisplay({ results, chartType = 'bar' }: ResultsDisplayProps) {
  const { questionType, options, words, averageRating, ratingDistribution, maxRating } = results;

  if (questionType === 'word_cloud') {
    return (
      <div className="w-full h-full">
        <WordCloud words={words ?? []} />
      </div>
    );
  }

  if (questionType === 'rating') {
    return (
      <RatingDisplay
        averageRating={averageRating ?? 0}
        ratingDistribution={ratingDistribution ?? []}
        maxRating={maxRating ?? 5}
        totalVotes={results.totalVotes}
      />
    );
  }

  if (!options) return null;

  if (chartType === 'pie') {
    return <PollPieChart options={options} />;
  }

  return <PollBarChart options={options} totalVotes={results.totalVotes} />;
}
