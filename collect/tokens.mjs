// Asset transfers -> per-token activity. Transfers and active wallets are kept in 5-minute buckets
// for the last day (the 1h and 24h windows) and per UTC day for 90 days, plus year-to-date totals.
import { IDX, getJSON, budget, spent, utcDay, addDays } from './lib.mjs';

export const TOKEN_DAYS = 90; // full days kept one by one
export const WINDOWS = ['1h', '24h', '7d', '30d', '60d', '90d', 'ytd'];
const BUCKET = 300; // seconds per bucket
const KEEP = 300; // buckets kept: a little over 24 hours
const CHUNK = 1000; // rounds per query; every page of a query is fetched before any of it is applied
// The first 10 characters of an address carry 50 bits of its public key: plenty to tell wallets apart.
const walletKey = (address) => address.slice(0, 10);

export function emptyTokens() {
  return { version: 1, start: null, fwd: null, last: null, cur: null, curCount: {}, buckets: {}, seen: {}, days: {}, part: null, ytd: {}, meta: {} };
}

// Calls fn(assetId, addresses) for each asset transfer in a transaction and its inner transactions
// that moves a non-zero amount. Opt-ins (zero to yourself) and other zero-amount transfers don't count.
export function eachTransfer(txn, fn) {
  if (txn['tx-type'] === 'axfer') {
    const a = txn['asset-transfer-transaction'] ?? {};
    const closed = (a['close-amount'] ?? 0) > 0;
    if ((a.amount ?? 0) > 0 || closed) {
      const from = a.sender || txn.sender; // a.sender is set when an asset's clawback moves it
      const addresses = [from, a.receiver];
      if (closed && a['close-to']) addresses.push(a['close-to']);
      fn(a['asset-id'], addresses.filter(Boolean));
    }
  }
  for (const inner of txn['inner-txns'] ?? []) eachTransfer(inner, fn);
}

// Every root transaction in [from, to] that is, or contains, an asset transfer.
async function rootsIn(from, to) {
  const roots = [];
  let next = null;
  do {
    const page = await getJSON(`${IDX}/v2/transactions?tx-type=axfer&min-round=${from}&max-round=${to}&limit=1000${next ? `&next=${encodeURIComponent(next)}` : ''}`);
    const txns = page?.transactions ?? [];
    roots.push(...txns);
    next = txns.length ? page['next-token'] : null;
  } while (next);
  return roots;
}

const dayStartBucket = (day) => Math.floor(Date.parse(`${day}T00:00:00Z`) / 1000 / BUCKET);

// Closes the day being collected: its transfers, and the wallets last seen inside it.
function closeDay(T) {
  const from = dayStartBucket(T.cur);
  const out = {};
  for (const [id, transfers] of Object.entries(T.curCount)) {
    let wallets = 0;
    for (const b of Object.values(T.seen[id] ?? {})) if (b >= from) wallets++;
    out[id] = [transfers, wallets];
  }
  T.days[T.cur] = out;
}

export function applyRoot(T, root) {
  const time = root['round-time'];
  const day = utcDay(time);
  if (T.cur != null && day < T.cur) throw new Error(`transaction from ${day} after ${T.cur} had started`);
  if (day !== T.cur) {
    if (T.cur != null) closeDay(T);
    T.cur = day;
    T.curCount = {};
  }
  const bucket = Math.floor(time / BUCKET);
  if (time > (T.last ?? 0)) T.last = time;
  eachTransfer(root, (id, addresses) => {
    T.curCount[id] = (T.curCount[id] ?? 0) + 1;
    const B = (T.buckets[bucket] ??= {});
    B[id] = (B[id] ?? 0) + 1;
    const seen = (T.seen[id] ??= {});
    for (const address of addresses) seen[walletKey(address)] = bucket;
  });
}

function pruneRecent(T) {
  const keepFrom = Math.floor((T.last ?? 0) / BUCKET) - KEEP;
  for (const b of Object.keys(T.buckets)) if (Number(b) < keepFrom) delete T.buckets[b];
  for (const [id, seen] of Object.entries(T.seen)) {
    for (const [w, b] of Object.entries(seen)) if (b < keepFrom) delete seen[w];
    if (!Object.keys(seen).length) delete T.seen[id];
  }
}

// Rounds since the last run, up to `to` (a round the header collector has already seen, so the
// indexer has it). The first run starts at the beginning of yesterday, so that day is whole.
export async function tokensForward(T, chainDays, to, today, capBytes, reserveMs) {
  if (T.fwd == null) {
    const yesterday = addDays(today, -1);
    const first = chainDays[yesterday]?.first;
    if (first == null) throw new Error(`no header data for ${yesterday} yet`);
    T.start = yesterday;
    T.fwd = first - 1;
  }
  const startBytes = budget.bytes;
  let roots = 0;
  while (T.fwd < to && budget.bytes - startBytes < capBytes && !spent(reserveMs)) {
    const from = T.fwd + 1;
    const end = Math.min(to, from + CHUNK - 1);
    const batch = await rootsIn(from, end);
    for (const root of batch) applyRoot(T, root);
    T.fwd = end;
    roots += batch.length;
    pruneRecent(T);
  }
  return `${roots} transactions, now at round ${T.fwd}`;
}

