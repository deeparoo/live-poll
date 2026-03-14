'use client';

import { cn } from '@/lib/utils';
import type { PollQuestion, SessionStatus } from '@/types';

interface SessionControlsProps {
  question: PollQuestion | null;
  sessionStatus: SessionStatus;
  onStart: (questionId: string) => void;
  onStop: () => void;
  onReset: (questionId: string) => void;
  loading?: boolean;
}

export default function SessionControls({
  question,
  sessionStatus,
  onStart,
  onStop,
  onReset,
  loading,
}: SessionControlsProps) {
  const isActive = question?.isActive ?? false;

  if (!question) {
    return (
      <div className="text-center py-8 text-zinc-500">
        Select a question to control it
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold',
            isActive
              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
            )}
          />
          {isActive ? 'Live' : sessionStatus === 'ended' ? 'Ended' : 'Idle'}
        </span>
      </div>

      {/* Primary control */}
      {!isActive ? (
        <button
          onClick={() => onStart(question.id)}
          disabled={loading || sessionStatus === 'ended'}
          className={cn(
            'w-full py-3 rounded-xl font-bold text-lg transition',
            loading || sessionStatus === 'ended'
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
          )}
        >
          {loading ? 'Starting…' : '▶ Go Live'}
        </button>
      ) : (
        <button
          onClick={onStop}
          disabled={loading}
          className={cn(
            'w-full py-3 rounded-xl font-bold text-lg transition',
            loading
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
          )}
        >
          {loading ? 'Stopping…' : '■ Stop Poll'}
        </button>
      )}

      {/* Reset */}
      <button
        onClick={() => onReset(question.id)}
        disabled={loading}
        className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-400 font-semibold hover:border-amber-600/50 hover:text-amber-400 transition text-sm"
      >
        ↺ Reset Results
      </button>
    </div>
  );
}
