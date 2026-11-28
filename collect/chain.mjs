// Block headers -> daily totals and per-proposer counts, plus one network sample per run.
import { IDX, ALGOD, ALGO, getJSON, spent, utcDay } from './lib.mjs';

// Staking rewards switched on between rounds 46,510,310 and 46,541,468 (Jan 23-24, 2025).
export const FLOOR_ROUND = 46_500_000;
// Per-account counts are kept for this many days.
export const TRACK_DAYS = 91;

export function emptyChain() {
  return { version: 1, fwd: null, back: null, floor: FLOOR_ROUND, feeSink: null, flow: 0, days: {}, prop: {}, absent: {}, topups: [] };
}

// Adds one block header to the state. Returns the block's net effect on the FeeSink (fees in, payout out).
export function addBlock(S, b, trackFrom) {
  const day = utcDay(b.timestamp);
  let D = S.days[day];
  if (!D) D = S.days[day] = { first: b.round, last: b.round, blocks: 0, paid: 0, payout: 0, fees: 0, bonus: 0, tc0: null, tc1: null, absent: 0 };
  if (b.round >= D.last) {
    D.last = b.round;
    D.bonus = b.bonus ?? 0;
  }
  if (b.round < D.first) D.first = b.round;
  const tc = b['txn-counter'];
  if (tc != null) {
    D.tc0 = D.tc0 == null ? tc : Math.min(D.tc0, tc);
    D.tc1 = D.tc1 == null ? tc : Math.max(D.tc1, tc);
  }
  const pay = b['proposer-payout'] ?? 0;
  const fee = b['fees-collected'] ?? 0;
  D.blocks += 1;
  D.payout += pay;
  D.fees += fee;
  if (pay > 0) D.paid += 1;
  const absent = b['participation-updates']?.['absent-participation-accounts'] ?? [];
  D.absent += absent.length;
  if (day >= trackFrom) {
    if (b.proposer) {
      const P = (S.prop[day] ??= {});
      const entry = (P[b.proposer] ??= [0, 0]);
      entry[0] += 1;
      entry[1] += pay;
    }
    for (const address of absent) {
      const A = (S.absent[day] ??= {});
      A[address] = (A[address] ?? 0) + 1;
    }
  }
  S.feeSink ??= b.rewards?.['fee-sink'] ?? null;
  if (b.timestamp > (S.lastTime ?? 0)) S.lastTime = b.timestamp;
  return fee - pay;
}

async function headers(from, to) {
  const json = await getJSON(`${IDX}/v2/block-headers?min-round=${from}&max-round=${to}&limit=1000`);
  return json?.blocks ?? [];
}

function assertContiguous(blocks, from) {
  blocks.forEach((b, i) => {
    if (b.round !== from + i) throw new Error(`header gap: expected round ${from + i}, got ${b.round}`);
  });
}

// Blocks produced since the last run. The processed range is always [S.back, S.fwd].
export async function ingestForward(S, tip, trackFrom, reserveMs) {
  if (S.fwd == null) {
    S.fwd = tip - 1;
    S.back = tip;
  }
  let added = 0;
  while (S.fwd < tip && !spent(reserveMs)) {
    const from = S.fwd + 1;
    const to = Math.min(tip, from + 999);
    const blocks = await headers(from, to);
    if (!blocks.length) break;
    assertContiguous(blocks, from);
    for (const b of blocks) S.flow += addBlock(S, b, trackFrom);
    S.fwd = from + blocks.length - 1;
    added += blocks.length;
    if (blocks.length < to - from + 1) break; // the indexer hasn't caught up yet
  }
  return added;
}

// History, newest first, down to the floor, with whatever budget is left.
export async function ingestBackfill(S, trackFrom, reserveMs) {
  let added = 0;
  while (S.back > S.floor && !spent(reserveMs)) {
    const to = S.back - 1;
    const from = Math.max(S.floor, to - 999);
    const blocks = await headers(from, to);
    if (blocks.length !== to - from + 1) throw new Error(`asked for ${to - from + 1} headers from round ${from}, got ${blocks.length}`);
    assertContiguous(blocks, from);
    for (const b of blocks) addBlock(S, b, trackFrom);
    S.back = from;
    added += blocks.length;
  }
  return added;
}

export function pruneTracking(S, trackFrom) {
  for (const key of ['prop', 'absent']) {
    for (const day of Object.keys(S[key])) if (day < trackFrom) delete S[key][day];
  }
}

export function proposersSince(S, fromDay) {
  const seen = new Set();
  for (const [day, byAddress] of Object.entries(S.prop)) {
    if (day >= fromDay) for (const address of Object.keys(byAddress)) seen.add(address);
  }
  return [...seen];
}

// Online stake and the FeeSink balance. A top-up into the FeeSink shows up as balance growth
// beyond what fees and payouts explain; it is only inferred when both samples sit at the chain tip.
export async function sampleNetwork(S, samples, nowSec) {
  const supply = await getJSON(`${ALGOD}/v2/ledger/supply`);
  const sink = S.feeSink ? await getJSON(`${ALGOD}/v2/accounts/${S.feeSink}?exclude=all`) : null;
  const sample = {
    t: nowSec,
    round: supply.current_round,
    online: supply['online-money'],
    total: supply['total-money'],
    sink: sink?.amount ?? null,
    flow: S.flow,
    fwd: S.fwd,
  };
  const prev = samples.at(-1);
  const atTip = (s) => s.fwd != null && Math.abs(s.round - s.fwd) <= 50;
  if (prev && prev.sink != null && sample.sink != null && atTip(prev) && atTip(sample)) {
    const inflow = sample.sink - prev.sink - (sample.flow - prev.flow);
    if (inflow > 100_000 * ALGO) S.topups.push({ t: nowSec, round: sample.round, sinceRound: prev.round, algo: Math.round(inflow / ALGO) });
  }
  samples.push(sample);
  return sample;
}

// Every sample from the last 60 days, then one per day.
export function thinSamples(samples, nowSec) {
  const cutoff = nowSec - 60 * 86_400;
  const kept = [];
  const seenDay = new Set();
  for (let i = samples.length - 1; i >= 0; i--) {
    const s = samples[i];
    if (s.t >= cutoff) {
      kept.push(s);
      continue;
    }
    const day = utcDay(s.t);
    if (!seenDay.has(day)) {
      seenDay.add(day);
      kept.push(s);
    }
  }
  return kept.reverse();
}