// A day collected out of order (backfill): transfers and the set of wallets per token.
export function addToPart(P, root) {
  eachTransfer(root, (id, addresses) => {
    P.count[id] = (P.count[id] ?? 0) + 1;
    const set = (P.wallets[id] ??= {});
    for (const address of addresses) set[walletKey(address)] = 1;
  });
}
export const partTotals = (P) => Object.fromEntries(Object.entries(P.count).map(([id, t]) => [id, [t, Object.keys(P.wallets[id]).length]]));

// Whole days before forward collection began, newest first, back to TOKEN_DAYS days ago.
// A day can take several runs; its progress is kept in T.part.
export async function tokensBackfill(T, chainDays, today, reserveMs) {
  if (T.start == null) return 'waiting for forward collection to start';
  const oldest = addDays(today, -TOKEN_DAYS);
  let finished = 0;
  while (!spent(reserveMs)) {
    if (!T.part) {
      let day = addDays(T.start, -1);
      while (day >= oldest && T.days[day]) day = addDays(day, -1);
      if (day < oldest) break;
      const D = chainDays[day];
      if (!D || D.last - D.first + 1 !== D.blocks) throw new Error(`no complete header data for ${day}`);
      T.part = { day, next: D.first, last: D.last, count: {}, wallets: {} };
    }
    const P = T.part;
    const end = Math.min(P.last, P.next + CHUNK - 1);
    const batch = await rootsIn(P.next, end);
    for (const root of batch) addToPart(P, root);
    P.next = end + 1;
    if (P.next > P.last) {
      T.days[P.day] = partTotals(P);
      T.part = null;
      finished++;
    }
  }
  const pending = T.part ? `, ${T.part.day} in progress` : '';
  return `${finished} days finished${pending}, ${Object.keys(T.days).length} of ${TOKEN_DAYS} kept`;
}

// Days older than TOKEN_DAYS leave the daily map; this year's are folded into the year-to-date totals.
export function pruneTokenDays(T, today) {
  const oldest = addDays(today, -TOKEN_DAYS);
  const year = today.slice(0, 4);
  for (const day of Object.keys(T.days).sort()) {
    if (day >= oldest) break;
    if (day.startsWith(year)) {
      const Y = (T.ytd[year] ??= { from: day, days: 0, totals: {} });
      if (day < Y.from) Y.from = day;
      Y.days += 1;
      for (const [id, [t, w]] of Object.entries(T.days[day])) {
        const total = (Y.totals[id] ??= [0, 0]);
        total[0] += t;
        total[1] += w;
      }
    }
    delete T.days[day];
  }
  for (const y of Object.keys(T.ytd)) if (y !== year) delete T.ytd[y];
  if (T.part && T.part.day < oldest) T.part = null;
}

// Names, unit names and supply for the tokens on the leaderboards, refreshed weekly.
export async function refreshTokenMeta(T, ids, nowSec, maxRequests, reserveMs) {
  let fetched = 0;
  for (const id of ids) {
    const known = T.meta[id];
    if (known && nowSec - known.at < 7 * 86_400) continue;
    if (fetched >= maxRequests || spent(reserveMs)) break;
    const json = await getJSON(`${IDX}/v2/assets/${id}?include-all=true`, { allow: [404] });
    const p = json?.asset?.params ?? {};
    T.meta[id] = { n: p.name ?? null, u: p['unit-name'] ?? null, t: p.total ?? null, gone: Boolean(json?.asset?.deleted), at: nowSec };
    fetched++;
  }
  // Forget tokens that have dropped out of the last 90 days.
  const active = new Set(Object.values(T.days).flatMap((d) => Object.keys(d)));
  for (const id of Object.keys(T.meta)) if (!active.has(id) && !T.curCount[id]) delete T.meta[id];
  return `${fetched} fetched, ${Object.keys(T.meta).length} known`;
}

// Consistency checks; a failure means this run's token changes are thrown away.
export function verifyTokens(T, before, chainDays) {
  const fail = (message) => {
    throw new Error(`tokens: ${message}`);
  };
  if (before.fwd != null && T.fwd < before.fwd) fail('the forward cursor went backwards');
  for (const [day, counts] of Object.entries(T.days)) {
    let sum = 0;
    for (const [id, [t, w]] of Object.entries(counts)) {
      if (!Number.isInteger(t) || t < 1 || !Number.isInteger(w) || w < 1 || w > 3 * t) fail(`${day} token ${id} has ${t} transfers and ${w} wallets`);
      sum += t;
    }
    const D = chainDays[day];
    if (D?.tc0 != null && sum > D.tc1 - D.tc0 + 100_000) fail(`${day} has ${sum} transfers but only about ${D.tc1 - D.tc0} transactions`);
  }
  if (T.part && T.part.next > T.part.last + 1) fail('the backfill cursor ran past its day');
}

