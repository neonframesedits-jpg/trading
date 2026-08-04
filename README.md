# Nigeria Investment Screener

A web app for screening NGX (Nigerian Exchange)-listed companies by dividend yield and financial health, with an investment calculator and per-company dashboard.

**This is Phase 1 of a larger roadmap (see below). It is informational only — not investment advice.**

## Important: about the data

The companies, prices, dividends, and financials in this app are currently **seeded reference/illustrative data** (`server/src/seed.ts`), not a live market feed. They're realistic in shape (based on real NGX-listed companies and their general public history) but are **not guaranteed accurate** and should not be relied on for real investment decisions. Every screen in the app carries a disclaimer to this effect. Live data integration is Phase 2 (see below) — until then, verify anything you see here against NGX (ngxgroup.com), SEC Nigeria, and each company's audited financial statements before investing real money.

The app also does not predict share price movement. Return projections cover **dividend income only**, based on a company's historical yield range, shown as a low/expected/high band rather than a single guaranteed number — because no algorithm can promise a fixed return from a stock.

## What's built (Phase 1)

- **Screener** — every seeded company ranked by a weighted composite score:
  - Dividend yield (30%)
  - Dividend consistency / no recent cuts (20%)
  - Payout ratio sustainability (15%)
  - Profitability / ROE (15%)
  - Leverage / debt-to-equity (10%)
  - Revenue growth (10%)
  
  Scores are relative to the rest of the dataset (min-max normalized), plus a sector-relative rank. Companies with dividend cuts, negative earnings years, or unsustainable payout ratios are auto-flagged (see `server/src/scoring.ts`).

- **Investment calculator** — enter an amount (with quick presets: ₦50k/₦100k/₦500k/₦1M) and a time frame, and see: shares bought, leftover cash, projected dividend income (low/expected/high range), a cumulative-income chart, and contextual tips (e.g. "you're close to affording another share," "consider diversifying").

- **Company dashboard** — composite score, a breakdown of the six score components as progress circles, a growth history chart (share price / dividend per share / EPS over time), and an **informational signal card** summarizing strengths and red flags in plain language.

- **Signals, not commands** — by design, the app never tells you to "buy" or "sell." It surfaces informational observations ("dividend cut in 2 of the last 5 years," "payout ratio is stretched thin") and lets you decide. This is intentional: personalized buy/sell recommendations can fall under SEC-regulated investment advice in Nigeria, and informational framing keeps the tool useful without that exposure.

## Roadmap (not yet built)

- **Phase 2 — Live data + budget planner**
  - Replace seed data with a real pipeline: NGX daily bulletins/filings, SEC Nigeria filings, CBN/NBS macro data (inflation, FX rates) for real-yield adjustment.
  - Budget planner: enter a daily/weekly/monthly budget, get a suggested allocation across screened companies.
  - News/event engine: scrape and tag news mentioning each company (e.g. government contract awards, regulatory changes) and surface it on the company dashboard as another informational signal — not an auto-predicted price/revenue impact.

- **Phase 3 — Refinement**
  - Blend news sentiment into the signal card.
  - Portfolio tracking (companies you've actually invested in, with real progress-over-time circles).
  - Forex-adjusted return views (NGN vs. USD).

## Running locally

Requires Node 20+.

```bash
npm install       # installs client + server workspaces
npm run seed       # seeds server/data.sqlite with reference data
npm run dev        # runs server (:4000) and client (:5173) together
```

Then open the client URL printed in the terminal (defaults to http://localhost:5173).

## Project structure

```
server/   Express + TypeScript API, SQLite (better-sqlite3)
  src/db.ts          schema
  src/seed.ts         reference/illustrative seed data
  src/scoring.ts       composite scoring algorithm
  src/calculator.ts     investment projection logic
  src/index.ts        API routes

client/   React + TypeScript (Vite), Tailwind CSS, Recharts
  src/pages/Home.tsx          screener list
  src/pages/CompanyDetail.tsx    dashboard + calculator
  src/components/          reusable UI (score circles, charts, signal card)
```
