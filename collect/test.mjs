// Offline smoke test: synthetic blocks through the real build, verify and render code.
// Usage: node collect/test.mjs   (writes to a temp dir, needs no network)
import { readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { emptyChain, addBlock, thinSamples, proposersSince } from './chain.mjs';
import { buildSecurityBudget, buildStake } from './build.mjs';
import { renderSite } from './render.mjs';
import { verify } from './verify.mjs';
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

const dir = `${tmpdir()}/algotables-test`;
await renderSite(`${dir}/site`, { sb, stake, meta: { generatedAt: new Date().toISOString(), now: nowSec, round: S.fwd, lastTime: nowSec - 60, oldestDay: startDay, historyDone: false, historyProgress: 0.42, firstSample: today }, manifest: { ok: true } });
for (const file of ['index.html', 'security-budget/index.html', 'stake/index.html', 'methodology/index.html', '404.html', 'data/stake.csv', 'data/security-budget-monthly.csv', 'assets/app.js']) {
  const s = await stat(`${dir}/site/${file}`);
  console.log(`${file}: ${s.size} bytes`);
}
const stakeHtml = await readFile(`${dir}/site/stake/index.html`, 'utf8');
assert(!stakeHtml.includes('<script>.algo'), 'NFD names are escaped');
assert(stakeHtml.includes('test&lt;script&gt;.<wbr>algo'), 'escaped name is shown');
const sbHtml = await readFile(`${dir}/site/security-budget/index.html`, 'utf8');
assert(sbHtml.includes('<svg viewBox'), 'chart rendered');
assert(!/style="/.test(sbHtml + stakeHtml), 'no inline styles, so the CSP holds');
console.log('all checks passed; output in', dir);
