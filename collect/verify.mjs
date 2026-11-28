// Internal consistency checks. A failure stops the run before anything is published,
// so the live site keeps its last good version.
export function verify({ S, before, budget }) {
  const fail = (message) => {
    throw new Error(`verify: ${message}`);
  };
  if (before.fwd != null && S.fwd < before.fwd) fail('the forward cursor went backwards');
  if (before.back != null && S.back > before.back) fail('the history cursor went forwards');
  if (Object.keys(S.days).length < before.days) fail('days disappeared');
  const blocks = Object.values(S.days).reduce((total, D) => total + D.blocks, 0);
  if (S.fwd != null && blocks !== S.fwd - S.back + 1) fail(`counted ${blocks} blocks for rounds ${S.back}-${S.fwd}`);
  for (const [day, D] of Object.entries(S.days)) {
    if (D.blocks > 40_000) fail(`${day} has ${D.blocks} blocks, more than the chain can make in a day`);
    if (D.paid > D.blocks) fail(`${day} has more paid blocks than blocks`);
    if (D.payout > D.blocks * 10e6 + D.fees) fail(`${day} pays out more than 10 ALGO a block plus fees`);
    if (D.last - D.first + 1 !== D.blocks) fail(`${day} is missing blocks between rounds ${D.first} and ${D.last}`);
  }
  if (budget.requests > 20_000) fail(`made ${budget.requests} requests, far over plan`);
}
