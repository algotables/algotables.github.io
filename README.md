# ALGO Tables

Independent tables built straight from the Algorand chain, live at https://algotables.github.io.

- **Security Budget**: who pays Algorand's validators, how much fees cover, and how long the FeeSink lasts.
- **Stake**: every account that proposed a block in the last 90 days, with its blocks against what its stake predicts.

Each page explains how its numbers are made, and every table downloads as CSV or JSON from `/data` (see `/data/manifest.json` for freshness).

## How it works

`collect/` is a Node 22 collector with no dependencies. A GitHub Actions job (`.github/workflows/collect.yml`) runs it about every 15 minutes:

1. Read new block headers, online stake, the FeeSink balance, proposer accounts and NFD names from Nodely's free API, NFD and CoinGecko.
2. Spend whatever budget is left filling in history back to January 2025.
3. Check that every round is counted exactly once; if anything fails, nothing is published.
4. Render static pages plus CSV and JSON, push the output and the collector's state to the `site` branch, and deploy it to GitHub Pages.

`registry/foundation.json` holds figures copied by hand from the Algorand Foundation's reports (holdings and published reward totals).

## Running it

```sh
node collect/test.mjs        # offline smoke test with synthetic blocks
node collect/run.mjs out     # one real run (needs network); state in out/state, pages in out/site
```

The old tabbed site lives in the git history before this commit.
