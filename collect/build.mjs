// Turns collected state into the published tables.
import { ALGO, utcDay, addDays } from './lib.mjs';

const JAN_2028_END = Date.parse('2028-01-31T23:59:59Z') / 1000; // rewards are committed "through January 2028"
const BONUS_DECAY = 0.99; // the bonus drops 1% every million blocks
const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);

export function dailyRows(S, today) {
  const days = Object.keys(S.days).sort();
  const oldest = days[0];
  return days.map((day, i) => {
    const D = S.days[day];
    const prev = i > 0 ? S.days[days[i - 1]] : null;
    const chained = prev && prev.last + 1 === D.first && prev.tc1 != null && D.tc1 != null;
    return {
      date: day,
      partial: day === today || day === oldest,
      firstRound: D.first,
      lastRound: D.last,
      blocks: D.blocks,
      paidBlocks: D.paid,
      payout: D.payout / ALGO,
      fees: D.fees / ALGO,
      txns: chained ? D.tc1 - prev.tc1 : (D.tc1 ?? 0) - (D.tc0 ?? 0),
      bonus: D.bonus / ALGO,
      suspensions: D.absent,
    };
  });
}

export function monthlyRows(daily) {
  const byMonth = new Map();
  for (const d of daily) {
    const key = d.date.slice(0, 7);
    const M = byMonth.get(key) ?? { month: key, days: 0, blocks: 0, paidBlocks: 0, payout: 0, fees: 0, txns: 0, bonusEnd: 0, partial: false };
    M.days += 1;
    M.blocks += d.blocks;
    M.paidBlocks += d.paidBlocks;
    M.payout += d.payout;
    M.fees += d.fees;
    M.txns += d.txns;
    M.bonusEnd = d.bonus;
    M.partial ||= d.partial;
    byMonth.set(key, M);
  }
  const rows = [...byMonth.values()].filter((M) => M.payout > 0);
  for (const M of rows) {
    const daysInMonth = new Date(Date.UTC(Number(M.month.slice(0, 4)), Number(M.month.slice(5, 7)), 0)).getUTCDate();
    if (M.days < daysInMonth) M.partial = true;
    M.paidShare = M.blocks ? M.paidBlocks / M.blocks : null;
    M.feeShare = M.payout ? M.fees / M.payout : null;
    M.feePerTxn = M.txns ? M.fees / M.txns : null;
    M.neededFeePerTxn = M.txns ? (2 * M.payout) / M.txns : null; // proposers get 50% of fees
  }
  return rows;
}

// Our totals next to the figures the Foundation (and Blockworks) published, once our data covers the period.
function checks(reported, daily, S) {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const oldest = daily[0]?.date;
  return reported.map((r) => {
    let ours = 0;
    let covered = true;
    for (let day = r.from; day <= r.to; day = addDays(day, 1)) {
      const d = byDate.get(day);
      const beforeRewards = day < '2025-01-23';
      if (!d) {
        if (!beforeRewards) covered = false;
        continue;
      }
      // The oldest day is cut off at the floor round, which is before rewards began, so it still counts once history is complete.
      if (d.partial && !(day === oldest && S.back <= S.floor)) covered = false;
      ours += d.payout;
    }
    return { ...r, ours: covered ? ours : null, diff: covered ? (ours - r.algo) / r.algo : null };
  });
}

export function buildSecurityBudget({ S, samples, price, foundation, nowSec }) {
  const today = utcDay(nowSec);
  const daily = dailyRows(S, today);
  const monthly = monthlyRows(daily);
  const complete = daily.filter((d) => !d.partial);
  const w30 = complete.slice(-30);
  const w7 = complete.slice(-7);
  const blocks30 = sum(w30, 'blocks');
  const payout30 = sum(w30, 'payout');
  const fees30 = sum(w30, 'fees');
  const txns30 = sum(w30, 'txns');
  const blockTime = blocks30 ? (w30.length * 86_400) / blocks30 : null;
  const sample = samples.at(-1);
  const sink = sample?.sink != null ? sample.sink / ALGO : null;
  const drain = w7.length ? (sum(w7, 'payout') - sum(w7, 'fees')) / w7.length : null; // ALGO a day leaving the FeeSink
  const bonusNow = daily.at(-1)?.bonus ?? null;
  const blocksToEnd = blockTime ? Math.max(0, (JAN_2028_END - nowSec) / blockTime) : null;
  const feePerTxn = txns30 ? fees30 / txns30 : null;
  const neededFeePerTxn = txns30 ? (2 * payout30) / txns30 : null;
  const headline = {
    windowDays: w30.length,
    payout30,
    fees30,
    txns30,
    paidShare30: blocks30 ? sum(w30, 'paidBlocks') / blocks30 : null,
    feeShare30: payout30 ? fees30 / payout30 : null,
    feePerTxn,
    neededFeePerTxn,
    feeMultiple: feePerTxn ? neededFeePerTxn / feePerTxn : null,
    bonusNow,
    bonusAtEnd: bonusNow != null && blocksToEnd != null ? bonusNow * BONUS_DECAY ** (blocksToEnd / 1e6) : null,
    daysToEnd: Math.max(0, (JAN_2028_END - nowSec) / 86_400),
    blockTime,
    feeSink: sink,
    drainPerDay: drain,
    runwayDays: sink != null && drain > 0 ? sink / drain : null,
    onlineStake: sample ? sample.online / ALGO : null,
    priceUsd: price.usd ?? null,
    priceAt: price.at ?? null,
  };
  const holdings = foundation.holdings.map((h, i, all) => ({
    ...h,
    change: i > 0 && all[i - 1].algo != null && h.algo != null ? h.algo - all[i - 1].algo : null,
  }));
  return {
    headline,
    monthly,
    daily,
    topups: S.topups.map((t) => ({ date: utcDay(t.t), round: t.round, sinceRound: t.sinceRound, algo: t.algo })),
    holdings,
    checks: checks(foundation.reported, daily, S),
  };
}

