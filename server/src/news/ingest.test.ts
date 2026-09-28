import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NewsItem } from "./parse.js";

// db.ts opens its database on import, so point it at a throwaway file first.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "neon-ingest-test-"));
process.env.DATABASE_PATH = path.join(tmpDir, "test.sqlite");

const { seedDatabase } = await import("../seed.js");
const { storeArticles } = await import("./ingest.js");
const { getCompanyNews, getLatestNews } = await import("./queries.js");

before(() => {
  seedDatabase();
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const item = (overrides: Partial<NewsItem>): NewsItem => ({
  url: "https://nairametrics.com/2026/09/27/story/",
  title: "Untitled",
  summary: null,
  sourceName: "Nairametrics",
  domain: "nairametrics.com",
  language: "en-US",
  sourceCountry: null,
  publishedAt: "2026-09-27T09:00:00.000Z",
  ...overrides,
});

test("stores articles, dedupes URL variants, and links mentioned companies", () => {
  const result = storeArticles(
    [
      item({ title: "Zenith Bank and MTN Nigeria sign fintech deal" }),
      item({ url: "https://www.nairametrics.com/2026/09/27/story?utm_source=rss", title: "Zenith Bank and MTN Nigeria sign fintech deal" }),
    ],
    { origin: "rss" }
  );
  assert.deepEqual(result, { inserted: 1, linked: 2 });

  const [article] = getCompanyNews("zenithbank");
  assert.equal(article.title, "Zenith Bank and MTN Nigeria sign fintech deal");
  assert.equal(article.tier, 2);
  assert.deepEqual(article.companies.map((c) => c.symbol).sort(), ["MTNN", "ZENITHBANK"]);
});

test("storing the same articles again is a no-op", () => {
  const again = storeArticles([item({ title: "Zenith Bank and MTN Nigeria sign fintech deal" })], { origin: "rss" });
  assert.deepEqual(again, { inserted: 0, linked: 0 });
});

test("a GDELT company search links foreign-language articles the text matcher can't read", () => {
  const french = item({
    url: "https://lemonde-afrique.example/cimentier-nigerian",
    title: "Le premier cimentier nigérian annonce une usine au Sénégal",
    domain: "lemonde-afrique.example",
    sourceName: "lemonde-afrique.example",
    language: "French",
    publishedAt: "2026-09-28T07:00:00.000Z",
  });

  const unlinked = storeArticles([french], { origin: "gdelt" });
  assert.deepEqual(unlinked, { inserted: 1, linked: 0 });

  const linked = storeArticles([french], { origin: "gdelt", searchedCompanyId: "dangcem", searchedAlias: "Dangote Cement" });
  assert.deepEqual(linked, { inserted: 0, linked: 1 });

  const [article] = getCompanyNews("dangcem");
  assert.equal(article.language, "French");
  assert.equal(article.tier, 3);
  assert.match(article.companies[0].match_reason, /GDELT full-text match/);
});

test("latest news is newest first and filterable by theme", () => {
  storeArticles(
    [item({ url: "https://reuters.com/deal", title: "Nigeria signs $2bn port deal", domain: "reuters.com", publishedAt: "2026-09-28T12:00:00.000Z" })],
    { origin: "gdelt", theme: "Investment deals" }
  );

  const latest = getLatestNews();
  assert.equal(latest[0].title, "Nigeria signs $2bn port deal");
  assert.equal(latest[0].companies.length, 0);

  assert.deepEqual(getLatestNews({ theme: "Investment deals" }).map((a) => a.title), ["Nigeria signs $2bn port deal"]);
  assert.ok(getLatestNews({ linkedOnly: true }).every((a) => a.companies.length > 0));
});
