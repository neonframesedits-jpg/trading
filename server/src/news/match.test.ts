import { test } from "node:test";
import assert from "node:assert/strict";
import { aliasesFor, searchableAliases } from "./companyAliases.js";
import { buildMatchers, matchCompanies } from "./match.js";

// The real alias table, so these tests catch precision regressions in it.
const companies = [
  ["gtco", "GTCO", "Guaranty Trust Holding Co"],
  ["zenithbank", "ZENITHBANK", "Zenith Bank Plc"],
  ["fbnh", "FBNH", "FBN Holdings Plc"],
  ["mtnn", "MTNN", "MTN Nigeria Communications Plc"],
  ["dangcem", "DANGCEM", "Dangote Cement Plc"],
  ["nestle", "NESTLE", "Nestle Nigeria Plc"],
  ["okomuoil", "OKOMUOIL", "Okomu Oil Palm Plc"],
  ["newco", "NEWCO", "Brand New Listing Plc"],
].map(([id, symbol, name]) => ({ id, aliases: aliasesFor(symbol, name) }));

const matchers = buildMatchers(companies);
const ids = (text: string) => matchCompanies(text, matchers).map((m) => m.companyId).sort();

test("matches companies by the names the press uses", () => {
  assert.deepEqual(ids("Dangote Cement posts record half-year profit"), ["dangcem"]);
  assert.deepEqual(ids("GTBank customers report app outage"), ["gtco"]);
  assert.deepEqual(ids("zenith bank raises interim dividend"), ["zenithbank"]);
  assert.deepEqual(ids("FirstBank names new MD"), ["fbnh"]);
});

test("finds every company in a multi-company headline", () => {
  assert.deepEqual(ids("Zenith Bank and MTN Nigeria sign fintech partnership"), ["mtnn", "zenithbank"]);
});

test("ignores accents and line breaks", () => {
  assert.deepEqual(ids("Nestlé Nigeria returns to profit"), ["nestle"]);
  assert.deepEqual(ids("Shares of Zenith\nBank rose"), ["zenithbank"]);
});

test("avoids known false positives", () => {
  // Different companies that share part of a name.
  assert.deepEqual(ids("MTN Group reports South African revenue decline"), []);
  assert.deepEqual(ids("Dangote Refinery begins petrol exports"), []);
  assert.deepEqual(ids("First Bank of Long Island reports earnings"), []);
  assert.deepEqual(ids("Tourists flock to Okomu National Park"), []);
  // Tickers inside longer words.
  assert.deepEqual(ids("GTCOM unveils new product line"), []);
});

test("falls back to the full company name when no aliases are listed", () => {
  assert.deepEqual(ids("Brand New Listing Plc debuts on NGX"), ["newco"]);
});

test("GDELT searches skip ticker-style aliases", () => {
  assert.deepEqual(searchableAliases("DANGCEM", "Dangote Cement Plc"), ["Dangote Cement"]);
  assert.deepEqual(searchableAliases("GTCO", "Guaranty Trust Holding Co"), ["Guaranty Trust", "GTBank"]);
});
