import * as cheerio from "cheerio";

// Generic, structure-tolerant HTML table extraction. Rather than hardcoding
// CSS selectors for a specific page (which we can't verify from this
// session — see README), this looks for *any* table whose header row
// contains cells matching a set of expected keywords, and extracts it by
// column name instead of position. More resilient to markup changes, but
// still needs a real run against the live page to confirm it actually
// finds the right table.

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export function extractTables(html: string): ParsedTable[] {
  const $ = cheerio.load(html);
  const tables: ParsedTable[] = [];

  $("table").each((_, tableEl) => {
    const $table = $(tableEl);
    let headers: string[] = [];
    const headerRow = $table.find("thead tr").first();
    if (headerRow.length) {
      headers = headerRow
        .find("th,td")
        .map((_, el) => $(el).text().trim())
        .get();
    } else {
      const firstRow = $table.find("tr").first();
      headers = firstRow
        .find("th,td")
        .map((_, el) => $(el).text().trim())
        .get();
    }

    const bodyRows = headerRow.length ? $table.find("tbody tr") : $table.find("tr").slice(1);
    const rows: string[][] = [];
    bodyRows.each((_, rowEl) => {
      const cells = $(rowEl)
        .find("td,th")
        .map((_, el) => $(el).text().trim())
        .get();
      if (cells.length > 0) rows.push(cells);
    });

    if (headers.length > 0 && rows.length > 0) {
      tables.push({ headers, rows });
    }
  });

  return tables;
}

/**
 * Finds the table whose headers best match a set of keyword patterns
 * (e.g. { symbol: /symbol|ticker/i, price: /price|close/i }). A column can
 * list several patterns in priority order — e.g. prefer "Central Rate" over
 * any other rate column — and the first pattern that matches any header
 * wins. Returns the matched table plus a column-name -> header-index map, or
 * null if no table matches enough keywords.
 */
export function findMatchingTable(
  tables: ParsedTable[],
  keywordPatterns: Record<string, RegExp | RegExp[]>,
  minMatches = Object.keys(keywordPatterns).length
): { table: ParsedTable; columnIndex: Record<string, number> } | null {
  let best: { table: ParsedTable; columnIndex: Record<string, number>; score: number } | null = null;

  for (const table of tables) {
    const columnIndex: Record<string, number> = {};
    for (const [key, patterns] of Object.entries(keywordPatterns)) {
      for (const pattern of Array.isArray(patterns) ? patterns : [patterns]) {
        const idx = table.headers.findIndex((h) => pattern.test(h));
        if (idx !== -1) {
          columnIndex[key] = idx;
          break;
        }
      }
    }
    const score = Object.keys(columnIndex).length;
    if (score >= minMatches && (!best || score > best.score)) {
      best = { table, columnIndex, score };
    }
  }

  return best ? { table: best.table, columnIndex: best.columnIndex } : null;
}

export function parseNumeric(raw: string): number | null {
  const cleaned = raw.replace(/[,₦%\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  // Number("") is 0, which would turn an empty table cell into a real-looking
  // value (e.g. overwriting a company's dividend with ₦0).
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
