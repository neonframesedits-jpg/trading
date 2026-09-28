# NEON Invest

A web app for screening NGX (Nigerian Exchange)-listed companies by dividend yield and financial health, with an investment calculator, goal tracking, push notifications, and a news pipeline that watches Nigerian and international coverage for company news and investment opportunities.

**It is informational only — not investment advice.**

## Important: about the data

The companies, prices, dividends, and financials in this app are currently **seeded reference/illustrative data** (`server/src/seed.ts`), not a live market feed. They're realistic in shape (based on real NGX-listed companies and their general public history) but are **not guaranteed accurate** and should not be relied on for real investment decisions. A live data pipeline exists (see below) but has not been verified against real sources yet — until it has, treat every number in this app as illustrative. Every screen carries a disclaimer to this effect, and it becomes more specific (naming the actual source and refresh time) once a company's price has genuinely been live-updated. Verify anything you see here against NGX (ngxgroup.com), SEC Nigeria, and each company's audited financial statements before investing real money.

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

- **Company dashboard** — composite score, a breakdown of the six score components as progress circles, a growth history chart (share price / dividend per share / EPS over time), an **informational signal card** summarizing strengths and red flags in plain language, and recent news mentioning the company.

- **Signals, not commands** — by design, the app never tells you to "buy" or "sell." It surfaces informational observations ("dividend cut in 2 of the last 5 years," "payout ratio is stretched thin") and lets you decide. This is intentional: personalized buy/sell recommendations can fall under SEC-regulated investment advice in Nigeria, and informational framing keeps the tool useful without that exposure.

- **Goals** (`/goals`) — set a concrete financial goal (land down payment, car, business capital, custom), then commit an amount straight from any company's calculator toward it. Progress shows as a circle and a running total; hitting 100% is flagged explicitly. No login required — goals are scoped to an anonymous device ID stored in `localStorage`.

- **Check-in nudges** — if you have no goals, or haven't touched one in 7+ days, the app surfaces a friendly one-tap prompt (in-app, throttled to at most once a day) asking what you're investing toward.

- **Real push notifications** — via the Web Push API (VAPID + service worker, see `server/src/push.ts` and `client/public/sw.js`). An hourly server-side sweep (`server/src/scheduler.ts`) sends an actual device notification to subscribed devices that need a goal check-in. Works on desktop/Android without installing; on iOS, Safari requires adding the app to the Home Screen first (`manifest.webmanifest` is included for this).

- **News & opportunities** (`/news`, plus "In the news" on each company page) — collected hourly from two kinds of source:
  - **RSS feeds** from Nigerian and international outlets (`RSS_FEEDS` in `server/src/news/sources.ts`).
  - **GDELT** (a free service monitoring world news in many languages), searched once per tracked company and for broader scouting themes — contract awards, investment deals, M&A and stock-market coverage involving Nigeria (`SCOUTING_THEMES`). This is how foreign-language coverage gets in: GDELT searches full article text, so an article returned by a company-specific search is linked to that company even when its title is in French or Chinese.

  Every article carries a **trust tier**: official sources (NGX, `*.gov.ng`), established outlets (a named list), or unverified (everything else). Companies are tagged by name matching tuned for precision over recall (`server/src/news/companyAliases.ts`) — MTN Group's South African news isn't attached to MTN Nigeria, and the privately held Dangote refinery isn't attached to Dangote Cement. The trade-off is that some genuine mentions are missed; the planned AI analysis step is meant to recover those.

- **Live data pipeline** (`/data-status`) — prices, FX and dividends refresh daily; news hourly; plus a manual "Refresh now" (limited to once per 10 minutes, since the URL is public once deployed and hammering NGX/CBN could get the server blocked). Sources:
  - **NGX share prices** (`server/src/datasources/ngxPrices.ts`) — NGX's free public equities price list (distinct from their paid Market Data API, which costs $1,000–$2,500/yr and isn't used here).
  - **CBN USD/NGN exchange rate** (`server/src/datasources/cbnRates.ts`) — CBN's official public rates page.
  - **NGX dividend declarations** (`server/src/datasources/ngxDividends.ts`) — NGX's corporate-actions page.
  - **RSS news** and **GDELT news** (`server/src/news/ingest.ts`).

  Each source runs independently, so one failing never blocks the others, and each run's outcome is logged and shown on `/data-status`.

