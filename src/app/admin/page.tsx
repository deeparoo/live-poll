'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!res.ok) {
        setError('Failed to create session');
        return;
      }

      const session = await res.json();

      // Store admin token securely in localStorage
      localStorage.setItem(`admin-token:${session.sessionCode}`, session.adminToken);

      // Track session in history list
      const history = JSON.parse(localStorage.getItem('thiruppam-sessions') ?? '[]');
      history.unshift({ code: session.sessionCode, title: title.trim(), createdAt: new Date().toISOString() });
      localStorage.setItem('thiruppam-sessions', JSON.stringify(history.slice(0, 50)));

      router.push(`/admin/session/${session.sessionCode}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back */}
        <a
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-semibold transition"
        >
          ← Back
        </a>

        <div>
          <h1 className="text-3xl font-black">Create a Session</h1>
          <p className="text-zinc-400 mt-2">
            Give your poll session a title. You'll manage questions on the next screen.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-2">
              Session Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Company All-Hands Q&A"
              className="w-full rounded-2xl bg-zinc-800 border border-zinc-700 px-5 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition text-lg"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-2xl transition text-lg active:scale-95"
          >
            {creating ? 'Creating…' : 'Create Session →'}
          </button>
        </div>

        <p className="text-xs text-zinc-600 text-center">
          Your admin token will be saved in this browser. Don't clear storage while presenting.
        </p>

        <a
          href="/admin/history"
          className="block text-center text-sm text-zinc-500 hover:text-brand-400 transition"
        >
          View past sessions →
        </a>
      </div>
    </div>
  );
}
