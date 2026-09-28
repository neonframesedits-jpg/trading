import * as cheerio from "cheerio";
import { db } from "../db.js";
import { fetchHtml } from "./fetchHtml.js";
import { extractTables, findMatchingTable, parseNumeric } from "./parseTable.js";
import { logRefresh } from "./refreshLog.js";
import { NGX_DIVIDEND_HEADERS } from "./headerPatterns.js";

// Dividend/corporate-action pages are much less standardized than a price
// list — some exchanges publish these as tables, others as article-style
// lists. This is the most likely of the three fetchers to need rework once
// checked against the real page. Unverified from this session — see README.
const NGX_CORPORATE_ACTIONS_URL = "https://ngxgroup.com/exchange/data/corporate-actions/";

export interface NgxDividendRefreshResult {
  status: "success" | "error" | "no-match";
  message: string;
  updated: number;
}

export async function refreshNgxDividends(): Promise<NgxDividendRefreshResult> {
  const startedAt = new Date().toISOString();
  const companies = db.prepare("SELECT id, symbol FROM companies").all() as { id: string; symbol: string }[];
  const bySymbol = new Map(companies.map((c) => [c.symbol.toUpperCase(), c.id]));

  let result: NgxDividendRefreshResult;
  try {
    const html = await fetchHtml(NGX_CORPORATE_ACTIONS_URL);
    const tables = extractTables(html);
    const match = findMatchingTable(tables, NGX_DIVIDEND_HEADERS, 2); // symbol + dividend is enough; year is a bonus

    if (!match) {
      result = {
        status: "no-match",
        message:
          "No table matched expected symbol/dividend headers — this page likely isn't table-based. Inspect the live HTML (it may need a list/article parser using cheerio directly instead of extractTables) and rewrite this fetcher's parsing logic.",
        updated: 0,
      };
    } else {
      const { table, columnIndex } = match;
      const currentYear = new Date().getFullYear();
      const now = new Date().toISOString();

      const upsertFinancial = db.prepare(`
        INSERT INTO financials (company_id, year, price, dividend_per_share, eps, roe, debt_to_equity, revenue_growth)
        VALUES (@company_id, @year, @price, @dividend_per_share, @eps, @roe, @debt_to_equity, @revenue_growth)
        ON CONFLICT(company_id, year) DO UPDATE SET dividend_per_share = excluded.dividend_per_share
      `);
      const getExisting = db.prepare("SELECT * FROM financials WHERE company_id = ? AND year = ?");
      const getLatestForCompany = db.prepare(
        "SELECT * FROM financials WHERE company_id = ? ORDER BY year DESC LIMIT 1"
      );

      let updated = 0;
      for (const row of table.rows) {
        const symbolRaw = row[columnIndex.symbol]?.trim().toUpperCase();
        const dividend = parseNumeric(row[columnIndex.dividend] ?? "");
        const yearRaw = columnIndex.year !== undefined ? row[columnIndex.year] : undefined;
        const year = yearRaw ? Number(yearRaw.match(/\d{4}/)?.[0]) : currentYear;

        if (!symbolRaw || dividend === null || !Number.isFinite(year)) continue;
        const companyId = bySymbol.get(symbolRaw);
        if (!companyId) continue;

        const existing = getExisting.get(companyId, year) as
          | { price: number; eps: number; roe: number; debt_to_equity: number; revenue_growth: number }
          | undefined;
        const fallback = getLatestForCompany.get(companyId) as
          | { price: number; eps: number; roe: number; debt_to_equity: number; revenue_growth: number }
          | undefined;
        const base = existing ?? fallback;
        if (!base) continue; // no financial baseline to attach this dividend to; skip rather than fabricate one

        upsertFinancial.run({
          company_id: companyId,
          year,
          price: base.price,
          dividend_per_share: dividend,
          eps: base.eps,
          roe: base.roe,
          debt_to_equity: base.debt_to_equity,
          revenue_growth: base.revenue_growth,
        });
        updated++;
      }

      result = {
        status: updated > 0 ? "success" : "no-match",
        message:
          updated > 0
            ? `Updated dividend_per_share for ${updated} company-year records.`
            : "Matched a table but no rows produced usable updates — check symbol matching and column parsing.",
        updated,
      };
    }
  } catch (err) {
    result = { status: "error", message: err instanceof Error ? err.message : String(err), updated: 0 };
  }

  logRefresh({
    source: "ngx-dividends",
    status: result.status === "success" ? "success" : "error",
    message: result.message,
    recordsUpdated: result.updated,
    startedAt,
  });

  return result;
}

// Kept for future use if the corporate-actions page turns out to be
// article/list-based rather than a table — not wired in yet.
export function extractSymbolDividendPairsFromText(html: string): { symbol: string; dividend: number }[] {
  const $ = cheerio.load(html);
  const text = $("body").text();
  const pairs: { symbol: string; dividend: number }[] = [];
  const pattern = /\b([A-Z]{3,10})\b[^₦\n]{0,60}₦\s?([\d,.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const dividend = parseNumeric(m[2]);
    if (dividend !== null) pairs.push({ symbol: m[1], dividend });
  }
  return pairs;
}
