// One-off probe of the data sources for the Phase 1 collector.
// Prints field names, page limits, sizes and one day of payout totals.
const IDX = 'https://mainnet-idx.4160.nodely.dev';
const ALGOD = 'https://mainnet-api.4160.nodely.dev';
const HEADERS = { 'User-Agent': 'ALGO-Tables/2 (+https://algotables.github.io)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const t0 = Date.now();
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ms: Date.now() - t0, bytes: text.length, json, text };
}

const st = await get(`${ALGOD}/v2/status`);
console.log('algod status', st.status, 'last-round', st.json?.['last-round'], st.ms + 'ms');
const sup = await get(`${ALGOD}/v2/ledger/supply`);
console.log('supply', sup.status, sup.text.slice(0, 300));

for (const lim of [1000, 5000]) {
  const h = await get(`${IDX}/v2/block-headers?limit=${lim}&after-time=2026-08-01T00:00:00Z`);
  console.log(`headers limit=${lim}`, h.status, h.ms + 'ms', h.bytes + 'B', 'count', h.json?.blocks?.length, 'next', h.json?.['next-token']);
  if (h.status !== 200) console.log(h.text.slice(0, 500));
  await sleep(300);
}

const first = await get(`${IDX}/v2/block-headers?limit=3&after-time=2026-08-01T00:00:00Z`);
const b0 = first.json?.blocks?.[0] ?? {};
console.log('block keys', Object.keys(b0).join(','));
console.log('sample', JSON.stringify(b0).slice(0, 3500));

// One full UTC day: 2026-08-01
let next = null, pages = 0, bytes = 0, blocks = 0, paid = 0, payout = 0, fees = 0, bonus = 0;
let firstTc = null, lastTc = null, absentEvents = 0, minRound = Infinity, maxRound = 0;
const proposers = new Set();
let feeSink = null;
const t0 = Date.now();
do {
  const q = `${IDX}/v2/block-headers?limit=1000&after-time=2026-08-01T00:00:00Z&before-time=2026-08-02T00:00:00Z` + (next ? `&next=${next}` : '');
  const r = await get(q);
  if (r.status !== 200) { console.log('page error', r.status, r.text.slice(0, 300)); break; }
  pages++; bytes += r.bytes;
  for (const b of r.json.blocks ?? []) {
    blocks++;
    minRound = Math.min(minRound, b.round); maxRound = Math.max(maxRound, b.round);
    const p = b['proposer-payout'] ?? 0;
    payout += p; if (p > 0) paid++;
    fees += b['fees-collected'] ?? 0;
    bonus += b['bonus'] ?? 0;
    if (b.proposer) proposers.add(b.proposer);
    const abs = b['participation-updates']?.['absent-participation-accounts'] ?? [];
    absentEvents += abs.length;
    const tc = b['txn-counter'];
    if (tc != null) { if (firstTc == null) firstTc = tc; lastTc = tc; }
    feeSink ??= b.rewards?.['fee-sink'] ?? null;
  }
  next = r.json['next-token'] ?? null;
  if (!(r.json.blocks ?? []).length) break;
  await sleep(250);
} while (next);
console.log('DAY 2026-08-01', { pages, MB: (bytes / 1e6).toFixed(1), seconds: ((Date.now() - t0) / 1000).toFixed(0), blocks, minRound, maxRound, paidBlocks: paid, proposers: proposers.size, payoutALGO: (payout / 1e6).toFixed(2), feesALGO: (fees / 1e6).toFixed(2), bonusSumALGO: (bonus / 1e6).toFixed(2), txns: lastTc != null ? lastTc - firstTc : null, absentEvents, feeSink });
console.log('Foundation August 2026 daily average for comparison: ' + (6.74e6 / 31).toFixed(0) + ' ALGO');

if (feeSink) {
  const acct = await get(`${ALGOD}/v2/accounts/${feeSink}?exclude=all`);
  console.log('feesink account', acct.status, acct.text.slice(0, 400));
  const tops = await get(`${IDX}/v2/accounts/${feeSink}/transactions?tx-type=pay&currency-greater-than=100000000000&limit=25`);
  console.log('feesink big pays', tops.status, tops.bytes + 'B');
  for (const t of tops.json?.transactions ?? []) {
    const pt = t['payment-transaction'] ?? {};
    console.log('  ', new Date((t['round-time'] ?? 0) * 1000).toISOString().slice(0, 10), t.sender.slice(0, 8), '->', (pt.receiver ?? '').slice(0, 8), (pt.amount / 1e6).toFixed(0), 'ALGO');
  }
}

const some = [...proposers].slice(0, 5);
const nfd = await get(`https://api.nf.domains/nfd/lookup?${some.map((a) => 'address=' + a).join('&')}&view=tiny&allowUnverified=true`);
console.log('nfd lookup', nfd.status, nfd.text.slice(0, 600));
if (some[0]) {
  const a = await get(`${ALGOD}/v2/accounts/${some[0]}?exclude=all`);
  console.log('proposer account', a.status, a.text.slice(0, 800));
}
