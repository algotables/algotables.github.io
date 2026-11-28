// Second probe: round-range paging, FeeSink inflow search, price and NFD formats.
const IDX = 'https://mainnet-idx.4160.nodely.dev';
const ALGOD = 'https://mainnet-api.4160.nodely.dev';
const HEADERS = { 'User-Agent': 'ALGO-Tables/2 (+https://algotables.github.io)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  const t0 = Date.now();
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60000) }).catch((e) => ({ status: 'ERR ' + e.message, text: async () => '' }));
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, ms: Date.now() - t0, bytes: text.length, json, text };
}
const SINK = 'Y76M3MSY6DKBRHBL7C3NNDXGS5IIMQVQVUAB6MP4XEMMGVF2QWNPL226CA';

const r1 = await get(`${IDX}/v2/block-headers?min-round=63636660&max-round=63636669&limit=1000`);
console.log('min/max-round', r1.status, 'count', r1.json?.blocks?.length, 'rounds', r1.json?.blocks?.map((b) => b.round).join(','), r1.text.slice(0, 200));
await sleep(300);
const r2 = await get(`${IDX}/v2/block-headers?limit=1&after-time=2025-01-01T00:00:00Z`);
console.log('2025-01-01 first round', r2.status, r2.json?.blocks?.[0]?.round, 'payout', r2.json?.blocks?.[0]?.['proposer-payout'], 'bonus', r2.json?.blocks?.[0]?.bonus);
await sleep(300);
for (const t of ['2025-01-20', '2025-01-23', '2025-01-24', '2025-01-28', '2025-02-05']) {
  const r = await get(`${IDX}/v2/block-headers?limit=20&after-time=${t}T12:00:00Z`);
  const bs = r.json?.blocks ?? [];
  console.log('probe', t, 'round', bs[0]?.round, 'bonus', bs[0]?.bonus, 'payouts>0', bs.filter((b) => (b['proposer-payout'] ?? 0) > 0).length, 'of', bs.length);
  await sleep(300);
}
const q = [
  `${IDX}/v2/transactions?address=${SINK}&address-role=receiver&tx-type=pay&currency-greater-than=1000000000000&limit=50`,
  `${IDX}/v2/transactions?address=${SINK}&address-role=receiver&currency-greater-than=1000000000000&limit=50`,
  `${IDX}/v2/accounts/${SINK}/transactions?currency-greater-than=1000000000000&limit=50`,
];
for (const u of q) {
  const r = await get(u);
  console.log('sink search', r.status, r.ms + 'ms', 'n', r.json?.transactions?.length, u.split('?')[1].slice(0, 90), r.status !== 200 ? r.text.slice(0, 200) : '');
  for (const t of (r.json?.transactions ?? []).slice(0, 60)) {
    const pt = t['payment-transaction'] ?? {};
    if (pt.receiver !== SINK) continue;
    console.log('   ', new Date((t['round-time'] ?? 0) * 1000).toISOString().slice(0, 10), t['confirmed-round'], t.sender, (pt.amount / 1e6).toFixed(0), 'ALGO');
  }
  await sleep(500);
}
const cg = await get('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
console.log('coingecko', cg.status, cg.text.slice(0, 200));
const nfd = await get('https://api.nf.domains/nfd/lookup?address=AT5FZJ3SMNUA5EBVFB65TJ4T4T6KJZUFTXQFRXITQKXFBIGHJLPETATYUM&address=D6CCE7DL3GSVOCQDPWMNR5V7JEKGXOJACCU4A4K76DLJHZ4H47WRVBPUNY&view=tiny&allowUnverified=true');
console.log('nfd', nfd.status, nfd.text.slice(0, 500));
const st = await get(`${ALGOD}/v2/status`);
console.log('algod last-round', st.json?.['last-round'], 'time-since-last-round', st.json?.['time-since-last-round']);
const ih = await get(`${IDX}/health`);
console.log('indexer health', ih.status, ih.text.slice(0, 300));