export function buildStake({ S, accounts, names, samples, nowSec, blockTime }) {
  const today = utcDay(nowSec);
  const sample = samples.at(-1);
  const online = sample?.online ?? null;
  const span = (n) => {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      if (S.days[day]) days.push(day);
    }
    return { days, rounds: days.reduce((total, day) => total + S.days[day].blocks, 0) };
  };
  const W7 = span(7);
  const W30 = span(30);
  const W90 = span(90);
  const tally = (days) => {
    const map = new Map();
    for (const day of days) {
      for (const [address, [count, pay]] of Object.entries(S.prop[day] ?? {})) {
        const entry = map.get(address) ?? [0, 0];
        entry[0] += count;
        entry[1] += pay;
        map.set(address, entry);
      }
    }
    return map;
  };
  const t7 = tally(W7.days);
  const t30 = tally(W30.days);
  const t90 = tally(W90.days);
  const suspensions = new Map();
  for (const day of W90.days) {
    for (const [address, n] of Object.entries(S.absent[day] ?? {})) suspensions.set(address, (suspensions.get(address) ?? 0) + n);
  }
  const blocks30 = W30.rounds;
  const rows = [...t90.keys()].map((address) => {
    const acct = accounts[address];
    const stake = acct ? (acct.status === 'Online' ? acct.amount : 0) : null;
    const expected30 = stake && online ? (blocks30 * stake) / online : null;
    const b30 = t30.get(address)?.[0] ?? 0;
    const lastProposed = acct?.lastProposed ?? null;
    return {
      address,
      name: names[address]?.name ?? null,
      stake: stake != null ? stake / ALGO : null,
      status: acct?.status ?? null,
      eligible: acct ? acct.eligible : null,
      blocks7: t7.get(address)?.[0] ?? 0,
      blocks30: b30,
      blocks90: t90.get(address)?.[0] ?? 0,
      expected30,
      ratio30: expected30 != null && expected30 >= 5 ? b30 / expected30 : null,
      payout30: (t30.get(address)?.[1] ?? 0) / ALGO,
      lastProposed,
      hoursSinceProposal: lastProposed != null && blockTime ? ((S.fwd - lastProposed) * blockTime) / 3600 : null,
      suspensions90: suspensions.get(address) ?? 0,
    };
  });
  rows.sort((a, b) => (b.stake ?? -1) - (a.stake ?? -1) || b.blocks90 - a.blocks90);
  const onlineStakes = rows.filter((r) => r.stake > 0).map((r) => r.stake * ALGO).sort((a, b) => b - a);
  let running = 0;
  let thirdCount = null;
  for (let i = 0; i < onlineStakes.length; i++) {
    running += onlineStakes[i];
    if (online && running >= online / 3) {
      thirdCount = i + 1;
      break;
    }
  }
  const paid30 = W30.days.reduce((total, day) => total + S.days[day].paid, 0);
  return {
    summary: {
      windowDays: { d7: W7.days.length, d30: W30.days.length, d90: W90.days.length },
      onlineStake: online != null ? online / ALGO : null,
      knownOnlineStake: onlineStakes.reduce((a, b) => a + b, 0) / ALGO,
      proposers90: rows.length,
      proposers30: rows.filter((r) => r.blocks30 > 0).length,
      eligibleOnline: rows.filter((r) => r.stake > 0 && r.eligible).length,
      online: rows.filter((r) => r.stake > 0).length,
      thirdCount,
      unpaidShare30: blocks30 ? 1 - paid30 / blocks30 : null,
      suspensions90: [...suspensions.values()].reduce((a, b) => a + b, 0),
      accountsRefreshed: rows.filter((r) => r.status != null).length,
    },
    rows,
  };
}
