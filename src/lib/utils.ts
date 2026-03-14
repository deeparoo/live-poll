import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generates a 6-character session code — unambiguous characters only
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const array = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    for (let i = 0; i < 6; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

export function generateAdminToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getJoinUrl(sessionCode: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  ).trim().replace(/\/$/, '');
  return `${base}/join/${sessionCode}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

// Normalize word for word cloud grouping
export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
}

// Chart colors — accessible, high-contrast palette
export const CHART_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

export const WORD_COLORS = [
  '#a5b4fc',
  '#c4b5fd',
  '#f9a8d4',
  '#fcd34d',
  '#6ee7b7',
  '#67e8f9',
  '#fdba74',
  '#bef264',
  '#818cf8',
  '#e879f9',
];
