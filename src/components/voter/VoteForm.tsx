'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PollQuestion } from '@/types';

interface VoteFormProps {
  question: PollQuestion;
  onSubmit: (payload: {
    questionId: string;
    optionId?: string;
    ratingValue?: number;
    wordValue?: string;
  }) => void;
  submitting?: boolean;
}

export default function VoteForm({ question, onSubmit, submitting = false }: VoteFormProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rating, setRating] = useState<number>(0);
  const [word, setWord] = useState('');

  const maxRating = question.options[0] ? parseInt(question.options[0].text, 10) || 5 : 5;
  const isMultiple = question.type === 'multiple_answer';

  function handleOptionClick(optionId: string) {
    if (isMultiple) {
      const next = new Set(selected);
      next.has(optionId) ? next.delete(optionId) : next.add(optionId);
      setSelected(next);
    } else {
      setSelected(new Set([optionId]));
    }
  }

  function handleSubmit() {
    if (question.type === 'word_cloud') {
      if (!word.trim()) return;
      onSubmit({ questionId: question.id, wordValue: word.trim() });
    } else if (question.type === 'rating') {
      if (rating === 0) return;
      onSubmit({ questionId: question.id, ratingValue: rating });
    } else {
      if (selected.size === 0) return;
      // For single choice or yes/no, send one optionId
      onSubmit({ questionId: question.id, optionId: Array.from(selected)[0] });
    }
  }

  // Word cloud input
  if (question.type === 'word_cloud') {
    return (
      <div className="space-y-6">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value.slice(0, 30))}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type a word or phrase…"
          maxLength={30}
          className="w-full rounded-2xl bg-zinc-800 border border-zinc-700 px-6 py-4 text-xl text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <SubmitButton disabled={!word.trim() || submitting} onClick={handleSubmit} />
      </div>
    );
  }

  // Rating
  if (question.type === 'rating') {
    return (
      <div className="space-y-8">
        <div className="flex gap-3 justify-center flex-wrap">
          {Array.from({ length: maxRating }, (_, i) => {
            const val = i + 1;
            const active = rating >= val;
            return (
              <button
                key={val}
                onClick={() => setRating(val)}
                className={cn(
                  'w-14 h-14 rounded-full text-2xl font-bold transition-all duration-150 border-2',
                  active
                    ? 'bg-amber-400 border-amber-400 text-zinc-900 scale-110'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-amber-400/50'
                )}
              >
                {val <= 5 ? '★' : val}
              </button>
            );
          })}
        </div>
        {rating > 0 && (
          <p className="text-center text-zinc-400 text-sm">
            You selected: <span className="text-white font-bold">{rating}</span> / {maxRating}
          </p>
        )}
        <SubmitButton disabled={rating === 0 || submitting} onClick={handleSubmit} />
      </div>
    );
  }

  // Multiple choice / yes-no / multiple answer
  const isYesNo = question.type === 'yes_no';
  return (
    <div className="space-y-6">
      <div className={cn('space-y-3', isYesNo && 'flex gap-4 space-y-0')}>
        {question.options.map((opt) => {
          const active = selected.has(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className={cn(
                'w-full rounded-2xl border-2 px-6 py-4 text-left text-lg font-semibold transition-all duration-150 focus:outline-none',
                active
                  ? 'bg-brand-600 border-brand-500 text-white scale-[1.01]'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:border-brand-500/50 hover:bg-zinc-700/80',
                isYesNo && 'flex-1 text-center',
                opt.text.toLowerCase() === 'yes' && active && '!bg-emerald-600 !border-emerald-500',
                opt.text.toLowerCase() === 'no' && active && '!bg-red-600 !border-red-500'
              )}
            >
              {isMultiple && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-5 h-5 rounded mr-3 border-2 text-xs',
                    active ? 'bg-white border-white text-brand-700' : 'border-zinc-600'
                  )}
                >
                  {active && '✓'}
                </span>
              )}
              {opt.text}
            </button>
          );
        })}
      </div>
      <SubmitButton disabled={selected.size === 0 || submitting} onClick={handleSubmit} />
    </div>
  );
}

function SubmitButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full rounded-2xl py-4 text-lg font-bold transition-all duration-200',
        disabled
          ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          : 'bg-brand-600 hover:bg-brand-500 text-white active:scale-95'
      )}
    >
      Submit Vote
    </button>
  );
}
