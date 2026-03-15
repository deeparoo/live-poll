'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { OptionResult } from '@/types';
import { CHART_COLORS } from '@/lib/utils';

interface PollPieChartProps {
  options: OptionResult[];
  animate?: boolean;
}

export default function PollPieChart({ options, animate = true }: PollPieChartProps) {
  const data = options.map((opt) => ({
    name: opt.text,
    value: opt.count,
    percentage: opt.percentage,
  }));

  return (
    <div className="w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height={420}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="70%"
            paddingAngle={3}
            dataKey="value"
            isAnimationActive={animate}
            animationDuration={600}
            label={({ percentage }) => `${percentage}%`}
            labelLine={{ stroke: '#6366f1', strokeWidth: 1 }}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid #2e2e4e',
              borderRadius: 8,
              color: '#f0f0f5',
            }}
            formatter={(value, name) => [`${value} votes`, name]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#c4c4dc', fontSize: 14 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
