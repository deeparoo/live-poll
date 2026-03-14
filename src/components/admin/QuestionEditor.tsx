'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PollQuestion, QuestionType } from '@/types';

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice', description: 'Single answer' },
  { value: 'multiple_answer', label: 'Multiple Answer', description: 'Multi-select' },
  { value: 'yes_no', label: 'Yes / No', description: 'Two options' },
  { value: 'rating', label: 'Rating Scale', description: '1–5 or 1–10' },
  { value: 'word_cloud', label: 'Word Cloud', description: 'Free text' },
];

interface QuestionEditorProps {
  initial?: Partial<PollQuestion>;
  onSave: (data: { text: string; type: QuestionType; options: { text: string }[] }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function QuestionEditor({
  initial,
  onSave,
  onCancel,
  saving,
}: QuestionEditorProps) {
  const [text, setText] = useState(initial?.text ?? '');
  const [type, setType] = useState<QuestionType>(initial?.type ?? 'multiple_choice');
  const [options, setOptions] = useState<string[]>(
    initial?.options?.map((o) => o.text) ?? ['', '']
  );
  const [maxRating, setMaxRating] = useState(5);

  function addOption() {
    setOptions((prev) => [...prev, '']);
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, j) => j !== i));
  }

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, j) => (j === i ? val : o)));
  }

  function buildOptions(): { text: string }[] {
    if (type === 'yes_no') return [{ text: 'Yes' }, { text: 'No' }];
    if (type === 'rating') return [{ text: String(maxRating) }];
    if (type === 'word_cloud') return [];
    return options.filter((o) => o.trim()).map((o) => ({ text: o.trim() }));
  }

  function handleSave() {
    if (!text.trim()) return;
    onSave({ text: text.trim(), type, options: buildOptions() });
  }

  const needsOptions = type === 'multiple_choice' || type === 'multiple_answer';
  const canSave =
    text.trim() &&
    (type === 'yes_no' ||
      type === 'rating' ||
      type === 'word_cloud' ||
      options.filter((o) => o.trim()).length >= 2);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-6 animate-slide-up">
      {/* Question text */}
      <div>
        <label className="block text-sm font-semibold text-zinc-400 mb-2">Question</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask your audience something…"
          rows={2}
          className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 resize-none transition"
        />
      </div>

      {/* Type selector */}
      <div>
        <label className="block text-sm font-semibold text-zinc-400 mb-2">Poll Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {QUESTION_TYPES.map((qt) => (
            <button
              key={qt.value}
              onClick={() => setType(qt.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition',
                type === qt.value
                  ? 'border-brand-500 bg-brand-600/20 text-white'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
              )}
            >
              <p className="font-semibold text-sm">{qt.label}</p>
              <p className="text-xs opacity-60">{qt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Options for choice-based */}
      {needsOptions && (
        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">Options</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 8 && (
            <button
              onClick={addOption}
              className="mt-3 text-sm text-brand-400 hover:text-brand-300 font-semibold transition"
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {/* Rating scale selector */}
      {type === 'rating' && (
        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">Scale</label>
          <div className="flex gap-3">
            {[5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setMaxRating(n)}
                className={cn(
                  'px-5 py-2 rounded-xl border font-semibold text-sm transition',
                  maxRating === n
                    ? 'border-brand-500 bg-brand-600/20 text-white'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                )}
              >
                1–{n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-zinc-400 font-semibold hover:border-zinc-500 hover:text-white transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={cn(
            'flex-1 rounded-xl py-3 font-bold transition',
            canSave && !saving
              ? 'bg-brand-600 hover:bg-brand-500 text-white'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          )}
        >
          {saving ? 'Saving…' : 'Save Question'}
        </button>
      </div>
    </div>
  );
}
