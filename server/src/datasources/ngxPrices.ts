import { db } from "../db.js";
import { fetchHtml } from "./fetchHtml.js";
import { extractTables, findMatchingTable, parseNumeric } from "./parseTable.js";
import { logRefresh } from "./refreshLog.js";

// NGX publishes a free public equities price list (no API key required),
// distinct from their paid Market Data API. Unverified from this session
// (outbound access blocked) — see README before relying on this.
const NGX_PRICE_LIST_URL = "https://ngxgroup.com/exchange/data/equities-price-list/";

const HEADER_PATTERNS = {
  symbol: /symbol|ticker/i,
  price: /close|price/i,
};

export interface NgxPriceRefreshResult {
  status: "success" | "error" | "no-match";
  message: string;
  matched: number;
  updated: number;
  unmatchedSymbols: string[];
}

export async function refreshNgxPrices(): Promise<NgxPriceRefreshResult> {
  const startedAt = new Date().toISOString();
  const companies = db.prepare("SELECT id, symbol FROM companies").all() as { id: string; symbol: string }[];
  const bySymbol = new Map(companies.map((c) => [c.symbol.toUpperCase(), c.id]));

  let result: NgxPriceRefreshResult;
  try {
    const html = await fetchHtml(NGX_PRICE_LIST_URL);
    const tables = extractTables(html);
    const match = findMatchingTable(tables, HEADER_PATTERNS);

    if (!match) {
      result = {
        status: "no-match",
        message: "No table on the page matched expected symbol/price headers. The page structure has likely changed since this was written — inspect the live HTML and update HEADER_PATTERNS or the parsing logic in ngxPrices.ts.",
        matched: 0,
        updated: 0,
        unmatchedSymbols: [],
      };
    } else {
      const { table, columnIndex } = match;
      const now = new Date().toISOString();
      const updateStmt = db.prepare(
        "UPDATE companies SET price = ?, price_source = 'ngx-live', price_updated_at = ? WHERE id = ?"
      );

      let updated = 0;
      const unmatchedSymbols: string[] = [];
      const seenSymbols = new Set<string>();

      for (const row of table.rows) {
        const symbolRaw = row[columnIndex.symbol]?.trim().toUpperCase();
        const priceRaw = row[columnIndex.price];
        if (!symbolRaw) continue;
        seenSymbols.add(symbolRaw);

        const companyId = bySymbol.get(symbolRaw);
        if (!companyId) continue;

        const price = parseNumeric(priceRaw ?? "");
        if (price === null || price <= 0) {
          unmatchedSymbols.push(symbolRaw);
          continue;
        }

        updateStmt.run(price, now, companyId);
        updated++;
      }

      result = {
        status: "success",
        message: `Parsed ${table.rows.length} rows from a matched table; updated ${updated} of ${companies.length} tracked companies.`,
        matched: seenSymbols.size,
        updated,
        unmatchedSymbols,
      };
    }
  } catch (err) {
    result = {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
      matched: 0,
      updated: 0,
      unmatchedSymbols: [],
    };
  }

  logRefresh({
    source: "ngx-prices",
    status: result.status === "success" ? "success" : "error",
    message: result.message,
    recordsUpdated: result.updated,
    startedAt,
  });

  return result;
}
