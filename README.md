# NEON Invest

A web app for screening NGX (Nigerian Exchange)-listed companies by dividend yield and financial health, with an investment calculator, goal tracking, and push notifications.

**This is Phase 1 + the goals/notifications layer of a larger roadmap (see below). It is informational only — not investment advice.**

## Important: about the data

The companies, prices, dividends, and financials in this app are currently **seeded reference/illustrative data** (`server/src/seed.ts`), not a live market feed. They're realistic in shape (based on real NGX-listed companies and their general public history) but are **not guaranteed accurate** and should not be relied on for real investment decisions. Every screen in the app carries a disclaimer to this effect. Live data integration is Phase 2 (see below) — until then, verify anything you see here against NGX (ngxgroup.com), SEC Nigeria, and each company's audited financial statements before investing real money.

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

## Roadmap (not yet built)

- **Phase 2 — Live data + budget planner**
  - Replace seed data with a real pipeline: NGX daily bulletins/filings, SEC Nigeria filings, CBN/NBS macro data (inflation, FX rates) for real-yield adjustment.
  - Budget planner: enter a daily/weekly/monthly budget, get a suggested allocation across screened companies.
  - News/event engine: scrape and tag news mentioning each company (e.g. government contract awards, regulatory changes) and surface it on the company dashboard as another informational signal — not an auto-predicted price/revenue impact.

- **Phase 3 — Refinement**
  - Blend news sentiment into the signal card.
  - Full portfolio tracking (real holdings, not just goal commitments).
  - Forex-adjusted return views (NGN vs. USD).

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

client/   React + TypeScript (Vite), Tailwind CSS, Recharts
  src/pages/Home.tsx          screener list
  src/pages/CompanyDetail.tsx    dashboard + calculator
  src/pages/Goals.tsx          goal tracking + notification opt-in
  src/deviceId.ts           anonymous device ID (localStorage)
  src/push.ts             client-side push subscription flow
  public/sw.js             service worker (receives push events)
  src/components/          reusable UI (score circles, charts, signal card, goal card, check-in prompt)
```
