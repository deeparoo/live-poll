'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import ResultsDisplay from '@/components/presenter/ResultsDisplay';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { cn, formatNumber } from '@/lib/utils';
import type { PollQuestion, QuestionResults, PollSession } from '@/types';

export default function PresentPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) ?? '';
  const sessionCode = code.toUpperCase();

  const [session, setSession] = useState<PollSession | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<PollQuestion | null>(null);
  const [results, setResults] = useState<QuestionResults | null>(null);
  const [participantCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [connected, setConnected] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Track active question id to avoid unnecessary results fetches
  const activeQIdRef = useRef<string | null>(null);

  // Poll session + results every 2 seconds
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/sessions/${sessionCode}`);
        if (res.status === 404 && !cancelled) { setNotFound(true); return; }
        if (!res.ok || cancelled) return;
        const data: PollSession = await res.json();

        if (cancelled) return;
        setSession(data);
        setConnected(true);

        if (data.status === 'ended') {
          setActiveQuestion(null);
          setResults(null);
          return;
        }

        const activeQ = data.questions?.find((q: PollQuestion) => q.isActive) ?? null;
        setActiveQuestion(activeQ);

        if (activeQ) {
          // Only re-fetch results if we have the same question (avoid flicker on question change)
          const rRes = await fetch(
            `/api/sessions/${sessionCode}/results?questionId=${activeQ.id}`
          );
          if (rRes.ok && !cancelled) {
            setResults(await rRes.json());
            activeQIdRef.current = activeQ.id;
          }
        } else {
          // No active question — keep last results on screen (don't wipe the chart)
          // Results will naturally be replaced when a new question goes live
        }
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionCode]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'q':
        case 'Q':
          setShowQR((s) => !s);
          break;
        case 'c':
        case 'C':
          setChartType((t) => (t === 'bar' ? 'pie' : 'bar'));
          break;
        case '?':
          setShowShortcuts((s) => !s);
          break;
        case 'Escape':
          setShowShortcuts(false);
          if (isFullscreen) document.exitFullscreen?.();
          break;
      }
    },
    [isFullscreen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-white/40 text-6xl font-black">{sessionCode}</p>
        <p className="text-white/50 text-xl">Session not found</p>
        <a href="/" className="text-brand-400 hover:text-brand-300 text-sm mt-2">← Back to home</a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#080810] flex flex-col relative select-none"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-sm font-mono tracking-widest">{sessionCode}</span>
          {!connected && (
            <span className="text-amber-400 text-xs bg-amber-900/30 border border-amber-800 px-2 py-0.5 rounded-full">
              Connecting…
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={() => setChartType((t) => (t === 'bar' ? 'pie' : 'bar'))}
            className="text-white/30 hover:text-white/70 text-xs px-3 py-1 rounded-lg border border-white/10 hover:border-white/20 transition"
          >
            {chartType === 'bar' ? '●' : '▬'} Chart
          </button>
          <button
            onClick={toggleFullscreen}
            className="text-white/30 hover:text-white/70 text-xs px-3 py-1 rounded-lg border border-white/10 hover:border-white/20 transition"
          >
            {isFullscreen ? '⊡' : '⛶'} {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
          <button
            onClick={() => setShowShortcuts((s) => !s)}
            className="text-white/30 hover:text-white/70 text-xs w-7 h-7 rounded-lg border border-white/10 hover:border-white/20 flex items-center justify-center transition"
          >
            ?
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 sm:px-10 py-16 sm:py-16 gap-6">
        {/* Question */}
        <div className="text-center mt-4">
          {activeQuestion ? (
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-4xl mx-auto">
              {activeQuestion.text}
            </h1>
          ) : (
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-white/40">
                {session?.title ?? 'Thiruppam'}
              </h1>
              <p className="text-white/30 text-xl">Waiting for host to start a question…</p>
            </div>
          )}
        </div>

        {/* Chart area */}
        <div className="flex-1 min-h-0">
          {results && activeQuestion ? (
            <div className="h-full max-h-[65vh] animate-fade-in">
              <ResultsDisplay results={results} chartType={chartType} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              {activeQuestion && !results && (
                <p className="text-white/20 text-xl">Waiting for first vote…</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-4 sm:pb-6 flex items-end justify-between pointer-events-none">
        {/* Vote count */}
        <div className="space-y-0.5">
          <p className="text-4xl sm:text-6xl font-black text-white tabular-nums">
            {formatNumber(results?.totalVotes ?? 0)}
          </p>
          <p className="text-white/40 text-xs sm:text-sm font-semibold uppercase tracking-widest">
            votes
          </p>
        </div>

        {/* Participant count placeholder — Socket.io not available on Vercel */}
        <div className="text-center hidden sm:block">
          <p className="text-2xl font-bold text-white/50 tabular-nums">{participantCount}</p>
          <p className="text-white/30 text-xs uppercase tracking-widest">connected</p>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="pointer-events-auto" onClick={() => setShowQR(false)}>
            <QRCodeDisplay sessionCode={sessionCode} size={80} showUrl={true} />
          </div>
        )}
      </div>

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div
          className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 sm:p-8 space-y-4 w-[90vw] max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4">Keyboard Shortcuts</h3>
            {[
              ['F', 'Toggle fullscreen'],
              ['Q', 'Toggle QR code'],
              ['C', 'Switch chart type'],
              ['?', 'Show/hide shortcuts'],
              ['Esc', 'Close'],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-zinc-400">{desc}</span>
                <kbd className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-lg text-sm font-mono text-white">
                  {key}
                </kbd>
              </div>
            ))}
            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full mt-4 py-2.5 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
