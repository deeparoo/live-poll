'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Enter a 6-character session code');
      return;
    }
    setJoining(true);
    setError('');
    try {
      const res = await fetch(`/api/sessions/${code}`);
      if (!res.ok) {
        setError('Session not found. Check the code and try again.');
        return;
      }
      router.push(`/join/${code}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-xl w-full text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thiruppam-logo.png" alt="Thiruppam" className="h-12 w-12 object-contain" />
            <span className="text-3xl font-black tracking-tight">Thiruppam</span>
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight">
            The story is{' '}
            <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
              in your hands.
            </span>
          </h1>
          <p className="text-zinc-400 text-xl">
            Listen to the drama unfold, and when the moment comes, you decide what happens next.
          </p>

          {/* Join panel */}
          <div className="mt-10 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-8 space-y-4">
            <p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
              Join the story
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="ABCD12"
                maxLength={6}
                className="flex-1 rounded-2xl bg-zinc-800 border border-zinc-700 px-5 py-3.5 text-xl font-mono text-center tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition"
              />
              <button
                onClick={handleJoin}
                disabled={joining || joinCode.length !== 6}
                className="px-6 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-2xl transition active:scale-95"
              >
                {joining ? '…' : 'Join'}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {/* Host CTA */}
          <div className="pt-2">
            <button
              onClick={() => router.push('/admin')}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-zinc-700 text-zinc-300 hover:border-brand-500/50 hover:text-white font-semibold transition"
            >
              <span>Host a session</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-zinc-600 text-sm">
        Thiruppam · By Kadhai Osai
      </footer>
    </div>
  );
}
