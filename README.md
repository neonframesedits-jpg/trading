# NEON Invest

A web app for screening NGX (Nigerian Exchange)-listed companies by dividend yield and financial health, with an investment calculator, goal tracking, and push notifications.

**This is Phase 1 + the goals/notifications layer of a larger roadmap (see below). It is informational only — not investment advice.**

## Important: about the data

The companies, prices, dividends, and financials in this app are currently **seeded reference/illustrative data** (`server/src/seed.ts`), not a live market feed. They're realistic in shape (based on real NGX-listed companies and their general public history) but are **not guaranteed accurate** and should not be relied on for real investment decisions. A live data pipeline exists (see "Live data pipeline" below) but has not been verified against real pages yet — until it has, treat every number in this app as illustrative. Every screen carries a disclaimer to this effect, and it becomes more specific (naming the actual source and refresh time) once a company's price has genuinely been live-updated. Verify anything you see here against NGX (ngxgroup.com), SEC Nigeria, and each company's audited financial statements before investing real money.

The app also does not predict share price movement. Return projections cover **dividend income only**, based on a company's historical yield range, shown as a low/expected/high band rather than a single guaranteed number — because no algorithm can promise a fixed return from a stock.

## What's built

- **Screener** — every seeded company ranked by a weighted composite score:
  - Dividend yield (30%)
  - Dividend consistency / no recent cuts (20%)
  - Payout ratio sustainability (15%)
  - Profitability / ROE (15%)
  - Leverage / debt-to-equity (10%)
  - Revenue growth (10%)
  
  Scores are relative to the rest of the dataset (min-max normalized), plus a sector-relative rank. Companies with dividend cuts, negative earnings years, or unsustainable payout ratios are auto-flagged (see `server/src/scoring.ts`).

- **Investment calculator** — enter an amount (with quick presets: ₦50k/₦100k/₦500k/₦1M) and a time frame, and see: shares bought, leftover cash, projected dividend income (low/expected/high range), a cumulative-income chart, and contextual tips.

- **Company dashboard** — composite score, a breakdown of the six score components as progress circles, a growth history chart (share price / dividend per share / EPS over time), and an **informational signal card** summarizing strengths and red flags in plain language.

- **Signals, not commands** — by design, the app never tells you to "buy" or "sell." It surfaces informational observations ("dividend cut in 2 of the last 5 years," "payout ratio is stretched thin") and lets you decide. This is intentional: personalized buy/sell recommendations can fall under SEC-regulated investment advice in Nigeria, and informational framing keeps the tool useful without that exposure.

- **Goals** (`/goals`) — set a concrete financial goal (land down payment, car, business capital, custom), then commit an amount straight from any company's calculator toward it. Progress shows as a circle and a running total; hitting 100% is flagged explicitly. No login required — goals are scoped to an anonymous device ID stored in `localStorage`.

- **Check-in nudges** — if you have no goals, or haven't touched one in 7+ days, the app surfaces a friendly one-tap prompt (in-app, throttled to at most once a day) asking what you're investing toward.

- **Real push notifications** — via the Web Push API (VAPID + service worker, see `server/src/push.ts` and `client/public/sw.js`). An hourly server-side sweep (`server/src/scheduler.ts`) sends an actual device notification to subscribed devices that need a goal check-in. Works on desktop/Android without installing; on iOS, Safari requires adding the app to the Home Screen first (`manifest.webmanifest` is included for this).

