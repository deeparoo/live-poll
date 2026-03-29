'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SessionRow {
  sessionCode: string;
  title: string;
  status: string;
  createdAt: string;
  _count: { questions: number };
}

const TOKEN_KEY = 'thiruppam-super-token';

export default function AllSessionsPage() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY) ?? '';
    setSavedToken(stored);
    setToken(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (savedToken) fetchSessions(savedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedToken]);

  async function fetchSessions(t: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sessions', {
        headers: { 'x-super-admin-token': t },
      });
      if (res.status === 401) { setError('Invalid token'); setSavedToken(''); return; }
      if (!res.ok) { setError('Failed to load'); return; }
      const data: SessionRow[] = await res.json();
      setSessions(data);
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim()) { setSavedToken(token.trim()); fetchSessions(token.trim()); }
  }

  function handleForget() {
    localStorage.removeItem(TOKEN_KEY);
    setSavedToken('');
    setSessions([]);
    setToken('');
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto space-y-8">
      <div>
        <Link href="/admin" className="text-zinc-500 hover:text-white text-sm font-semibold transition">
          ← Admin
        </Link>
        <h1 className="text-3xl font-black mt-3">All Sessions</h1>
        <p className="text-zinc-400 mt-1 text-sm">Every poll ever created, across all devices.</p>
      </div>

      {/* Token gate */}
      {!savedToken ? (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 max-w-md">
          <p className="text-sm text-zinc-400">
            Enter your <code className="text-zinc-300 bg-zinc-800 px-1 rounded">SUPER_ADMIN_TOKEN</code> to continue.
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token…"
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!token.trim()}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition"
          >
            Unlock →
          </button>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">{sessions.length} session{sessions.length !== 1 ? 's' : ''} found</span>
            <button onClick={handleForget} className="text-zinc-600 hover:text-zinc-400 transition">
              Forget token
            </button>
          </div>

          {loading ? (
            <p className="text-zinc-500">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="text-zinc-500">No sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.sessionCode}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{s.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs font-mono text-zinc-500 tracking-wider">{s.sessionCode}</span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full border font-semibold',
                          s.status === 'active'
                            ? 'text-emerald-400 border-emerald-800 bg-emerald-900/20'
                            : s.status === 'ended'
                            ? 'text-zinc-500 border-zinc-700'
                            : 'text-zinc-400 border-zinc-700'
                        )}
                      >
                        {s.status}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {s._count.questions} Q
                      </span>
                      <span className="text-xs text-zinc-600">
                        {new Date(s.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/results/${s.sessionCode}`}
                      className="px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white text-xs font-semibold transition"
                    >
                      Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
