import { test } from "node:test";
import assert from "node:assert/strict";
import { extractTables, findMatchingTable, parseNumeric } from "./parseTable.js";

const page = `
  <html><body>
    <table class="nav"><tr><td>Home</td><td>About</td></tr><tr><td>Markets</td><td>Contact</td></tr></table>
    <table id="prices">
      <thead><tr><th>S/N</th><th>Symbol</th><th>Prev. Close</th><th>Close Price</th><th>Change</th></tr></thead>
      <tbody>
        <tr><td>1</td><td> ZENITHBANK </td><td>57.50</td><td>58.00</td><td>0.50</td></tr>
        <tr><td>2</td><td>MTNN</td><td>218.00</td><td>220.00</td><td>2.00</td></tr>
      </tbody>
    </table>
    <table><tr><th>Currency</th><th>Buying</th></tr><tr><td>US DOLLAR</td><td>1,520.35</td></tr></table>
  </body></html>`;

test("extractTables reads tables with and without <thead>", () => {
  const tables = extractTables(page);
  assert.equal(tables.length, 3);
  assert.deepEqual(tables[1].headers, ["S/N", "Symbol", "Prev. Close", "Close Price", "Change"]);
  assert.deepEqual(tables[1].rows[0], ["1", "ZENITHBANK", "57.50", "58.00", "0.50"]);
  assert.deepEqual(tables[2].headers, ["Currency", "Buying"]);
  assert.deepEqual(tables[2].rows, [["US DOLLAR", "1,520.35"]]);
});

test("findMatchingTable picks the table whose headers match, not the first one", () => {
  const match = findMatchingTable(extractTables(page), { symbol: /symbol|ticker/i, price: /close|price/i });
  assert.ok(match);
  assert.equal(match.table.rows.length, 2);
  assert.equal(match.columnIndex.symbol, 1);
  // First header matching /close|price/ — worth knowing, since "Prev. Close"
  // comes before "Close Price" on this layout.
  assert.equal(match.columnIndex.price, 2);
});

test("findMatchingTable returns null when nothing matches enough headers", () => {
  assert.equal(findMatchingTable(extractTables(page), { symbol: /symbol/i, volume: /volume/i }), null);
});

test("parseNumeric handles common financial formats", () => {
  assert.equal(parseNumeric("1,234.50"), 1234.5);
  assert.equal(parseNumeric("₦58.00"), 58);
  assert.equal(parseNumeric(" 12.5% "), 12.5);
  assert.equal(parseNumeric("(2.5)"), -2.5);
});

test("parseNumeric returns null for blanks and placeholders, never 0", () => {
  for (const raw of ["", "   ", "-", "N/A", "--"]) {
    assert.equal(parseNumeric(raw), null, JSON.stringify(raw));
  }
});