### ⚠️ None of these sources has been reached yet — here's why, and what to do about it

This was built inside a sandboxed session whose network policy blocks all outbound web access except a short allowlist (npm, GitHub, a few others) — even `example.com` is rejected by that session's egress proxy. That's a property of the build environment, not of NGX, CBN, GDELT or the news sites, and it goes away once the app runs on normal hosting (see "Deploying to Railway"). But it means nothing here has been run against a real response yet, and the sources differ in how much that matters:

- **RSS and GDELT** use documented, standard formats. Their parsers are unit-tested against sample payloads in those formats (`server/src/news/*.test.ts`), so they're likely to work as-is; the risk is mainly that a feed URL has moved.
- **The NGX and CBN scrapers** read ordinary web pages whose layout has never been seen. They find tables by header keywords rather than hardcoded selectors, and those keyword patterns (`server/src/datasources/headerPatterns.ts`) are tested against plausible layouts — but they are educated guesses until checked against the real pages.

**Before trusting any live data:**
1. Deploy (see below), open `/data-status`, and click "Refresh now." The GDELT pass keeps running in the background for a few minutes (it's rate-limited to one search every ~5 seconds); reload to see its result.
2. `error` — read the message (usually an HTTP status or timeout). Check the URL is still right, or whether the site is blocking automated requests from cloud servers (possible — unknowable until tried).
3. `no-match` — the page loaded, but no table matched the expected headers. Open the page's HTML and adjust `headerPatterns.ts`, or rewrite that fetcher's parsing. The dividend page is the most likely to need this, since corporate-action pages are often article/list-based rather than tables; `extractSymbolDividendPairsFromText` in `ngxDividends.ts` is a starting point if so.
4. Only once a source shows `success` with a sensible record count should its data be treated as real.

## Deploying to Railway

The app deploys as a single service: the Express server serves both the API and the built React app. Config is in `railway.json` (build: `npm run build`, start: `npm start`, health check: `/api/health`), and `package.json` pins Node 22.

1. **Create the project.** In Railway: New Project → Deploy from GitHub repo → pick this repository (you may need to grant Railway's GitHub app access to it first).
2. **Pick the branch.** In the service's settings, set the deploy branch to the one this code is on (or merge it into your default branch first).
3. **Add a volume — don't skip this.** Add a Volume to the service with mount path `/data`. A container's own disk is wiped on every deploy; without a volume, goals, news history, refresh logs and push-notification keys all reset each time you push.
4. **Set variables** (service → Variables):
   - `DATABASE_PATH` = `/data/neon.sqlite` (required — this is what puts the database on the volume)
   - `VAPID_SUBJECT` = `mailto:` followed by your own email address (recommended — push services use it to contact whoever runs the server, and some may reject the built-in placeholder)
   - Don't set `NODE_ENV=production`: it makes the install step skip the build tools (TypeScript, Vite) the build needs.
   - `PORT` is set by Railway automatically.
5. **Get a URL.** Settings → Networking → Generate Domain. It's HTTPS, which service workers and push notifications require.
6. **Deploy and check.** The first boot loads the reference seed data into the empty volume, and the first data refresh starts about 30 seconds after startup. Open `/data-status` and work through the checklist above.

Keep it to **one replica**. The database is a single SQLite file and the schedulers run inside the server process, so a second replica would get its own separate data and double-send notifications.

On first boot the server generates push-notification keys and stores them next to the database (on the volume), so they survive redeploys. To manage them yourself instead, set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Changing the keys later breaks existing notification subscriptions.

## Roadmap (not yet built)

In order:

1. **Verify the live sources** on the deployed app (checklist above) and fix whatever doesn't match.
2. **AI analysis layer** (Claude API) — translate foreign-language articles, work out which companies an article is really about (recovering mentions the precision-first name matching skips), classify the event (contract award, regulatory change, M&A, FX policy, results), and summarize with citations back to the source.
3. **Corroboration and confidence scoring** — an event only becomes a signal once an official source or two independent outlets confirm it; single-source claims stay "unverified." High-confidence events feed the signal card and trigger push alerts.
4. **More primary sources** — the government procurement portal (contract awards straight from the source rather than via news), NBS inflation data for real (inflation-adjusted) yields.
5. **Social media**, last — useful as early leads, but the noisiest and most manipulable source (pump-and-dump schemes on Nigerian stocks spread there), and the most constrained: X's API is paid, and scraping it breaks its terms. Always tier 3.
6. **Budget planner** — enter a daily/weekly/monthly budget, get a suggested allocation across screened companies.
7. **Refinement** — full portfolio tracking (real holdings, not just goal commitments), forex-adjusted return views using the CBN rate once verified.

The pipeline is meant to find information that's public but obscure — foreign-language coverage, official notices few people read, early local reporting. It must never be pointed at non-public information (leaked awards, insider tips): trading on that is insider dealing under Nigeria's Investments and Securities Act.

## Running locally

Requires Node 22.

```bash
npm install       # installs client + server workspaces
npm run seed       # optional: resets server/data.sqlite to the reference data (also happens automatically on an empty database)
npm run dev        # runs server (:4000) and client (:5173) together
npm test          # type-checks and runs the server test suite
```

Then open the client URL printed in the terminal (defaults to http://localhost:5173). On first run, the server generates `server/vapid.json` (gitignored) for push notifications — don't commit it.

To try the production setup locally: `npm run build && DATABASE_PATH=/tmp/neon/neon.sqlite npm start`, then open http://localhost:4000.

## Project structure

```
railway.json              Railway build/deploy config

server/   Express + TypeScript API, SQLite (better-sqlite3)
  src/index.ts            API routes; serves the built client in production
  src/db.ts             schema; DATABASE_PATH selects the database file
  src/seed.ts            reference/illustrative seed data (auto-loaded into an empty database)
  src/scoring.ts          composite scoring algorithm
  src/calculator.ts        investment projection logic
  src/goals.ts            goals CRUD + check-in logic
  src/checkin.ts           shared "does this device need a nudge" logic
  src/deviceMiddleware.ts     anonymous device identity
  src/push.ts             VAPID keys + web-push sending
  src/pushRoutes.ts         subscribe/unsubscribe/test endpoints
  src/scheduler.ts          hourly sweep that sends real check-in notifications
  src/dataRoutes.ts         /api/data/refresh (rate-limited) and /api/data/status
  src/datasources/
    fetchHtml.ts            fetch wrapper with browser UA + timeout
    parseTable.ts            generic, header-keyword-based HTML table parser
    headerPatterns.ts         which table columns each scraper looks for (adjust here on "no-match")
    ngxPrices.ts             NGX share price fetcher (unverified — see warning)
    cbnRates.ts             CBN USD/NGN fetcher (unverified — see warning)
    ngxDividends.ts           NGX dividend fetcher (unverified — see warning)
    refreshAll.ts            runs every source independently
    refreshLog.ts            data_refresh_log read/write helpers
    scheduler.ts             daily data + hourly news refresh
  src/news/
    sources.ts             trust tiers, RSS feed list, GDELT scouting themes
    companyAliases.ts         names each company is matched by
    parse.ts              GDELT/RSS/Atom parsing, URL dedupe keys (pure, tested)
    match.ts              company matching (tested)
    ingest.ts              fetch + store + link articles to companies
    queries.ts             company news / latest news queries
  src/**/*.test.ts          node:test suites (npm test)

client/   React + TypeScript (Vite), Tailwind CSS, Recharts
  src/pages/Home.tsx          screener list
  src/pages/CompanyDetail.tsx    dashboard, news, calculator
  src/pages/News.tsx          news & opportunities feed
  src/pages/Goals.tsx          goal tracking + notification opt-in
  src/pages/DataStatus.tsx       data pipeline status + manual refresh
  src/deviceId.ts           anonymous device ID (localStorage)
  src/push.ts             client-side push subscription flow
  public/sw.js             service worker (receives push events)
  src/components/          reusable UI (score circles, charts, signal card, goal card, news list, check-in prompt)
```
