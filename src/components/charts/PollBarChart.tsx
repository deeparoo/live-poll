'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { OptionResult } from '@/types';
import { CHART_COLORS } from '@/lib/utils';

interface PollBarChartProps {
  options: OptionResult[];
  totalVotes: number;
  animate?: boolean;
}

export default function PollBarChart({ options, totalVotes, animate = true }: PollBarChartProps) {
  const data = options.map((opt) => ({
    name: opt.text,
    count: opt.count,
    percentage: opt.percentage,
    label: `${opt.percentage}% (${opt.count})`,
  }));

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 120, bottom: 8, left: 16 }}
          barCategoryGap="20%"
        >
          <XAxis
            type="number"
            domain={[0, Math.max(totalVotes, 1)]}
            hide
          />
          <YAxis
            type="category"
            dataKey="name"
            width={200}
            tick={{
              fill: '#e4e4f0',
              fontSize: 15,
              fontWeight: 600,
            }}
            tickLine={false}
            axisLine={false}
          />
          <Bar
            dataKey="count"
            radius={[0, 8, 8, 0]}
            isAnimationActive={animate}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                opacity={0.92}
              />
            ))}
            <LabelList
              dataKey="label"
              position="right"
              style={{
                fill: '#a1a1b5',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-geist-mono, monospace)',
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
