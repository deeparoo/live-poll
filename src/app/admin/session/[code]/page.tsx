'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestionEditor from '@/components/admin/QuestionEditor';
import SessionControls from '@/components/admin/SessionControls';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import type { PollSession, PollQuestion, QuestionType } from '@/types';
import { getSocket } from '@/lib/socket-client';
import { cn } from '@/lib/utils';

export default function AdminSessionPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const sessionCode = code.toUpperCase();

  const [session, setSession] = useState<PollSession | null>(null);
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQId, setSelectedQId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PollQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [controlling, setControlling] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  // Load session
  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionCode}`);
    if (!res.ok) {
      setError('Session not found');
      return;
    }
    const data = await res.json();
    setSession(data);

    const activeQ = data.questions.find((q: PollQuestion) => q.isActive);
    if (activeQ && !selectedQId) setSelectedQId(activeQ.id);
    else if (!selectedQId && data.questions.length > 0) setSelectedQId(data.questions[0].id);
  }, [sessionCode, selectedQId]);

  useEffect(() => {
    const token = localStorage.getItem(`admin-token:${sessionCode}`);
    if (!token) {
      setError('Admin token not found. Did you create this session from this browser?');
      setLoading(false);
      return;
    }
    setAdminToken(token);
    fetchSession().finally(() => setLoading(false));
  }, [sessionCode, fetchSession]);

  // Socket for participant count
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:session', sessionCode);
    socket.on('participant:count', setParticipantCount);
    socket.on('poll:started', fetchSession);
    socket.on('poll:stopped', fetchSession);
    return () => {
      socket.off('participant:count', setParticipantCount);
      socket.off('poll:started', fetchSession);
      socket.off('poll:stopped', fetchSession);
    };
  }, [sessionCode, fetchSession]);

  async function control(action: string, questionId?: string) {
    setControlling(true);
    try {
      const res = await fetch(`/api/sessions/${sessionCode}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken, action, questionId }),
      });
      if (!res.ok) console.error('Control failed', await res.text());
      await fetchSession();
    } finally {
      setControlling(false);
    }
  }

  async function saveQuestion(data: { text: string; type: QuestionType; options: { text: string }[] }) {
    setSaving(true);
    try {
      if (editingQuestion) {
        await fetch(`/api/sessions/${sessionCode}/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminToken, ...data }),
        });
      } else {
        await fetch(`/api/sessions/${sessionCode}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminToken, ...data }),
        });
      }
      setShowEditor(false);
      setEditingQuestion(null);
      await fetchSession();
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm('Delete this question and all its votes?')) return;
    await fetch(
      `/api/sessions/${sessionCode}/questions/${questionId}?adminToken=${adminToken}`,
      { method: 'DELETE' }
    );
    if (selectedQId === questionId) setSelectedQId(null);
    await fetchSession();
  }

  const selectedQuestion = session?.questions.find((q) => q.id === selectedQId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Loading session…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-red-400 text-lg max-w-md">{error || 'Session not found'}</p>
        <Link href="/admin" className="text-brand-400 hover:text-brand-300">
          ← Create a new session
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-500 hover:text-white text-sm font-semibold transition">
              ⚡ LivePoll
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="font-black text-lg tracking-wider">{sessionCode}</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-semibold border',
                session.status === 'active'
                  ? 'text-emerald-400 border-emerald-800 bg-emerald-900/30'
                  : session.status === 'ended'
                  ? 'text-zinc-500 border-zinc-700'
                  : 'text-zinc-400 border-zinc-700'
              )}
            >
              {session.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-sm">{participantCount} connected</span>
            <button
              onClick={() => setShowQR((s) => !s)}
              className="px-4 py-1.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white text-sm font-semibold transition"
            >
              QR Code
            </button>
            <Link
              href={`/present/${sessionCode}`}
              target="_blank"
              className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold transition"
            >
              Presenter View ↗
            </Link>
          </div>
        </div>
      </header>

      {/* QR modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeDisplay sessionCode={sessionCode} size={260} />
            <button
              onClick={() => setShowQR(false)}
              className="mt-6 w-full py-2.5 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Questions list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Questions</h2>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowEditor(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition"
            >
              + Add Question
            </button>
          </div>

          {session.questions.length === 0 && !showEditor && (
            <div className="text-center py-16 text-zinc-500 border border-zinc-800 border-dashed rounded-2xl">
              <p className="text-4xl mb-3">📋</p>
              <p>No questions yet. Add one to get started.</p>
            </div>
          )}

          {session.questions.map((q, i) => (
            <div
              key={q.id}
              onClick={() => { setSelectedQId(q.id); setShowEditor(false); }}
              className={cn(
                'group rounded-2xl border p-4 cursor-pointer transition',
                selectedQId === q.id
                  ? 'border-brand-500 bg-brand-950/20'
                  : 'border-zinc-800 hover:border-zinc-600'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-zinc-500 font-mono text-sm mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-semibold text-white leading-snug">{q.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {q.type.replace('_', ' ')}
                      </span>
                      {q.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingQuestion(q);
                      setShowEditor(true);
                      setSelectedQId(q.id);
                    }}
                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition text-sm"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Editor */}
          {showEditor && (
            <QuestionEditor
              initial={editingQuestion ?? undefined}
              onSave={saveQuestion}
              onCancel={() => { setShowEditor(false); setEditingQuestion(null); }}
              saving={saving}
            />
          )}
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-widest mb-4">
              Controls
            </h3>
            <SessionControls
              question={selectedQuestion}
              sessionStatus={session.status}
              onStart={(qId) => control('start', qId)}
              onStop={() => control('stop')}
              onReset={(qId) => control('reset', qId)}
              loading={controlling}
            />
          </div>

          {/* Session info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-widest">
              Session Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Code</span>
                <span className="font-mono font-bold tracking-wider">{sessionCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Participants</span>
                <span className="font-bold">{participantCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Questions</span>
                <span className="font-bold">{session.questions.length}</span>
              </div>
            </div>
          </div>

          {/* End session */}
          <button
            onClick={() => {
              if (confirm('End the session? Participants will no longer be able to vote.')) {
                control('end');
              }
            }}
            className="w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-600 hover:border-red-900 hover:text-red-400 text-sm font-semibold transition"
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}
