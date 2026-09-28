import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyTier } from "./sources.js";

test("official Nigerian sources are tier 1", () => {
  assert.equal(classifyTier("https://www.sec.gov.ng/notices/123"), 1);
  assert.equal(classifyTier("cbn.gov.ng"), 1);
  assert.equal(classifyTier("https://ngxgroup.com/exchange/"), 1);
});

test("established outlets are tier 2, including their subdomains", () => {
  assert.equal(classifyTier("https://nairametrics.com/2026/09/27/x/"), 2);
  assert.equal(classifyTier("www.reuters.com"), 2);
  assert.equal(classifyTier("https://markets.ft.com/data"), 2);
});

test("everything else is tier 3, without suffix confusion", () => {
  assert.equal(classifyTier("randomblog.com"), 3);
  assert.equal(classifyTier("https://notft.com/story"), 3);
  assert.equal(classifyTier("https://fake-reuters.com.example.net/"), 3);
  assert.equal(classifyTier(""), 3);
});
