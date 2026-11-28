// One collector run: pick up new blocks, sample the network, refresh accounts and names,
// spend what's left on history, check everything, then render the site.
// Usage: node collect/run.mjs <output dir>   (state lives in <dir>/state, the site in <dir>/site)
import { readFile, rm } from 'node:fs/promises';
import { ALGOD, budget, getJSON, readState, writeOut, utcDay, addDays } from './lib.mjs';
import { emptyChain, ingestForward, ingestBackfill, pruneTracking, proposersSince, sampleNetwork, thinSamples, TRACK_DAYS } from './chain.mjs';
import { refreshAccounts, refreshNames, refreshPrice } from './sources.mjs';
import { buildSecurityBudget, buildStake } from './build.mjs';
import { emptyTokens, tokensForward, tokensBackfill, pruneTokenDays, refreshTokenMeta, verifyTokens, buildTokens, leaderboardIds } from './tokens.mjs';
import { renderSite } from './render.mjs';
import { verify } from './verify.mjs';

const OUT = process.argv[2] || 'out';
const STATE = `${OUT}/state`;
const nowSec = Math.floor(Date.now() / 1000);
const today = utcDay(nowSec);
const trackFrom = addDays(today, -(TRACK_DAYS - 1));
const errors = [];
const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);

async function step(name, fn) {
  try {
    const result = await fn();
    log(`${name}:`, result ?? 'done');
    return result;
  } catch (error) {
    errors.push({ step: name, error: error.message });
    log(`${name} FAILED:`, error.message);
    return null;
  }
}

const S = (await readState(`${STATE}/chain.json.gz`, null)) ?? emptyChain();
const before = { fwd: S.fwd, back: S.back, days: Object.keys(S.days).length };
const samples = await readState(`${STATE}/samples.json.gz`, []);
const accounts = await readState(`${STATE}/accounts.json.gz`, {});
const names = await readState(`${STATE}/names.json.gz`, {});
const price = await readState(`${STATE}/price.json`, {});
let T = (await readState(`${STATE}/tokens.json.gz`, null)) ?? emptyTokens();
const tokensBefore = { fwd: T.fwd };
const foundation = JSON.parse(await readFile(new URL('../registry/foundation.json', import.meta.url), 'utf8'));

const tip = await step('chain tip', async () => (await getJSON(`${ALGOD}/v2/status`))['last-round']);
if (tip) await step('new blocks', () => ingestForward(S, tip, trackFrom, 60_000));
if (S.fwd != null) await step('token transfers', () => tokensForward(T, S.days, S.fwd, today, Number(process.env.TOKENS_FWD_MB || 600) * 1e6, 60_000));
await step('network sample', async () => {
  const s = await sampleNetwork(S, samples, nowSec);
  return `online stake ${Math.round(s.online / 1e6)} ALGO, FeeSink ${s.sink != null ? Math.round(s.sink / 1e6) : 'unknown'} ALGO`;
});
await step('price', async () => {
  await refreshPrice(price, nowSec);
  return `$${price.usd}`;
});
const recent = proposersSince(S, addDays(today, -89));
await step('accounts', () => refreshAccounts(accounts, recent, nowSec, 2500, 4 * 60_000));
await step('names', async () => {
  await refreshNames(names, recent, nowSec, 125, 4 * 60_000);
  return `${Object.values(names).filter((n) => n.name).length} named`;
});
await step('history', () => ingestBackfill(S, trackFrom, 90_000));
await step('token history', () => tokensBackfill(T, S.days, today, 90_000));
pruneTracking(S, trackFrom);
pruneTokenDays(T, today);
await step('token names', () => refreshTokenMeta(T, leaderboardIds(buildTokens(T, today)), nowSec, 150, 45_000));
// A failed token check throws away this run's token changes; everything else still publishes.
const tokensChecked = await step('token checks', () => {
  verifyTokens(T, tokensBefore, S.days);
  return 'ok';
});
if (!tokensChecked) T = (await readState(`${STATE}/tokens.json.gz`, null)) ?? emptyTokens();
const tokens = buildTokens(T, today);

// Forget accounts that haven't proposed in 90 days.
const active = new Set(proposersSince(S, addDays(today, -89)));
for (const store of [accounts, names]) for (const address of Object.keys(store)) if (!active.has(address)) delete store[address];
const keptSamples = thinSamples(samples, nowSec);

verify({ S, before, budget }); // throws on any inconsistency, so nothing gets published

const sb = buildSecurityBudget({ S, samples: keptSamples, price, foundation, nowSec });
const stake = buildStake({ S, accounts, names, samples: keptSamples, nowSec, blockTime: sb.headline.blockTime });
const days = Object.keys(S.days).sort();
const meta = {
  generatedAt: new Date(nowSec * 1000).toISOString(),
  now: nowSec,
  round: S.fwd,
  lastTime: S.lastTime ?? null,
  oldestDay: days[0] ?? today,
  historyDone: S.back != null && S.back <= S.floor,
  historyProgress: S.fwd != null && S.fwd > S.floor ? (S.fwd - S.back + 1) / (S.fwd - S.floor + 1) : 0,
  firstSample: keptSamples[0] ? utcDay(keptSamples[0].t) : null,
};
const manifest = {
  generatedAt: meta.generatedAt,
  chain: {
    fromRound: S.back,
    toRound: S.fwd,
    fromDay: meta.oldestDay,
    toDay: days.at(-1) ?? null,
    newestBlock: S.lastTime ? new Date(S.lastTime * 1000).toISOString() : null,
    historyComplete: meta.historyDone,
    historyProgress: Number(meta.historyProgress.toFixed(4)),
  },
  datasets: {
    'security-budget': { months: sb.monthly.length, days: sb.daily.length, files: ['security-budget.json', 'security-budget-monthly.csv', 'security-budget-daily.csv'] },
    stake: { accounts: stake.rows.length, files: ['stake.json', 'stake.csv'] },
    tokens: tokens
      ? { asOf: new Date(tokens.asOf * 1000).toISOString(), windows: Object.fromEntries(Object.entries(tokens.windows).map(([w, W]) => [w, { tokens: W.tokens, transfers: W.total, ...W.coverage }])), files: ['tokens.json', 'tokens.csv'] }
      : { status: 'collecting' },
  },
  sources: { price: price.at ? new Date(price.at * 1000).toISOString() : null, accountsKnown: Object.keys(accounts).length, namesKnown: Object.keys(names).length },
  run: { requests: budget.requests, megabytes: Number((budget.bytes / 1e6).toFixed(1)), seconds: Math.round((Date.now() - budget.started) / 1000) },
  errors,
};

await rm(`${OUT}/site`, { recursive: true, force: true });
await renderSite(`${OUT}/site`, { sb, stake, tokens, meta, manifest });
await writeOut(`${STATE}/chain.json.gz`, S);
await writeOut(`${STATE}/samples.json.gz`, keptSamples);
await writeOut(`${STATE}/accounts.json.gz`, accounts);
await writeOut(`${STATE}/names.json.gz`, names);
await writeOut(`${STATE}/price.json`, price);
await writeOut(`${STATE}/tokens.json.gz`, T);
log(`done: rounds ${S.back}-${S.fwd}, ${days.length} days, ${budget.requests} requests, ${(budget.bytes / 1e6).toFixed(0)} MB, ${errors.length} problems; tokens at round ${T.fwd}, ${Object.keys(T.days).length} days`);
