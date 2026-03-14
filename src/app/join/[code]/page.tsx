'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import VoteForm from '@/components/voter/VoteForm';
import type { PollQuestion, SessionStatus } from '@/types';

type VotedState = { questionId: string; answer: string };

async function getDeviceHash(): Promise<string> {
  const stored = sessionStorage.getItem('device-hash');
  if (stored) return stored;

  try {
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const hash = result.visitorId;
    sessionStorage.setItem('device-hash', hash);
    return hash;
  } catch {
    // Fallback: random + stored
    const fallback = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    sessionStorage.setItem('device-hash', fallback);
    return fallback;
  }
}

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) ?? '';
  const sessionCode = code.toUpperCase();

  const [status, setStatus] = useState<SessionStatus>('waiting');
  const [activeQuestion, setActiveQuestion] = useState<PollQuestion | null>(null);
  const [voted, setVoted] = useState<VotedState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [connected, setConnected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [deviceHash, setDeviceHash] = useState('');

  // Keep voted ref so polling can read it without stale closure
  const votedRef = useRef(voted);
  useEffect(() => { votedRef.current = voted; }, [voted]);

  // Check if already voted for a question
  const hasVoted = useCallback(
    (questionId: string) => {
      return voted?.questionId === questionId;
    },
    [voted]
  );

  // Init fingerprint
  useEffect(() => {
    getDeviceHash().then(setDeviceHash);
  }, []);

  // Poll session every 2 seconds
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/sessions/${sessionCode}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();

        if (cancelled) return;
        setSessionTitle(data.title);
        setStatus(data.status);
        setConnected(true);

        if (data.status === 'ended') {
          setSessionEnded(true);
          setActiveQuestion(null);
          return;
        }

        const activeQ: PollQuestion | undefined = data.questions?.find(
          (q: PollQuestion) => q.isActive
        );

        setActiveQuestion(activeQ ?? null);

        // If the new active question is different from what the user voted on,
        // clear voted state so they can vote on the new question
        if (activeQ && votedRef.current?.questionId !== activeQ.id) {
          // Only clear if it's a genuinely new question (not just a re-render)
          // We preserve voted state if questionId matches
        }
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionCode]);

  async function submitVote(payload: {
    questionId: string;
    optionId?: string;
    ratingValue?: number;
    wordValue?: string;
  }) {
    if (!deviceHash) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, deviceHash }),
      });

      const data = await res.json();

      if (res.status === 409 && data.alreadyVoted) {
        setError('You already voted for this question');
        setVoted({ questionId: payload.questionId, answer: 'Already submitted' });
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Vote failed. Please try again.');
        return;
      }

      // Record the submitted answer for display
      let answer = '';
      if (payload.wordValue) answer = payload.wordValue;
      else if (payload.ratingValue) answer = `${payload.ratingValue} stars`;
      else if (payload.optionId && activeQuestion) {
        answer = activeQuestion.options.find((o) => o.id === payload.optionId)?.text ?? '';
      }

      setVoted({ questionId: payload.questionId, answer });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // --- Render ---

  if (sessionEnded) {
    return (
      <Screen title={sessionTitle} code={sessionCode}>
        <div className="text-center space-y-4">
          <span className="text-6xl">🏁</span>
          <h2 className="text-2xl font-bold">Session ended</h2>
          <p className="text-zinc-400">Thanks for participating!</p>
        </div>
      </Screen>
    );
  }

  if (!activeQuestion) {
    return (
      <Screen title={sessionTitle} code={sessionCode}>
        <div className="text-center space-y-5">
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold">Waiting for the host…</h2>
          <p className="text-zinc-400">The next question will appear here automatically.</p>
          {!connected && (
            <p className="text-amber-400 text-sm">Connecting…</p>
          )}
        </div>
      </Screen>
    );
  }

  const alreadyVoted = hasVoted(activeQuestion.id);

  return (
    <Screen title={sessionTitle} code={sessionCode}>
      {alreadyVoted ? (
        <div className="text-center space-y-5 animate-scale-in">
          <span className="text-6xl">✅</span>
          <h2 className="text-2xl font-bold">Vote submitted!</h2>
          {voted?.answer && (
            <p className="text-zinc-400">
              Your answer: <span className="text-white font-semibold">&ldquo;{voted.answer}&rdquo;</span>
            </p>
          )}
          <p className="text-zinc-500 text-sm">Results will show on the main screen.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
              Question
            </span>
            <h2 className="text-2xl font-bold leading-tight mt-1">{activeQuestion.text}</h2>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <VoteForm
            question={activeQuestion}
            onSubmit={submitVote}
            submitting={submitting}
          />
        </div>
      )}
    </Screen>
  );
}

function Screen({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 px-4 h-12 flex items-center justify-between">
        <span className="text-sm font-bold text-zinc-400 tracking-widest">{code}</span>
        <span className="text-sm text-zinc-500 truncate max-w-[60%]">{title}</span>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