- **Live data pipeline** (`/data-status`) — a daily scheduled job (plus a manual "Refresh now" button) that attempts to fetch real data from three free public sources and fold it into the same `companies`/`financials` tables the rest of the app already reads from:
  - **NGX share prices** (`server/src/datasources/ngxPrices.ts`) — NGX's free public equities price list (distinct from their paid Market Data API, which costs $1,000–$2,500/yr and isn't used here).
  - **CBN USD/NGN exchange rate** (`server/src/datasources/cbnRates.ts`) — CBN's official public rates page.
  - **NGX dividend declarations** (`server/src/datasources/ngxDividends.ts`) — NGX's corporate-actions page.

  ### ⚠️ This pipeline has never been run against the real pages — here's why, and what to do about it

  This was built inside a sandboxed session whose network policy blocks all outbound web access except a short allowlist (npm, GitHub, a few others) — even a plain request to `example.com` gets rejected by the egress proxy, not by the target site. That's a property of *that session's* environment, not of NGX or CBN — but it means the parsing logic in `datasources/` was written without ever seeing the actual HTML it targets. It uses structure-tolerant heuristics (look for a table whose header row contains "symbol"/"price"-like text, rather than a hardcoded CSS selector) specifically because exact markup was unknown, but that is not a substitute for actually testing it.

  **Before trusting any live data this pipeline reports:**
  1. Deploy or run the server somewhere with normal internet access.
  2. Visit `/data-status` and click "Refresh now."
  3. If a source shows `error` — read the message (usually an HTTP status or timeout) and check whether the URL in that file is still correct, or whether the site is now blocking automated requests (possible — this hasn't been checked).
  4. If a source shows `no-match` — the page loaded fine but no table matched the expected headers, meaning the real markup differs from what the heuristics expect. Open the page's HTML, find the actual table/structure, and update `HEADER_PATTERNS` (or rewrite the parsing logic entirely — dividend/corporate-action pages in particular are as likely to be article/list-based as table-based; see the unused `extractSymbolDividendPairsFromText` helper in `ngxDividends.ts` as a starting point if so).
  5. Only once a source shows `success` with a sensible `records_updated` count should its data be treated as real.

  Until that verification happens, treat every price/dividend in this app as the same seeded reference data described above — the pipeline existing does not mean it is working.

## Roadmap (not yet built)

- **Phase 2 remainder**
  - Verify and fix the live data pipeline above against real pages (see the warning).
  - NBS inflation data, for a real-yield (inflation-adjusted) view.
  - Budget planner: enter a daily/weekly/monthly budget, get a suggested allocation across screened companies.
  - News/event engine: scrape and tag news mentioning each company (e.g. government contract awards, regulatory changes) and surface it on the company dashboard as another informational signal — not an auto-predicted price/revenue impact.

- **Phase 3 — Refinement**
  - Blend news sentiment into the signal card.
  - Full portfolio tracking (real holdings, not just goal commitments).
  - Forex-adjusted return views (NGN vs. USD), using the CBN rate once verified live.

## Running locally

Requires Node 20+.

```bash
npm install       # installs client + server workspaces
npm run seed       # seeds server/data.sqlite with reference data
npm run dev        # runs server (:4000) and client (:5173) together
```

Then open the client URL printed in the terminal (defaults to http://localhost:5173). On first run, the server auto-generates `server/vapid.json` (gitignored) for push notifications — don't commit it, and don't reuse it across environments you don't control.

## Project structure

```
server/   Express + TypeScript API, SQLite (better-sqlite3)
  src/db.ts             schema
  src/seed.ts            reference/illustrative seed data
  src/scoring.ts          composite scoring algorithm
  src/calculator.ts        investment projection logic
  src/goals.ts            goals CRUD + check-in logic
  src/checkin.ts           shared "does this device need a nudge" logic
  src/deviceMiddleware.ts     anonymous device identity
  src/push.ts             VAPID keys + web-push sending
  src/pushRoutes.ts         subscribe/unsubscribe/test endpoints
  src/scheduler.ts          hourly sweep that sends real check-in notifications
  src/index.ts            API routes
  src/dataRoutes.ts         /api/data/refresh and /api/data/status
  src/datasources/
    fetchHtml.ts            fetch wrapper with browser UA + timeout
    parseTable.ts            generic, header-keyword-based HTML table parser
    ngxPrices.ts             NGX share price fetcher (UNVERIFIED — see warning above)
    cbnRates.ts             CBN USD/NGN fetcher (UNVERIFIED — see warning above)
    ngxDividends.ts           NGX dividend fetcher (UNVERIFIED — see warning above)
    refreshAll.ts            runs all three independently, one failure doesn't block the others
    refreshLog.ts            data_refresh_log read/write helpers
    scheduler.ts             daily scheduled refresh

client/   React + TypeScript (Vite), Tailwind CSS, Recharts
  src/pages/Home.tsx          screener list
  src/pages/CompanyDetail.tsx    dashboard + calculator
  src/pages/Goals.tsx          goal tracking + notification opt-in
  src/pages/DataStatus.tsx       live data pipeline status + manual refresh
  src/deviceId.ts           anonymous device ID (localStorage)
  src/push.ts             client-side push subscription flow
  public/sw.js             service worker (receives push events)
  src/components/          reusable UI (score circles, charts, signal card, goal card, check-in prompt)
```
