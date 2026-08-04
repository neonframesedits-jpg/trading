import { refreshNgxPrices, type NgxPriceRefreshResult } from "./ngxPrices.js";
import { refreshCbnRates, type CbnRateRefreshResult } from "./cbnRates.js";
import { refreshNgxDividends, type NgxDividendRefreshResult } from "./ngxDividends.js";

export interface RefreshAllResult {
  ngxPrices: NgxPriceRefreshResult | { status: "error"; message: string };
  cbnRates: CbnRateRefreshResult | { status: "error"; message: string };
  ngxDividends: NgxDividendRefreshResult | { status: "error"; message: string };
}

function settledOrError<T>(r: PromiseSettledResult<T>): T | { status: "error"; message: string } {
  if (r.status === "fulfilled") return r.value;
  return { status: "error", message: r.reason instanceof Error ? r.reason.message : String(r.reason) };
}

// Runs each fetcher independently so one source failing (e.g. NGX blocking
// the request) doesn't prevent the others from updating.
export async function refreshAllDataSources(): Promise<RefreshAllResult> {
  const [ngxPrices, cbnRates, ngxDividends] = await Promise.allSettled([
    refreshNgxPrices(),
    refreshCbnRates(),
    refreshNgxDividends(),
  ]);

  return {
    ngxPrices: settledOrError(ngxPrices),
    cbnRates: settledOrError(cbnRates),
    ngxDividends: settledOrError(ngxDividends),
  };
}
