'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ResultsDisplay from '@/components/presenter/ResultsDisplay';
import { cn } from '@/lib/utils';
import type { PollSession, PollQuestion, QuestionResults } from '@/types';

interface QuestionWithResults {
  question: PollQuestion;
  results: QuestionResults | null;
}

export default function ResultsPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) ?? '';
  const sessionCode = code.toUpperCase();

  const [session, setSession] = useState<PollSession | null>(null);
  const [data, setData] = useState<QuestionWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionCode}`);
        if (!res.ok) { setError('Session not found'); return; }
        const s: PollSession = await res.json();
        setSession(s);

        // Fetch results for every question in parallel
        const items = await Promise.all(
          s.questions.map(async (q: PollQuestion) => {
            try {
              const r = await fetch(`/api/sessions/${sessionCode}/results?questionId=${q.id}`);
              const results: QuestionResults = r.ok ? await r.json() : null;
              return { question: q, results };
            } catch {
              return { question: q, results: null };
            }
          })
        );
        setData(items);
      } catch {
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Loading results…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-400 text-lg">{error || 'Session not found'}</p>
        <Link href="/admin/history" className="text-brand-400 hover:text-brand-300 text-sm">
          ← Back to history
        </Link>
      </div>
    );
  }

  const totalVotesAllQuestions = data.reduce((sum, d) => sum + (d.results?.totalVotes ?? 0), 0);

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <Link href="/admin/history" className="text-zinc-500 hover:text-white text-sm font-semibold transition">
          ← Back to history
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">{session.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-zinc-400 text-sm tracking-widest">{sessionCode}</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-semibold border',
                  session.status === 'active'
                    ? 'text-emerald-400 border-emerald-800 bg-emerald-900/30'
                    : session.status === 'ended'
                    ? 'text-zinc-500 border-zinc-700 bg-zinc-800/30'
                    : 'text-zinc-400 border-zinc-700'
                )}
              >
                {session.status}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-black tabular-nums">{totalVotesAllQuestions.toLocaleString()}</p>
            <p className="text-zinc-500 text-xs uppercase tracking-widest">total votes</p>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex gap-6 mt-4 text-sm text-zinc-500">
          <span>{session.questions.length} question{session.questions.length !== 1 ? 's' : ''}</span>
          <span>
            Created{' '}
            {new Date(session.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* Per-question results */}
      {data.length === 0 && (
        <p className="text-zinc-500 text-center py-10">No questions in this session.</p>
      )}

      {data.map(({ question, results }, i) => (
        <div key={question.id} className="space-y-4">
          {/* Question header */}
          <div className="flex items-start gap-3">
            <span className="text-zinc-600 font-mono text-sm shrink-0 mt-1">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white leading-snug">{question.text}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {question.type.replace('_', ' ')}
                </span>
                {results && (
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {results.totalVotes.toLocaleString()} vote{results.totalVotes !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Chart */}
          {results && results.totalVotes > 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-6">
              <ResultsDisplay results={results} chartType="bar" />
            </div>
          ) : (
            <div className="border border-zinc-800 border-dashed rounded-2xl py-8 text-center text-zinc-600 text-sm">
              No votes recorded
            </div>
          )}

          {i < data.length - 1 && <hr className="border-zinc-800 mt-6" />}
        </div>
      ))}

      {/* Footer actions */}
      <div className="flex gap-3 pt-4">
        <Link
          href={`/admin/session/${sessionCode}`}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold transition"
        >
          Manage session
        </Link>
        <Link
          href={`/present/${sessionCode}`}
          className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white text-sm font-semibold transition"
        >
          Presenter view ↗
        </Link>
      </div>
    </div>
  );
}
