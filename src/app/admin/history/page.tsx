'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SessionEntry {
  code: string;
  title: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Recover saved sessions
    const saved: SessionEntry[] = JSON.parse(localStorage.getItem('thiruppam-sessions') ?? '[]');

    // Also recover any admin-token:XXXX keys not yet in the list (older sessions)
    const savedCodes = new Set(saved.map((s) => s.code));
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('admin-token:')) {
        const code = key.replace('admin-token:', '');
        if (!savedCodes.has(code)) {
          saved.push({ code, title: '', createdAt: '' });
          savedCodes.add(code);
        }
      }
    }

    setSessions(saved);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen px-4 py-10 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-zinc-500 hover:text-white text-sm font-semibold transition">
            ← New session
          </Link>
          <h1 className="text-3xl font-black mt-3">Past Sessions</h1>
          <p className="text-zinc-400 mt-1 text-sm">Sessions created on this browser.</p>
        </div>
        <Link
          href="/admin/all"
          className="text-sm text-zinc-500 hover:text-brand-400 transition font-semibold"
        >
          View all sessions →
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
          <p className="text-4xl mb-3">📋</p>
          <p>No sessions yet. Create one to get started.</p>
          <Link href="/admin" className="mt-4 inline-block text-brand-400 hover:text-brand-300 text-sm font-semibold">
            Create a session →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.code}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{s.title || s.code}</p>
                <div className="flex items-center gap-3 mt-1">
                  {s.title && <span className="text-xs font-mono text-zinc-500 tracking-wider">{s.code}</span>}
                  {s.createdAt && (
                    <span className="text-xs text-zinc-600">
                      {new Date(s.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/results/${s.code}`}
                  className="px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white text-xs font-semibold transition"
                >
                  Results
                </Link>
                <Link
                  href={`/admin/session/${s.code}`}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
