/**
 * Throttled broadcast — prevents socket storm when 600 users vote simultaneously.
 * Guarantees at most 1 broadcast per THROTTLE_MS per session (5/sec default).
 */

const lastBroadcastTime = new Map<string, number>();
const pendingBroadcasts = new Map<string, ReturnType<typeof setTimeout>>();

const THROTTLE_MS = 200; // max 5 broadcasts per second per session

export function scheduleBroadcast(
  sessionCode: string,
  callback: () => Promise<void>,
  throttleMs = THROTTLE_MS
): void {
  const now = Date.now();
  const last = lastBroadcastTime.get(sessionCode) ?? 0;
  const elapsed = now - last;

  // Cancel any pending broadcast for this session
  const existing = pendingBroadcasts.get(sessionCode);
  if (existing) clearTimeout(existing);

  // If enough time has passed, fire immediately; otherwise wait out the remainder
  const delay = elapsed >= throttleMs ? 0 : throttleMs - elapsed;

  const timeout = setTimeout(async () => {
    lastBroadcastTime.set(sessionCode, Date.now());
    pendingBroadcasts.delete(sessionCode);
    try {
      await callback();
    } catch (err) {
      console.error(`[broadcast] Error for session ${sessionCode}:`, err);
    }
  }, delay);

  pendingBroadcasts.set(sessionCode, timeout);
}
