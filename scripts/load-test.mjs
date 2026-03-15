#!/usr/bin/env node
/**
 * Load test — 500 concurrent votes
 *
 * Usage:
 *   node scripts/load-test.mjs <BASE_URL> <SESSION_CODE> <QUESTION_ID>
 *
 * Example:
 *   node scripts/load-test.mjs https://live-poll-ruddy.vercel.app V5VLSN cmmqe2a5l00023zt9eu9pe85l
 *
 * The script fires CONCURRENCY votes simultaneously, waits for all to settle,
 * then prints a summary: success / already-voted / error counts + p50/p95/p99 latency.
 *
 * NOTE: Reset the question results in the admin panel before running,
 * otherwise the unique-vote constraint will reject duplicates from a previous run.
 */

const [, , BASE_URL, SESSION_CODE, QUESTION_ID, OPTION_ID] = process.argv;

if (!BASE_URL || !SESSION_CODE || !QUESTION_ID) {
  console.error(
    'Usage: node scripts/load-test.mjs <BASE_URL> <SESSION_CODE> <QUESTION_ID> [OPTION_ID]'
  );
  process.exit(1);
}

const CONCURRENCY = 500;
const VOTE_URL = `${BASE_URL}/api/sessions/${SESSION_CODE}/vote`;

// Generate a unique fake device hash per simulated voter
function fakeDeviceHash(i) {
  return `loadtest-device-${String(i).padStart(6, '0')}-${Date.now()}`;
}

async function castVote(i) {
  const deviceHash = fakeDeviceHash(i);
  const body = {
    questionId: QUESTION_ID,
    deviceHash,
    // Use optionId if provided, otherwise send a word value for word-cloud questions
    ...(OPTION_ID
      ? { optionId: OPTION_ID }
      : { wordValue: `word${i % 20}` }),
  };

  const start = performance.now();
  try {
    const res = await fetch(VOTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const ms = performance.now() - start;
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ms, alreadyVoted: data.alreadyVoted ?? false, error: null };
  } catch (err) {
    const ms = performance.now() - start;
    return { status: 0, ms, alreadyVoted: false, error: err.message };
  }
}

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)].toFixed(0);
}

console.log(`\n🚀  Firing ${CONCURRENCY} concurrent votes at ${VOTE_URL}\n`);
const wallStart = performance.now();

const results = await Promise.all(
  Array.from({ length: CONCURRENCY }, (_, i) => castVote(i))
);

const wallMs = performance.now() - wallStart;

// Tally results
let success = 0, alreadyVoted = 0, errors = 0, serverErrors = 0;
const latencies = [];

for (const r of results) {
  latencies.push(r.ms);
  if (r.error || r.status === 0) { errors++; }
  else if (r.alreadyVoted || r.status === 409) { alreadyVoted++; }
  else if (r.status === 200 || r.status === 201) { success++; }
  else { serverErrors++; }
}

latencies.sort((a, b) => a - b);

console.log('━'.repeat(50));
console.log(`  Total fired       : ${CONCURRENCY}`);
console.log(`  ✅ Accepted        : ${success}`);
console.log(`  🔁 Already voted   : ${alreadyVoted}`);
console.log(`  ❌ Network errors  : ${errors}`);
console.log(`  💥 Server errors   : ${serverErrors}`);
console.log('─'.repeat(50));
console.log(`  p50 latency       : ${percentile(latencies, 50)} ms`);
console.log(`  p95 latency       : ${percentile(latencies, 95)} ms`);
console.log(`  p99 latency       : ${percentile(latencies, 99)} ms`);
console.log(`  Max latency       : ${latencies[latencies.length - 1].toFixed(0)} ms`);
console.log(`  Wall-clock time   : ${wallMs.toFixed(0)} ms`);
console.log('━'.repeat(50));

// Verify count in DB via results API
console.log('\n🔍  Verifying vote count in database…');
const checkRes = await fetch(
  `${BASE_URL}/api/sessions/${SESSION_CODE}/results?questionId=${QUESTION_ID}`
);
if (checkRes.ok) {
  const data = await checkRes.json();
  console.log(`  DB total votes    : ${data.totalVotes} (expected ≤ ${CONCURRENCY})`);
  if (data.totalVotes === success) {
    console.log('  ✅ DB count matches accepted votes — perfect consistency.\n');
  } else {
    console.log(`  ⚠️  Mismatch! DB=${data.totalVotes} vs accepted=${success}\n`);
  }
} else {
  console.log('  Could not verify DB count.\n');
}
