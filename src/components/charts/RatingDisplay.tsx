'use client';

import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { RatingBucket } from '@/types';

interface RatingDisplayProps {
  averageRating: number;
  ratingDistribution: RatingBucket[];
  maxRating: number;
  totalVotes: number;
}

const STAR_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee'];

export default function RatingDisplay({
  averageRating,
  ratingDistribution,
  maxRating,
  totalVotes,
}: RatingDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-8 h-full justify-center">
      {/* Big average */}
      <div className="text-center">
        <p className="text-8xl font-black text-white tabular-nums">
          {averageRating.toFixed(1)}
        </p>
        <p className="text-zinc-400 text-xl mt-2">
          avg out of {maxRating} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Star row */}
      <div className="flex gap-2">
        {Array.from({ length: maxRating }, (_, i) => {
          const filled = i + 1 <= Math.round(averageRating);
          return (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className="w-10 h-10"
              fill={filled ? '#facc15' : 'none'}
              stroke={filled ? '#facc15' : '#4b5563'}
              strokeWidth={2}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          );
        })}
      </div>

      {/* Distribution bar chart */}
      <div className="w-full max-w-lg h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ratingDistribution}
            margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
            barCategoryGap="15%"
          >
            <XAxis
              dataKey="rating"
              tick={{ fill: '#9ca3af', fontSize: 14 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid #2e2e4e',
                borderRadius: 8,
                color: '#f0f0f5',
                fontSize: 13,
              }}
              formatter={(v) => [`${v} votes`]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
              {ratingDistribution.map((entry, i) => (
                <Cell key={i} fill={STAR_COLORS[i % STAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
