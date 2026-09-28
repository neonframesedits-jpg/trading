import { test } from "node:test";
import assert from "node:assert/strict";
import { findMatchingTable, type ParsedTable } from "./parseTable.js";
import { CBN_RATE_HEADERS, NGX_DIVIDEND_HEADERS, NGX_PRICE_HEADERS } from "./headerPatterns.js";

const table = (headers: string[]): ParsedTable[] => [{ headers, rows: [headers.map(() => "x")] }];
const column = (headers: string[], patterns: Parameters<typeof findMatchingTable>[1], key: string, min?: number) =>
  headers[findMatchingTable(table(headers), patterns, min)?.columnIndex[key] ?? -1];

test("NGX price column skips previous/opening/high/low prices", () => {
  const layouts: [string[], string][] = [
    [["Symbol", "Prev. Close", "Opening Price", "High", "Low", "Close", "Change"], "Close"],
    [["Symbol", "Previous Closing Price", "Closing Price", "% Change"], "Closing Price"],
    [["Ticker", "Open Price", "Current Price"], "Current Price"],
    [["Symbol", "Prev Price", "Price"], "Price"],
  ];
  for (const [headers, expected] of layouts) {
    assert.equal(column(headers, NGX_PRICE_HEADERS, "price"), expected, headers.join(" | "));
  }
});

test("CBN rate column prefers the official central rate", () => {
  assert.equal(
    column(["Rate Date", "Currency", "Buying Rate", "Central Rate", "Selling Rate"], CBN_RATE_HEADERS, "rate"),
    "Central Rate"
  );
  assert.equal(column(["Rate Date", "Currency", "Buying Rate"], CBN_RATE_HEADERS, "rate"), "Buying Rate");
});

test("NGX dividend column skips dividend type and date columns", () => {
  assert.equal(
    column(["Company", "Dividend Type", "Dividend Date", "Amount", "Year End"], NGX_DIVIDEND_HEADERS, "dividend"),
    "Amount"
  );
  assert.equal(
    column(["Company", "Dividend Type", "Proposed Dividend", "Closure Date"], NGX_DIVIDEND_HEADERS, "dividend", 2),
    "Proposed Dividend"
  );
});
