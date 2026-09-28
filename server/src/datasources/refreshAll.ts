import { refreshNgxPrices, type NgxPriceRefreshResult } from "./ngxPrices.js";
import { refreshCbnRates, type CbnRateRefreshResult } from "./cbnRates.js";
import { refreshNgxDividends, type NgxDividendRefreshResult } from "./ngxDividends.js";
import { refreshGdeltNews, refreshRssNews } from "../news/ingest.js";

type ErrorResult = { status: "error"; message: string };

export interface RefreshAllResult {
  ngxPrices: NgxPriceRefreshResult | ErrorResult;
  cbnRates: CbnRateRefreshResult | ErrorResult;
  ngxDividends: NgxDividendRefreshResult | ErrorResult;
  rssNews: Awaited<ReturnType<typeof refreshRssNews>> | ErrorResult;
  gdeltNews: { status: "started"; message: string };
}

function settledOrError<T>(r: PromiseSettledResult<T>): T | ErrorResult {
  if (r.status === "fulfilled") return r.value;
  return { status: "error", message: r.reason instanceof Error ? r.reason.message : String(r.reason) };
}

// Runs each fetcher independently so one source failing (e.g. NGX blocking
// the request) doesn't prevent the others from updating. GDELT is started
// but not awaited — its rate limit makes a full pass take a few minutes, and
// its outcome is recorded in the refresh log when it finishes.
export async function refreshAllDataSources(): Promise<RefreshAllResult> {
  refreshGdeltNews().catch((err) => console.error("GDELT news refresh failed:", err));

  const [ngxPrices, cbnRates, ngxDividends, rssNews] = await Promise.allSettled([
    refreshNgxPrices(),
    refreshCbnRates(),
    refreshNgxDividends(),
    refreshRssNews(),
  ]);

  return {
    ngxPrices: settledOrError(ngxPrices),
    cbnRates: settledOrError(cbnRates),
    ngxDividends: settledOrError(ngxDividends),
    rssNews: settledOrError(rssNews),
    gdeltNews: { status: "started", message: "Running in the background; check the data status page in a few minutes." },
  };
}