const daysBack = (yesterday, n) => Array.from({ length: n }, (_, i) => addDays(yesterday, -i));

// The leaderboards: for each window, every token's transfers and active wallets, busiest first.
// 1h and 24h run up to the newest block collected; the others are whole UTC days up to yesterday.
export function buildTokens(T, today, { top = 500 } = {}) {
  if (T.last == null) return null;
  const yesterday = addDays(today, -1);
  const lastBucket = Math.floor(T.last / BUCKET);
  const out = { asOf: T.last, windows: {} };

  const rolling = (buckets) => {
    const from = lastBucket - buckets + 1;
    const transfers = {};
    for (const [b, counts] of Object.entries(T.buckets)) {
      if (Number(b) < from) continue;
      for (const [id, c] of Object.entries(counts)) transfers[id] = (transfers[id] ?? 0) + c;
    }
    const wallets = {};
    for (const [id, seen] of Object.entries(T.seen)) {
      let k = 0;
      for (const b of Object.values(seen)) if (b >= from) k++;
      if (k) wallets[id] = k;
    }
    const covered = T.start != null && Date.parse(`${T.start}T00:00:00Z`) / 1000 <= (from * BUCKET);
    return { transfers, wallets, coverage: { complete: covered } };
  };

  // Sums whole days. Wallets become a daily average: each day's distinct wallets, averaged over the
  // days covered (a token idle on a day counts that day as zero).
  const sumDays = (days, folded = null) => {
    const have = days.filter((d) => T.days[d]);
    const transfers = {};
    const walletDays = {};
    const add = (id, t, w) => {
      transfers[id] = (transfers[id] ?? 0) + t;
      walletDays[id] = (walletDays[id] ?? 0) + w;
    };
    for (const d of have) for (const [id, [t, w]] of Object.entries(T.days[d])) add(id, t, w);
    if (folded) for (const [id, [t, w]] of Object.entries(folded.totals)) add(id, t, w);
    const covered = have.length + (folded?.days ?? 0);
    const wallets = Object.fromEntries(Object.entries(walletDays).map(([id, w]) => [id, w / Math.max(1, covered)]));
    const sorted = [folded?.from, ...have].filter(Boolean).sort();
    return { transfers, wallets, covered, from: sorted[0] ?? null, to: have.length ? have.sort().at(-1) : folded ? yesterday : null };
  };

  const daily = (days) => {
    const s = sumDays(days);
    return { transfers: s.transfers, wallets: s.wallets, coverage: { complete: s.covered === days.length, days: s.covered, of: days.length, from: s.from, to: s.to } };
  };

  const ytd = () => {
    const year = yesterday.slice(0, 4);
    const ofDays = (Date.parse(`${yesterday}T00:00:00Z`) - Date.parse(`${year}-01-01T00:00:00Z`)) / 86_400_000 + 1;
    const inMap = Object.keys(T.days).filter((d) => d.startsWith(year) && d <= yesterday);
    const s = sumDays(inMap, T.ytd[year] ?? null);
    return { transfers: s.transfers, wallets: s.wallets, coverage: { complete: s.covered === ofDays, days: s.covered, of: ofDays, from: s.from, to: s.to } };
  };

  const raw = {
    '1h': rolling(12),
    '24h': rolling(288),
    '7d': daily(daysBack(yesterday, 7)),
    '30d': daily(daysBack(yesterday, 30)),
    '60d': daily(daysBack(yesterday, 60)),
    '90d': daily(daysBack(yesterday, 90)),
    ytd: ytd(),
  };
  for (const w of WINDOWS) {
    const { transfers, wallets, coverage } = raw[w];
    const total = Object.values(transfers).reduce((a, b) => a + b, 0);
    const rows = Object.entries(transfers)
      .filter(([id]) => T.meta[id]?.t !== 1) // one-of-one NFTs aren't tokens
      .map(([id, t]) => ({ id: Number(id), name: T.meta[id]?.n ?? null, unit: T.meta[id]?.u ?? null, transfers: t, wallets: wallets[id] ?? 0, share: total ? t / total : 0 }))
      .sort((a, b) => b.transfers - a.transfers || b.wallets - a.wallets || a.id - b.id);
    rows.forEach((r, i) => (r.rank = i + 1));
    out.windows[w] = { coverage, total, tokens: rows.length, rows: rows.slice(0, top) };
  }
  return out;
}

// Token IDs worth naming: everything on any leaderboard.
export const leaderboardIds = (built) => [...new Set(Object.values(built?.windows ?? {}).flatMap((w) => w.rows.map((r) => String(r.id))))];
