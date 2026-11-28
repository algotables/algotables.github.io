// Static HTML for every page, plus the data files. No framework: plain strings, escaped.
import { cp } from 'node:fs/promises';
import { writeOut, toCSV } from './lib.mjs';
import { WINDOWS } from './tokens.mjs';

const GA_ID = 'G-06STK04RPZ';
const REPO = 'https://github.com/algotables/algotables.github.io';
const TIP_ADDRESS = 'AT5FZJ3SMNUA5EBVFB65TJ4T4T6KJZUFTXQFRXITQKXFBIGHJLPETATYUM';
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
  "style-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ok = (v) => v != null && Number.isFinite(v);
const fmt = (digits) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
const n0 = (v) => (ok(v) ? fmt(0).format(v) : '—');
const n1 = (v) => (ok(v) ? fmt(1).format(v) : '—');
const n2 = (v) => (ok(v) ? fmt(2).format(v) : '—');
const n4 = (v) => (ok(v) ? fmt(4).format(v) : '—');
const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
const compact = (v) => (ok(v) ? compactFmt.format(v) : '—');
const usd = (v) => (ok(v) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v) : '—');
const pct = (v, digits = 1) => (ok(v) ? `${(v * 100).toFixed(digits)}%` : '—');
const short = (address) => `${address.slice(0, 5)}…${address.slice(-4)}`;
const monthLabel = (key) => `${MONTHS[Number(key.slice(5, 7)) - 1]} '${key.slice(2, 4)}`;
const utc = (sec) => new Date(sec * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
// Long NFD names may break after a dot, so a narrow window can still fit the whole table.
const accountLink = (address, name) =>
  name
    ? `<a class="addr name" href="https://allo.info/account/${address}">${esc(name).replaceAll('.', '.<wbr>')}</a><span class="addr muted sub">${short(address)}</span>`
    : `<a class="addr" href="https://allo.info/account/${address}">${short(address)}</a>`;

function page({ title, description, depth, active, body, meta, root }) {
  const r = root ?? '../'.repeat(depth);
  const links = [
    ['index.html', 'Home'],
    ['security-budget/index.html', 'Security Budget'],
    ['stake/index.html', 'Stake'],
    ['tokens/index.html', 'Tokens'],
    ['methodology/index.html', 'Method'],
  ]
    .map(([href, label]) => `<a href="${r}${href}"${label === active ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  const stale = meta.lastTime && meta.now - meta.lastTime > 3 * 3600
    ? `<p class="notice">The newest block here is from ${utc(meta.lastTime)}. Updates are behind; numbers below are the latest that passed checks.</p>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="${r}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${r}assets/style.css">
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script src="${r}assets/ga.js"></script>
<script src="${r}assets/app.js" defer></script>
</head>
<body>
<header class="top"><div class="wrap"><a class="brand" href="${r}index.html">ALGO Tables</a><nav aria-label="Main">${links}</nav></div></header>
<main class="wrap">
${stale}${body}
</main>
<footer class="wrap foot">
<p>Chain data through round ${n0(meta.round)}${meta.lastTime ? ` (${utc(meta.lastTime)})` : ''}, refreshed about every 15 minutes from Algorand blocks and asset transfers via Nodely's free API. <a href="${r}methodology/index.html">How the numbers are made</a> · <a href="${r}data/manifest.json">Data status</a> · <a href="${REPO}">Code</a></p>
<p>ALGO Tables is independent and free. Tips go to <a href="https://allo.info/account/${TIP_ADDRESS}">algotables.algo</a>.</p>
</footer>
</body>
</html>
`;
}

const tile = (label, value, note = '') =>
  `<div class="tile"><div class="label">${esc(label)}</div><div class="value">${value}</div>${note ? `<div class="note">${note}</div>` : ''}</div>`;

function table(id, columns, rows, { rowKey, sorted } = {}) {
  const head = columns
    .map((c) => `<th scope="col"${c.num ? ' class="num" data-type="num"' : ''}${sorted?.key === c.key ? ` aria-sort="${sorted.dir}"` : ''}>${esc(c.label)}</th>`)
    .join('');
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const value = c.value ? c.value(row) : row[c.key];
          const shown = c.html ? c.html(row) : esc(c.fmt ? c.fmt(value, row) : value ?? '—');
          const sortValue = c.num ? ` data-v="${ok(value) ? value : ''}"` : '';
          return `<td${c.num ? ' class="num"' : ''}${sortValue}>${shown}</td>`;
        })
        .join('');
      const key = rowKey ? ` data-k="${esc(rowKey(row))}"` : '';
      return `<tr${row.partial ? ' class="partial"' : ''}${key}>${cells}</tr>`;
    })
    .join('\n');
  return `<div class="card"><table id="${id}" class="sortable"><thead><tr>${head}</tr></thead><tbody>\n${body}\n</tbody></table></div>`;
}

function niceStep(raw) {
  const power = 10 ** Math.floor(Math.log10(raw));
  const n = raw / power;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power;
}

// One series, so no legend: the title names it. Thin columns, rounded data end, square at the baseline.
function monthlyChart(monthly) {
  const rows = monthly.slice(-24);
  if (rows.length < 2) return '';
  const W = 720;
  const H = 260;
  const L = 56;
  const R = 16;
  const T = 24;
  const B = 36;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const max = Math.max(...rows.map((r) => r.payout));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const y = (v) => T + plotH - (v / top) * plotH;
  const band = plotW / rows.length;
  const barW = Math.max(4, Math.min(24, band - 2));
  const every = rows.length > 12 ? 3 : 1;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  const grid = ticks
    .map((v) => `<line class="${v === 0 ? 'axis' : 'grid'}" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="tick" x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${compact(v)}</text>`)
    .join('');
  const lastFull = [...rows].reverse().find((r) => !r.partial);
  const bars = rows
    .map((r, i) => {
      const cx = L + band * i + band / 2;
      const x = cx - barW / 2;
      const yTop = y(r.payout);
      const height = T + plotH - yTop;
      const rr = Math.min(4, height, barW / 2);
      const d = `M${x.toFixed(1)},${T + plotH} V${(yTop + rr).toFixed(1)} Q${x.toFixed(1)},${yTop.toFixed(1)} ${(x + rr).toFixed(1)},${yTop.toFixed(1)} H${(x + barW - rr).toFixed(1)} Q${(x + barW).toFixed(1)},${yTop.toFixed(1)} ${(x + barW).toFixed(1)},${(yTop + rr).toFixed(1)} V${T + plotH} Z`;
      const tip = `${monthLabel(r.month)}: ${n0(r.payout)} ALGO paid to validators, ${n0(r.fees)} ALGO collected in fees${r.partial ? ' (partial month)' : ''}`;
      const xLabel = i % every === 0 || i === rows.length - 1
        ? `<text class="tick" x="${cx.toFixed(1)}" y="${H - B + 20}" text-anchor="middle">${monthLabel(r.month)}</text>`
        : '';
      const valueLabel = r === lastFull
        ? `<text class="label" x="${cx.toFixed(1)}" y="${(yTop - 8).toFixed(1)}" text-anchor="middle">${compact(r.payout)}</text>`
        : '';
      return `<g class="bar${r.partial ? ' partial' : ''}"><title>${esc(tip)}</title><rect class="hit" x="${(L + band * i).toFixed(1)}" y="${T}" width="${band.toFixed(1)}" height="${plotH}"/><path d="${d}"/></g>${valueLabel}${xLabel}`;
    })
    .join('');
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="ALGO paid to validators each month">${grid}${bars}</svg><figcaption>ALGO paid to validators each month. Lighter columns are partial months; hover a column for its fees. The table below has every value.</figcaption></figure>`;
}

function coverageNote(meta) {
  if (meta.historyDone) return '';
  return `<p class="notice">History is still filling in: data now starts ${esc(meta.oldestDay)} and reaches back to January 2025 as the collector works through older blocks (${pct(meta.historyProgress, 0)} done). Totals for earlier periods appear once they're covered.</p>`;
}

function homePage({ sb, stake, tokens, meta }) {
  const h = sb.headline;
  const s = stake.summary;
  const body = `
<h1>ALGO Tables</h1>
<p class="lede">Independent tables built straight from the Algorand chain and refreshed every 15 minutes. Each page says how its numbers are made, and every table downloads as CSV or JSON.</p>
<h2><a href="security-budget/index.html">Security Budget</a></h2>
<p>Who pays Algorand's validators, how much, and for how long.</p>
<div class="tiles">
${tile(`Paid to validators, last ${h.windowDays} days`, `${compact(h.payout30)} ALGO`, h.priceUsd ? `about ${usd(h.payout30 * h.priceUsd)}` : '')}
${tile('Fees collected, as a share of payouts', pct(h.feeShare30, 2), `${compact(h.fees30)} ALGO over the same days`)}
${tile('FeeSink runway without top-ups', ok(h.runwayDays) ? `${n0(h.runwayDays)} days` : '—', ok(h.feeSink) ? `${compact(h.feeSink)} ALGO in the FeeSink` : '')}
${tile('Bonus per block', ok(h.bonusNow) ? `${n2(h.bonusNow)} ALGO` : '—', ok(h.bonusAtEnd) ? `about ${n2(h.bonusAtEnd)} by the end of January 2028` : '')}
</div>
<h2><a href="stake/index.html">Stake</a></h2>
<p>Every account that proposed a block in the last 90 days, and how its blocks compare with its stake.</p>
<div class="tiles">
${tile('Online stake', `${compact(s.onlineStake)} ALGO`)}
${tile(`Accounts proposing, last ${s.windowDays.d30} days`, n0(s.proposers30))}
${tile('Largest proposers holding a third of online stake', ok(s.thirdCount) ? n0(s.thirdCount) : '—')}
${tile(`Suspensions for absenteeism, last ${s.windowDays.d90} days`, n0(s.suspensions90))}
</div>
<h2><a href="tokens/index.html">Tokens</a></h2>
<p>The most active tokens by transfers, from the last hour to the year so far.</p>
${tokens ? table('home-tokens', tokenColumns('24h').filter((c) => c.key !== 'share'), tokens.windows['24h'].rows.slice(0, 5), { sorted: { key: 'transfers', dir: 'descending' } }) + `<p class="downloads">Last 24 hours. <a href="tokens/index.html">All tokens and windows</a></p>` : '<p class="muted">Collecting the first day of transfers.</p>'}
<h2>Coming next</h2>
<ul>
<li><strong>Token pages</strong>: holders and activity over time for each token.</li>
<li><strong>Apps</strong>: which Algorand apps are actually used, measured on-chain.</li>
</ul>
<h2>Done well elsewhere</h2>
<ul class="elsewhere">
<li><a href="https://allo.info">Allo</a> and <a href="https://explorer.perawallet.app">Pera Explorer</a> for accounts, assets and transactions; <a href="https://lora.algokit.io">Lora</a> for developers</li>
<li><a href="https://hay.app">Haystack</a> for prices, charts and swaps</li>
<li><a href="https://defillama.com/chain/algorand">DefiLlama</a> for DeFi TVL and fees</li>
<li><a href="https://www.asastats.com">ASA Stats</a> for portfolios</li>
</ul>`;
  return page({ title: 'ALGO Tables: independent Algorand data', description: 'Independent tables built from the Algorand chain: who pays validators, how stake performs, and more.', depth: 0, active: 'Home', body, meta });
}

function securityPage({ sb, meta }) {
  const h = sb.headline;
  const monthlyColumns = [
    { key: 'month', label: 'Month', fmt: (v, r) => `${monthLabel(v)}${r.partial ? ' (partial)' : ''}` },
    { key: 'blocks', label: 'Blocks', num: true, fmt: n0 },
    { key: 'paidShare', label: 'Blocks that paid', num: true, fmt: (v) => pct(v) },
    { key: 'payout', label: 'Paid to validators (ALGO)', num: true, fmt: n0 },
    { key: 'fees', label: 'Fees (ALGO)', num: true, fmt: n0 },
    { key: 'feeShare', label: 'Fees ÷ payouts', num: true, fmt: (v) => pct(v, 2) },
    { key: 'txns', label: 'Transactions', num: true, fmt: n0 },
    { key: 'feePerTxn', label: 'Fee per txn (ALGO)', num: true, fmt: n4 },
    { key: 'neededFeePerTxn', label: 'Fee per txn to replace the bonus', num: true, fmt: n4 },
    { key: 'bonusEnd', label: 'Bonus at month end', num: true, fmt: n2 },
  ];
  const topups = sb.topups.length
    ? table('topups', [
        { key: 'date', label: 'Date' },
        { key: 'algo', label: 'Inferred top-up (ALGO)', num: true, fmt: n0 },
        { key: 'round', label: 'Seen by round', num: true, fmt: n0, html: (r) => `<a href="https://allo.info/block/${r.round}">${n0(r.round)}</a>` },
      ], [...sb.topups].reverse())
    : `<p class="muted">None seen since tracking began${meta.firstSample ? ` on ${esc(meta.firstSample)}` : ''}.</p>`;
  const holdings = table('holdings', [
    { key: 'date', label: 'Quarter end' },
    { key: 'algo', label: 'Foundation ALGO', num: true, fmt: n0 },
    { key: 'change', label: 'Change from previous', num: true, fmt: (v) => (ok(v) ? (v > 0 ? '+' : '') + n0(v) : '—') },
    { key: 'usdInvestments', label: 'Investments (USD)', num: true, fmt: (v) => (ok(v) ? usd(v) : '—') },
    { key: 'source', label: 'Source', html: (r) => `<a href="${esc(r.source)}">report</a>${r.note ? ` <span class="muted">${esc(r.note)}</span>` : ''}` },
  ], sb.holdings);
  const checks = table('checks', [
    { key: 'label', label: 'Period' },
    { key: 'algo', label: 'Published (ALGO)', num: true, fmt: n0 },
    { key: 'ours', label: 'ALGO Tables (ALGO)', num: true, fmt: (v) => (ok(v) ? n0(v) : 'not covered yet') },
    { key: 'diff', label: 'Difference', num: true, fmt: (v) => (ok(v) ? `${v > 0 ? '+' : ''}${(v * 100).toFixed(2)}%` : '—') },
    { key: 'source', label: 'Published by', html: (r) => `<a href="${esc(r.source)}">${esc(r.by)}</a>` },
  ], sb.checks);
  const body = `
<h1>Security Budget</h1>
${ok(h.payout30) && h.windowDays ? `<p class="finding">In the last ${h.windowDays} days validators were paid ${compact(h.payout30)} ALGO, and fees covered ${pct(h.feeShare30, 2)} of it.</p>` : ''}
<p class="lede">Every block pays its proposer from the FeeSink: half the block's fees plus a bonus the Foundation funds. The bonus started at 10 ALGO a block in January 2025 and drops 1% every million blocks, and the Foundation has committed to it through January 2028. This page tracks what the bonus costs, how much fees cover, and how long the FeeSink lasts.</p>
${coverageNote(meta)}
<div class="tiles">
${tile(`Paid to validators, last ${h.windowDays} days`, `${compact(h.payout30)} ALGO`, h.priceUsd ? `about ${usd(h.payout30 * h.priceUsd)} at today's price` : '')}
${tile('Fees collected, as a share of payouts', pct(h.feeShare30, 2), `${compact(h.fees30)} ALGO over the same days`)}
${tile('Fee per transaction that would replace the bonus', ok(h.neededFeePerTxn) ? `${n2(h.neededFeePerTxn)} ALGO` : '—', ok(h.feeMultiple) ? `${n0(h.feeMultiple)} times today's average of ${n4(h.feePerTxn)} ALGO` : '')}
${tile('FeeSink balance', ok(h.feeSink) ? `${compact(h.feeSink)} ALGO` : '—', ok(h.runwayDays) ? `about ${n0(h.runwayDays)} days of payouts without a top-up` : '')}
${tile('Bonus per block', ok(h.bonusNow) ? `${n2(h.bonusNow)} ALGO` : '—', ok(h.bonusAtEnd) ? `about ${n2(h.bonusAtEnd)} by the end of January 2028, ${n0(h.daysToEnd)} days away` : '')}
${tile('Blocks that paid out', pct(h.paidShare30), 'the rest were proposed by accounts not taking rewards')}
</div>
${monthlyChart(sb.monthly)}
<h2>Month by month</h2>
${table('monthly', monthlyColumns, [...sb.monthly].reverse())}
<p class="downloads">Download: <a href="../data/security-budget-monthly.csv">monthly CSV</a> · <a href="../data/security-budget-daily.csv">daily CSV</a> · <a href="../data/security-budget.json">JSON</a></p>
<h2>Top-ups into the FeeSink</h2>
<p>A top-up is FeeSink balance growth that fees and payouts don't explain, measured between two updates. Amounts under 100,000 ALGO are ignored.</p>
${topups}
<h2>Foundation holdings</h2>
<p>As reported in the Foundation's quarterly transparency reports (their figures are in thousands). Quarters without a published figure are left out.</p>
${holdings}
<h2>Checks against published figures</h2>
<p>Validator payouts summed from block headers, next to the totals the Foundation and Blockworks published for the same periods.</p>
${checks}`;
  return page({ title: 'Security Budget · ALGO Tables', description: "Who pays Algorand's validators, how much fees cover, and how long the FeeSink lasts.", depth: 1, active: 'Security Budget', body, meta });
}

function stakePage({ stake, meta }) {
  const s = stake.summary;
  const columns = [
    { key: 'rank', label: '#', num: true, value: (r) => r.rank, fmt: n0 },
    { key: 'address', label: 'Account', html: (r) => accountLink(r.address, r.name) },
    { key: 'stake', label: 'Stake (ALGO)', num: true, fmt: n0 },
    { key: 'status', label: 'Status', fmt: (v) => v ?? 'checking' },
    { key: 'eligible', label: 'Takes rewards', fmt: (v) => (v == null ? '—' : v ? 'yes' : 'no') },
    { key: 'blocks7', label: 'Blocks, 7 days', num: true, fmt: n0 },
    { key: 'blocks30', label: 'Blocks, 30 days', num: true, fmt: n0 },
    { key: 'expected30', label: 'Expected, 30 days', num: true, fmt: (v) => (ok(v) ? (v >= 100 ? n0(v) : v.toFixed(1)) : '—') },
    { key: 'ratio30', label: 'Actual ÷ expected', num: true, fmt: (v) => (ok(v) ? v.toFixed(2) : '—') },
    { key: 'blocks90', label: 'Blocks, 90 days', num: true, fmt: n0 },
    { key: 'payout30', label: 'ALGO paid, 30 days', num: true, fmt: n0 },
    { key: 'hoursSinceProposal', label: 'Since last block', num: true, fmt: (v) => (ok(v) ? (v < 10 ? `${v.toFixed(1)} h` : v < 48 ? `${n0(v)} h` : `${n0(v / 24)} d`) : '—') },
    { key: 'suspensions90', label: 'Suspended, 90 days', num: true, fmt: n0 },
  ];
  const rows = stake.rows.map((r, i) => ({ ...r, rank: i + 1 }));
  const body = `
<h1>Stake</h1>
${ok(s.thirdCount) ? `<p class="finding">${n0(s.proposers30)} accounts proposed blocks in the last ${s.windowDays.d30} days; the largest ${n0(s.thirdCount)} of them hold a third of online stake.</p>` : ''}
<p class="lede">Every account that proposed a block in the last ${s.windowDays.d90} days. "Expected" is what the account's current share of online stake predicts: an account with 1% of the stake should propose about 1% of blocks. Luck matters a lot for small accounts, so the ratio only shows once 5 blocks are expected.</p>
${coverageNote(meta)}
<div class="tiles">
${tile('Online stake', `${compact(s.onlineStake)} ALGO`)}
${tile(`Accounts proposing, last ${s.windowDays.d30} days`, n0(s.proposers30), `${n0(s.eligibleOnline)} of the online ones take rewards`)}
${tile('Largest proposers holding a third of online stake', ok(s.thirdCount) ? n0(s.thirdCount) : '—', 'counted among accounts that proposed recently')}
${tile('Blocks proposed by accounts not taking rewards', pct(s.unpaidShare30), `last ${s.windowDays.d30} days`)}
${tile(`Suspensions for absenteeism, last ${s.windowDays.d90} days`, n0(s.suspensions90))}
</div>
<label class="search-label" for="stake-search">Find an account</label>
<input id="stake-search" class="search" type="search" placeholder="Address or NFD name" data-filter="stake-table" autocomplete="off">
${table('stake-table', columns, rows, { sorted: { key: 'stake', dir: 'descending' } })}
<p class="downloads">Download: <a href="../data/stake.csv">CSV</a> · <a href="../data/stake.json">JSON</a></p>`;
  return page({ title: 'Stake · ALGO Tables', description: 'Every Algorand account that proposed a block in the last 90 days, with blocks against stake.', depth: 1, active: 'Stake', body, meta });
}

const WINDOW_SHORT = { '1h': '1h', '24h': '24h', '7d': '7d', '30d': '30d', '60d': '60d', '90d': '90d', ytd: 'Year to date' };
const WINDOW_PHRASE = { '1h': 'in the last hour', '24h': 'in the last 24 hours', '7d': 'over the last 7 days', '30d': 'over the last 30 days', '60d': 'over the last 60 days', '90d': 'over the last 90 days', ytd: 'so far this year' };
const tokenPath = (w) => (w === '24h' ? 'tokens/index.html' : `tokens/${w}/index.html`);
const tokenName = (row) => row.name || row.unit || `ASA ${row.id}`;
const tokenLink = (row) =>
  `<a class="tok" href="https://allo.info/asset/${row.id}">${esc(tokenName(row))}</a><span class="muted sub">${row.unit && row.name ? `${esc(row.unit)} · ` : ''}${row.id}</span>`;
const isRolling = (w) => w === '1h' || w === '24h';
const walletFmt = (w) => (v) => (isRolling(w) || v >= 10 ? n0(v) : n1(v));

function tokenColumns(w) {
  return [
    { key: 'rank', label: '#', num: true, fmt: n0 },
    { key: 'name', label: 'Token', html: tokenLink },
    { key: 'transfers', label: 'Transfers', num: true, fmt: n0 },
    { key: 'wallets', label: isRolling(w) ? 'Active wallets' : 'Active wallets per day', num: true, fmt: walletFmt(w) },
    { key: 'share', label: 'Share of all transfers', num: true, fmt: (v) => pct(v, v >= 0.001 ? 1 : 2) },
  ];
}

function tokenCoverage(tokens, w, meta) {
  const c = tokens.windows[w].coverage;
  const behind = meta.now - tokens.asOf > 3600;
  if (isRolling(w)) {
    if (!c.complete) return `<p class="notice">Still catching up: transfers here run to ${utc(tokens.asOf)}, and this window fills in as the collector reaches the newest blocks.</p>`;
    return behind ? `<p class="notice">Transfers here run to ${utc(tokens.asOf)}.</p>` : '';
  }
  if (c.complete) return '';
  if (w === 'ytd') return `<p class="notice">Collection started on ${esc(c.from ?? 'today')}, so this year's totals cover ${n0(c.days)} of ${n0(c.of)} days. From January 1 they cover the whole year.</p>`;
  return `<p class="notice">Collected so far: ${n0(c.days)} of ${n0(c.of)} days${c.from ? ` (${esc(c.from)} to ${esc(c.to)})` : ''}. The rest fills in as the collector works back through older days.</p>`;
}

function tokensPage({ tokens, w, meta }) {
  const depth = w === '24h' ? 1 : 2;
  const r = '../'.repeat(depth);
  const W = tokens.windows[w];
  const top = W.rows[0];
  const switcher = `<nav class="windows" aria-label="Time window">${WINDOWS.map((x) => `<a href="${r}${tokenPath(x)}"${x === w ? ' aria-current="page"' : ''}>${WINDOW_SHORT[x]}</a>`).join('')}</nav>`;
  const walletsText = top ? (isRolling(w) ? `${n0(top.wallets)} active wallets` : `about ${walletFmt(w)(top.wallets)} active wallets a day`) : '';
  const body = `
<h1>Tokens</h1>
${top ? `<p class="finding">${esc(tokenName(top))} was the most active token ${WINDOW_PHRASE[w]}: ${n0(top.transfers)} transfers, ${pct(top.share, 0)} of all of them, with ${walletsText}.</p>` : ''}
<p class="lede">Algorand tokens ranked by how often they moved. A transfer is any asset transfer of a non-zero amount, including the ones apps make, such as DEX swaps. Active wallets are the addresses that sent or received the token.</p>
${switcher}
${tokenCoverage(tokens, w, meta)}
<div class="tiles">
${tile(`Transfers ${WINDOW_PHRASE[w]}`, n0(W.total))}
${tile('Tokens that moved', n0(W.tokens))}
</div>
<label class="search-label" for="token-search">Find a token</label>
<input id="token-search" class="search" type="search" placeholder="Name, unit or asset ID" data-filter="token-table" autocomplete="off">
${table('token-table', tokenColumns(w), W.rows.slice(0, 500), { sorted: { key: 'transfers', dir: 'descending' } })}
<p class="downloads">${W.tokens > 500 ? `The top 500 of ${n0(W.tokens)} tokens. ` : ''}Download the leaderboards, every window side by side: <a href="${r}data/tokens.csv">CSV</a> · <a href="${r}data/tokens.json">JSON</a></p>`;
  return page({ title: `Tokens, ${WINDOW_SHORT[w]} · ALGO Tables`, description: `The most active Algorand tokens ${WINDOW_PHRASE[w]}, by transfers and active wallets.`, depth, active: 'Tokens', body, meta });
}

function tokensPendingPage({ meta }) {
  const body = `
<h1>Tokens</h1>
<p class="lede">The collector is reading its first day of asset transfers. This page fills in within a few runs.</p>`;
  return page({ title: 'Tokens · ALGO Tables', description: 'The most active Algorand tokens, by transfers and active wallets.', depth: 1, active: 'Tokens', body, meta });
}

// One row per token on any leaderboard, every window side by side.
const tokensCSV = (tokens) => toCSV(tokens.table, ['id', 'name', 'unit', ...WINDOWS.flatMap((w) => [`transfers_${w}`, `wallets_${w}`])]);

function methodologyPage({ meta }) {
  const body = `
<h1>How the numbers are made</h1>
<p class="lede">Everything here is computed from public chain data with a method anyone can repeat. ALGO Tables reports numbers and says how it got them; it doesn't take sides.</p>
<h2>Where the data comes from</h2>
<ul>
<li><strong>Block headers</strong> from Nodely's free Algorand indexer: every block's proposer, payout, fees, bonus and the accounts suspended in it, back to the start of staking rewards in January 2025.</li>
<li><strong>Accounts and supply</strong> from Nodely's free algod API: each proposer's balance, status and reward eligibility, online stake, and the FeeSink balance.</li>
<li><strong>Names</strong> from the NFD API, verified links only.</li>
<li><strong>ALGO price</strong> from CoinGecko, used only to show rough dollar figures.</li>
<li><strong>Foundation holdings and published totals</strong>, copied by hand from the Foundation's transparency reports and monthly reports into <a href="${REPO}/tree/main/registry">a file in the repo</a>.</li>
</ul>
<h2>Security Budget</h2>
<ul>
<li><strong>Paid to validators</strong> is the sum of each block's proposer payout. A block pays nothing when its proposer isn't eligible for rewards, which is why the share of blocks that pay out stays near the community's share of stake.</li>
<li><strong>Fees</strong> are the fees collected in each block. All fees go to the FeeSink; half go back out to proposers.</li>
<li><strong>Fee per transaction that would replace the bonus</strong> is twice the payouts divided by the transactions, because proposers receive half of fees.</li>
<li><strong>FeeSink runway</strong> is the FeeSink balance divided by its average daily drain (payouts minus fees) over the last 7 full days. It assumes no top-ups.</li>
<li><strong>Bonus projection</strong> applies the 1% drop per million blocks to today's bonus, at the last 30 days' block time, to the end of January 2028.</li>
<li><strong>Top-ups</strong> are inferred from the FeeSink balance between updates; only changes above 100,000 ALGO count, and only when both updates were at the chain tip.</li>
</ul>
<h2>Stake</h2>
<ul>
<li><strong>Expected blocks</strong> are the blocks in the window times the account's current online stake divided by total online stake. The protocol expects an account to propose once every <em>n</em> rounds, where <em>n</em> is total online stake divided by its own, and suspends it after 20<em>n</em> rounds without a block.</li>
<li>Stake is the account's balance now, not over the whole window, so accounts whose balance changed recently will look lucky or unlucky.</li>
<li><strong>Takes rewards</strong> is the account's incentive eligibility. Accounts that don't take rewards include the Foundation's.</li>
<li><strong>Suspensions</strong> count the times the account appeared in a block's list of accounts suspended for absenteeism.</li>
</ul>
<h2>Tokens</h2>
<ul>
<li><strong>Transfers</strong> count asset transfers that move a non-zero amount, including the ones apps make on someone's behalf (inner transactions), such as DEX swaps. Opt-ins and other zero-amount transfers don't count. ALGO itself isn't an asset, so it isn't listed.</li>
<li><strong>Active wallets</strong> are the distinct addresses that sent or received a token. For the last hour and 24 hours they're counted directly. For longer windows, each day's count is averaged over the days in the window, and a day when the token didn't move counts as zero.</li>
<li><strong>Windows</strong>: the last hour and 24 hours run up to the newest block collected. 7, 30, 60 and 90 days are whole UTC days up to yesterday, and year to date runs from January 1 to yesterday.</li>
<li>One-of-one NFTs (a total supply of 1) are left out. Names and unit names are whatever each asset's creator set on-chain and aren't verified, so check the asset ID before trusting a name.</li>
</ul>
<h2>Freshness and failures</h2>
<p>A GitHub Actions job runs about every 15 minutes. Each run picks up new blocks and asset transfers, refreshes a slice of accounts and names, and spends any spare time filling in history. Before publishing, it checks that every round is counted exactly once and that no day pays more than the bonus allows; if a check fails, nothing is published and the site keeps its last good version. If a source is down, the run publishes what it has and lists the problem in <a href="../data/manifest.json">the data status file</a>.</p>
<h2>Data and code</h2>
<p>Every table is available as CSV and JSON under <a href="../data/manifest.json">/data</a>. The collector is plain Node with no dependencies: <a href="${REPO}">${REPO.replace('https://', '')}</a>.</p>`;
  return page({ title: 'Method · ALGO Tables', description: 'How ALGO Tables computes its numbers.', depth: 1, active: 'Method', body, meta });
}

function notFoundPage({ meta }) {
  const body = `<h1>Not here</h1><p class="lede">ALGO Tables was rebuilt in November 2026 and the old tabs are gone. Start from <a href="/index.html">the home page</a>.</p>`;
  return page({ title: 'Not found · ALGO Tables', description: 'Page not found.', depth: 0, active: '', body, meta, root: '/' });
}

export async function renderSite(dir, { sb, stake, tokens, meta, manifest }) {
  const assets = new URL('./assets/', import.meta.url);
  await cp(assets, `${dir}/assets`, { recursive: true });
  await writeOut(`${dir}/.nojekyll`, '');
  await writeOut(`${dir}/index.html`, homePage({ sb, stake, tokens, meta }));
  await writeOut(`${dir}/security-budget/index.html`, securityPage({ sb, meta }));
  await writeOut(`${dir}/stake/index.html`, stakePage({ stake, meta }));
  if (tokens) {
    for (const w of WINDOWS) await writeOut(`${dir}/${tokenPath(w)}`, tokensPage({ tokens, w, meta }));
  } else {
    await writeOut(`${dir}/tokens/index.html`, tokensPendingPage({ meta }));
  }
  await writeOut(`${dir}/methodology/index.html`, methodologyPage({ meta }));
  await writeOut(`${dir}/404.html`, notFoundPage({ meta }));

  await writeOut(`${dir}/data/security-budget.json`, { generatedAt: meta.generatedAt, ...sb });
  await writeOut(`${dir}/data/security-budget-monthly.csv`, toCSV(sb.monthly, ['month', 'partial', 'days', 'blocks', 'paidBlocks', 'payout', 'fees', 'feeShare', 'txns', 'feePerTxn', 'neededFeePerTxn', 'bonusEnd']));
  await writeOut(`${dir}/data/security-budget-daily.csv`, toCSV(sb.daily, ['date', 'partial', 'firstRound', 'lastRound', 'blocks', 'paidBlocks', 'payout', 'fees', 'txns', 'bonus', 'suspensions']));
  await writeOut(`${dir}/data/stake.json`, { generatedAt: meta.generatedAt, ...stake });
  await writeOut(`${dir}/data/stake.csv`, toCSV(stake.rows, ['address', 'name', 'stake', 'status', 'eligible', 'blocks7', 'blocks30', 'blocks90', 'expected30', 'ratio30', 'payout30', 'lastProposed', 'hoursSinceProposal', 'suspensions90']));
  if (tokens) {
    await writeOut(`${dir}/data/tokens.json`, { generatedAt: meta.generatedAt, ...tokens });
    await writeOut(`${dir}/data/tokens.csv`, tokensCSV(tokens));
  }
  await writeOut(`${dir}/data/manifest.json`, JSON.stringify(manifest, null, 2));
}
