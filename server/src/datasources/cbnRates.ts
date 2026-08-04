import { db } from "../db.js";
import { fetchHtml } from "./fetchHtml.js";
import { extractTables, findMatchingTable, parseNumeric } from "./parseTable.js";
import { logRefresh } from "./refreshLog.js";

// CBN publishes official exchange rates on a public page. Unverified from
// this session (outbound access blocked) — see README before relying on this.
const CBN_RATES_URL = "https://www.cbn.gov.ng/rates/ExchRateByCurrency.html";

const HEADER_PATTERNS = {
  currency: /currency/i,
  rate: /rate|buying|central/i,
};

export interface CbnRateRefreshResult {
  status: "success" | "error" | "no-match";
  message: string;
  ratesFound: number;
}

export async function refreshCbnRates(): Promise<CbnRateRefreshResult> {
  const startedAt = new Date().toISOString();
  let result: CbnRateRefreshResult;

  try {
    const html = await fetchHtml(CBN_RATES_URL);
    const tables = extractTables(html);
    const match = findMatchingTable(tables, HEADER_PATTERNS);

    if (!match) {
      result = {
        status: "no-match",
        message: "No table matched expected currency/rate headers. Inspect the live HTML and update HEADER_PATTERNS in cbnRates.ts.",
        ratesFound: 0,
      };
    } else {
      const { table, columnIndex } = match;
      const now = new Date().toISOString();
      const insertStmt = db.prepare(
        "INSERT INTO fx_rates (pair, rate, source, fetched_at) VALUES (?, ?, 'cbn', ?)"
      );

      let ratesFound = 0;
      for (const row of table.rows) {
        const currency = row[columnIndex.currency]?.trim().toUpperCase();
        const rate = parseNumeric(row[columnIndex.rate] ?? "");
        if (!currency || rate === null || rate <= 0) continue;
        if (!/USD|DOLLAR/.test(currency)) continue; // we only care about USD/NGN for now

        insertStmt.run("USD/NGN", rate, now);
        ratesFound++;
      }

      result =
        ratesFound > 0
          ? { status: "success", message: `Recorded ${ratesFound} USD/NGN rate reading(s).`, ratesFound }
          : {
              status: "no-match",
              message: "Matched a table but found no USD row within it. Inspect the live HTML and adjust the currency filter in cbnRates.ts.",
              ratesFound: 0,
            };
    }
  } catch (err) {
    result = { status: "error", message: err instanceof Error ? err.message : String(err), ratesFound: 0 };
  }

  logRefresh({
    source: "cbn-fx",
    status: result.status === "success" ? "success" : "error",
    message: result.message,
    recordsUpdated: result.ratesFound,
    startedAt,
  });

  return result;
}

export function getLatestUsdRate(): { rate: number; fetchedAt: string } | null {
  const row = db
    .prepare("SELECT rate, fetched_at FROM fx_rates WHERE pair = 'USD/NGN' ORDER BY fetched_at DESC LIMIT 1")
    .get() as { rate: number; fetched_at: string } | undefined;
  return row ? { rate: row.rate, fetchedAt: row.fetched_at } : null;
}
