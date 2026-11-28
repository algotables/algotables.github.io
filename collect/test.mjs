// Offline smoke test: synthetic blocks through the real build, verify and render code.
// Usage: node collect/test.mjs   (writes to a temp dir, needs no network)
import { readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { emptyChain, addBlock, thinSamples, proposersSince } from './chain.mjs';
import { buildSecurityBudget, buildStake } from './build.mjs';
import { renderSite } from './render.mjs';
import { verify } from './verify.mjs';
import { emptyTokens, applyRoot, addToPart, partTotals, verifyTokens, buildTokens } from './tokens.mjs';
import { utcDay, addDays } from './lib.mjs';

const assert = (cond, message) => {
  if (!cond) throw new Error(`test failed: ${message}`);
};
const nowSec = Math.floor(Date.now() / 1000);
const today = utcDay(nowSec);
const S = emptyChain();
const proposers = Array.from({ length: 40 }, (_, i) => `ADDR${String(i).padStart(2, '0')}${'X'.repeat(52)}`);
const startDay = addDays(today, -120);
let round = S.floor;
let tc = 3_000_000_000;
S.back = round;
for (let d = 0; d <= 120; d++) {
  const dayStart = Date.parse(`${addDays(startDay, d)}T00:00:00Z`) / 1000;
  const perDay = d === 120 ? 100 : 300;
  for (let k = 0; k < perDay; k++) {
    const p = proposers[(round * 7) % proposers.length];
    const eligible = !p.startsWith('ADDR0');
    const fees = 40_000;
    const bonus = 8_000_000;
    tc += 35;
    S.flow += addBlock(S, {
      round,
      timestamp: dayStart + k * 288,
      proposer: p,
      'proposer-payout': eligible ? bonus + fees / 2 : 0,
      'fees-collected': fees,
      bonus,
      'txn-counter': tc,
      rewards: { 'fee-sink': 'SINK' },
      'participation-updates': k === 5 && d % 10 === 0 ? { 'absent-participation-accounts': [proposers[3]] } : undefined,
    }, addDays(today, -90));
    round++;
  }
}
S.fwd = round - 1;
const before = { fwd: null, back: null, days: 0 };
verify({ S, before, budget: { requests: 0 } });

const samples = thinSamples([
  { t: nowSec - 1800, round: S.fwd - 600, online: 2_028_000_000e6, total: 9_822_000_000e6, sink: 8_900_000e6, flow: 0, fwd: S.fwd - 600 },
  { t: nowSec, round: S.fwd, online: 2_028_000_000e6, total: 9_822_000_000e6, sink: 8_700_000e6, flow: -200_000e6, fwd: S.fwd },
], nowSec);
const accounts = Object.fromEntries(proposers.map((a, i) => [a, { at: nowSec, amount: (30_000 + i * 1_000_000) * 1e6, status: i === 7 ? 'Offline' : 'Online', eligible: !a.startsWith('ADDR0'), lastProposed: S.fwd - i * 10 }]));
const names = { [proposers[1]]: { at: nowSec, name: 'test<script>.algo' } };
const foundation = JSON.parse(await readFile(new URL('../registry/foundation.json', import.meta.url), 'utf8'));
const sb = buildSecurityBudget({ S, samples, price: { usd: 0.08, at: nowSec }, foundation, nowSec });
const stake = buildStake({ S, accounts, names, samples, nowSec, blockTime: sb.headline.blockTime });
assert(sb.monthly.length >= 4, 'monthly rows');
assert(Math.abs(sb.headline.feeShare30 - (40_000 * 300 * 30) / 1e6 / sb.headline.payout30) < 1e-9, 'fee share matches the inputs');
assert(sb.headline.neededFeePerTxn > sb.headline.feePerTxn, 'needed fee is above the actual fee');
assert(stake.rows.length === 40 && proposersSince(S, addDays(today, -89)).length === 40, 'every proposer is in the stake table');
assert(stake.rows.find((r) => r.address === proposers[3]).suspensions90 > 0, 'suspensions are counted');
assert(sb.checks.filter((c) => c.from < startDay).every((c) => c.ours === null), 'periods before the data are not compared');
assert(sb.checks.some((c) => c.ours !== null), 'covered periods are compared');

// Tokens: transfers by hand, through forward collection, a backfilled day and the leaderboards.
const T = emptyTokens();
const yesterday = addDays(today, -1);
const at = (day, hhmm) => Date.parse(`${day}T${hhmm}:00Z`) / 1000;
const axfer = (time, asset, sender, receiver, amount, extra = {}) => ({ 'tx-type': 'axfer', 'round-time': time, sender, 'asset-transfer-transaction': { 'asset-id': asset, receiver, amount, ...extra } });
const pad = (s) => s.padEnd(58, 'Q');
const [A, B, C, D, E, F, G, H, X, Y, POOL, CLAW] = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH', 'XXX', 'YYY', 'POOL', 'CLAW'].map(pad);
T.start = yesterday;
for (const root of [
  axfer(at(yesterday, '10:00'), 100, A, B, 5),
  axfer(at(yesterday, '10:05'), 100, C, C, 0), // opt-in: not a transfer
  { 'tx-type': 'appl', 'round-time': at(yesterday, '12:00'), sender: D, 'inner-txns': [axfer(at(yesterday, '12:00'), 200, POOL, D, 10), { 'tx-type': 'pay', sender: POOL }] },
  axfer(at(yesterday, '23:59'), 100, CLAW, F, 1, { sender: E }), // clawback moves E's tokens
  axfer(at(today, '00:01'), 100, G, G, 0, { 'close-amount': 7, 'close-to': H }), // close-out
  axfer(at(today, '00:30'), 300, X, Y, 1), // a one-of-one NFT
  axfer(at(today, '00:40'), 100, A, B, 2),
]) applyRoot(T, root);
assert(JSON.stringify(T.days[yesterday]) === JSON.stringify({ 100: [2, 4], 200: [1, 2] }), `yesterday closes with transfers and wallets: ${JSON.stringify(T.days[yesterday])}`);
const P = { count: {}, wallets: {} };
addToPart(P, axfer(at(addDays(today, -2), '08:00'), 100, A, pad('ZZZ'), 3));
T.days[addDays(today, -2)] = partTotals(P);
T.meta = { 100: { n: 'Test <b>Coin</b>', u: 'TST', t: 1e9 }, 200: { n: null, u: 'TWO', t: 5 }, 300: { n: 'NFT', u: 'N', t: 1 } };
verifyTokens(T, { fwd: null }, S.days);
const tokens = buildTokens(T, today);
const row = (w, id) => tokens.windows[w].rows.find((r) => r.id === id);
assert(row('1h', 100).transfers === 3 && row('1h', 100).wallets === 6, `1h counts: ${JSON.stringify(row('1h', 100))}`);
assert(row('24h', 100).transfers === 4 && row('24h', 100).wallets === 6 && row('24h', 200).transfers === 1, '24h counts');
assert(!row('24h', 300) && tokens.windows['24h'].total === 6, 'NFTs are left out of the rows but not the total');
assert(row('7d', 100).transfers === 3 && row('7d', 100).wallets === 3 && tokens.windows['7d'].coverage.days === 2, `7d averages wallets per covered day: ${JSON.stringify(row('7d', 100))}`);
assert(!tokens.windows['7d'].coverage.complete && tokens.windows['24h'].coverage.complete, 'coverage flags');

const dir = `${tmpdir()}/algotables-test`;
await renderSite(`${dir}/site`, { sb, stake, meta: { generatedAt: new Date().toISOString(), now: nowSec, round: S.fwd, lastTime: nowSec - 60, oldestDay: startDay, historyDone: false, historyProgress: 0.42, firstSample: today }, tokens, manifest: { ok: true } });
for (const file of ['index.html', 'security-budget/index.html', 'stake/index.html', 'tokens/index.html', 'tokens/1h/index.html', 'tokens/ytd/index.html', 'methodology/index.html', '404.html', 'data/stake.csv', 'data/tokens.csv', 'data/security-budget-monthly.csv', 'assets/app.js']) {
  const s = await stat(`${dir}/site/${file}`);
  console.log(`${file}: ${s.size} bytes`);
}
const stakeHtml = await readFile(`${dir}/site/stake/index.html`, 'utf8');
assert(!stakeHtml.includes('<script>.algo'), 'NFD names are escaped');
assert(stakeHtml.includes('test&lt;script&gt;.<wbr>algo'), 'escaped name is shown');
const sbHtml = await readFile(`${dir}/site/security-budget/index.html`, 'utf8');
assert(sbHtml.includes('<svg viewBox'), 'chart rendered');
const tokensHtml = await readFile(`${dir}/site/tokens/index.html`, 'utf8');
assert(tokensHtml.includes('Test &lt;b&gt;Coin&lt;/b&gt;') && !tokensHtml.includes('<b>Coin'), 'token names are escaped');
assert(tokensHtml.includes('href="../tokens/7d/index.html"') && (await readFile(`${dir}/site/tokens/7d/index.html`, 'utf8')).includes('href="../../tokens/index.html"'), 'window links resolve from both depths');
assert(!/style="/.test(sbHtml + stakeHtml + tokensHtml), 'no inline styles, so the CSP holds');
console.log('all checks passed; output in', dir);
