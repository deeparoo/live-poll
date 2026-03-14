'use client';

import { useMemo } from 'react';
import type { WordEntry } from '@/types';
import { WORD_COLORS } from '@/lib/utils';

interface WordCloudProps {
  words: WordEntry[];
}

export default function WordCloud({ words }: WordCloudProps) {
  const maxCount = useMemo(() => Math.max(...words.map((w) => w.count), 1), [words]);

  const sized = useMemo(
    () =>
      words.map((w, i) => {
        const ratio = w.count / maxCount;
        const fontSize = Math.round(16 + ratio * 72); // 16–88px
        const rotation = Math.round((Math.sin(i * 137.5) * 15)); // deterministic ±15°
        const color = WORD_COLORS[i % WORD_COLORS.length];
        return { ...w, fontSize, rotation, color };
      }),
    [words, maxCount]
  );

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-xl">
        Waiting for responses…
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center p-6 h-full overflow-hidden">
      {sized.map(({ word, fontSize, rotation, color, count }) => (
        <span
          key={word}
          title={`${count} vote${count !== 1 ? 's' : ''}`}
          style={{
            fontSize: `${fontSize}px`,
            transform: `rotate(${rotation}deg)`,
            color,
            fontWeight: 700,
            lineHeight: 1.2,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: 'scaleIn 0.4s ease-out',
            textShadow: `0 2px 12px ${color}44`,
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
