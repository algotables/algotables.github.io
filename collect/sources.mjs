// Off-header sources: proposer accounts (algod), names (NFD) and the ALGO price (CoinGecko).
import { ALGOD, getJSON, spent } from './lib.mjs';

// Current stake and status for proposers, oldest-refreshed first, each at most every 6 hours.
export async function refreshAccounts(accounts, addresses, nowSec, maxCount, reserveMs) {
  const due = addresses
    .filter((a) => !accounts[a] || nowSec - accounts[a].at > 6 * 3600)
    .sort((a, b) => (accounts[a]?.at ?? 0) - (accounts[b]?.at ?? 0))
    .slice(0, maxCount);
  let refreshed = 0;
  for (const address of due) {
    if (spent(reserveMs)) break;
    const j = await getJSON(`${ALGOD}/v2/accounts/${address}?exclude=all`, { allow: [404] });
    if (!j) continue;
    accounts[address] = {
      at: nowSec,
      amount: j.amount,
      status: j.status,
      eligible: Boolean(j['incentive-eligible']),
      lastProposed: j['last-proposed'] ?? null,
      lastHeartbeat: j['last-heartbeat'] ?? null,
      voteLast: j.participation?.['vote-last-valid'] ?? null,
    };
    refreshed++;
  }
  return refreshed;
}

// Verified NFD names only, 20 addresses a request, refreshed weekly. A 404 means none of the batch has one.
export async function refreshNames(names, addresses, nowSec, maxBatches, reserveMs) {
  const due = addresses.filter((a) => !names[a] || nowSec - names[a].at > 7 * 86_400).slice(0, maxBatches * 20);
  for (let i = 0; i < due.length; i += 20) {
    if (spent(reserveMs)) break;
    const batch = due.slice(i, i + 20);
    const query = batch.map((a) => `address=${a}`).join('&');
    const j = await getJSON(`https://api.nf.domains/nfd/lookup?${query}&view=tiny`, { allow: [404] });
    for (const address of batch) names[address] = { at: nowSec, name: j?.[address]?.name ?? null };
  }
}

// Same sanity gate as Eden Pods' price feed: a reading over 3x or under 1/3 of the recent average is rejected.
export async function refreshPrice(price, nowSec) {
  const j = await getJSON('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
  const usd = j?.algorand?.usd;
  if (!(typeof usd === 'number' && usd > 0)) throw new Error('CoinGecko returned no ALGO price');
  const recent = price.recent ?? [];
  const average = recent.length ? recent.reduce((s, x) => s + x, 0) / recent.length : null;
  if (recent.length >= 2 && (usd > average * 3 || usd < average / 3)) {
    throw new Error(`price ${usd} rejected against a recent average of ${average.toFixed(4)}`);
  }
  recent.push(usd);
  while (recent.length > 24) recent.shift();
  Object.assign(price, { usd, at: nowSec, recent });
}
