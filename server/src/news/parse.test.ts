import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanText, parseFeed, parseGdeltDate, parseGdeltResponse, urlKey } from "./parse.js";

test("parseGdeltResponse maps articles and skips incomplete ones", () => {
  const body = JSON.stringify({
    articles: [
      {
        url: "https://www.reuters.com/world/africa/dangote-cement-2026-09-27/",
        url_mobile: "",
        title: "Dangote Cement  expands  exports",
        seendate: "20260927T141500Z",
        socialimage: "",
        domain: "www.reuters.com",
        language: "English",
        sourcecountry: "United Kingdom",
      },
      { url: "https://example.com/no-title", seendate: "20260927T141500Z", domain: "example.com" },
    ],
  });

  const items = parseGdeltResponse(body);
  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    url: "https://www.reuters.com/world/africa/dangote-cement-2026-09-27/",
    title: "Dangote Cement expands exports",
    summary: null,
    sourceName: "reuters.com",
    domain: "reuters.com",
    language: "English",
    sourceCountry: "United Kingdom",
    publishedAt: "2026-09-27T14:15:00.000Z",
  });
});

test("parseGdeltResponse treats an empty object as no results", () => {
  assert.deepEqual(parseGdeltResponse("{}"), []);
  assert.deepEqual(parseGdeltResponse('{"articles": []}\n'), []);
});

test("parseGdeltResponse surfaces GDELT's plain-text errors", () => {
  assert.throws(
    () => parseGdeltResponse("Your search contained a keyword that was too short."),
    /non-JSON response: Your search contained a keyword/
  );
});

test("parseGdeltDate rejects anything that isn't GDELT's format", () => {
  assert.equal(parseGdeltDate("20260101T000000Z"), "2026-01-01T00:00:00.000Z");
  assert.equal(parseGdeltDate("2026-01-01"), null);
  assert.equal(parseGdeltDate(undefined), null);
});

test("parseFeed reads RSS 2.0 with CDATA, HTML descriptions and guid fallback", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Nairametrics</title>
        <language>en-US</language>
        <item>
          <title><![CDATA[Zenith Bank declares ₦4 interim dividend]]></title>
          <link>https://nairametrics.com/2026/09/27/zenith-bank-dividend/?utm_source=rss</link>
          <description><![CDATA[<p>The lender said <strong>shareholders</strong> will be paid</p><p>next month.</p>]]></description>
          <pubDate>Sun, 27 Sep 2026 09:30:00 +0100</pubDate>
        </item>
        <item>
          <title>Link-less item with a URL guid</title>
          <guid isPermaLink="true">https://nairametrics.com/2026/09/26/guid-only/</guid>
        </item>
        <item>
          <title>Item without any usable URL</title>
          <guid isPermaLink="false">post-12345</guid>
        </item>
      </channel>
    </rss>`;

  const items = parseFeed(xml, "Nairametrics");
  assert.equal(items.length, 2);

  assert.equal(items[0].title, "Zenith Bank declares ₦4 interim dividend");
  assert.equal(items[0].summary, "The lender said shareholders will be paid next month.");
  assert.equal(items[0].sourceName, "Nairametrics");
  assert.equal(items[0].domain, "nairametrics.com");
  assert.equal(items[0].language, "en-US");
  assert.equal(items[0].publishedAt, "2026-09-27T08:30:00.000Z");

  assert.equal(items[1].url, "https://nairametrics.com/2026/09/26/guid-only/");
  assert.equal(items[1].summary, null);
  assert.equal(items[1].publishedAt, null);
});

test("parseFeed reads Atom feeds, preferring the alternate link", () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">
      <title>Example</title>
      <entry>
        <title>Le cimentier nigérian annonce une expansion</title>
        <link rel="self" href="https://example.fr/api/entry/1"/>
        <link rel="alternate" href="https://example.fr/article/1"/>
        <published>2026-09-25T10:00:00Z</published>
        <summary>Résumé de l'article.</summary>
      </entry>
    </feed>`;

  const [item] = parseFeed(xml, "Example FR");
  assert.equal(item.url, "https://example.fr/article/1");
  assert.equal(item.language, "fr");
  assert.equal(item.publishedAt, "2026-09-25T10:00:00.000Z");
  assert.equal(item.summary, "Résumé de l'article.");
});

test("parseFeed returns nothing for a non-feed document", () => {
  assert.deepEqual(parseFeed("<html><body><p>Access denied</p></body></html>", "X"), []);
});

test("urlKey collapses spelling variants of the same article", () => {
  const canonical = urlKey("https://nairametrics.com/2026/09/27/zenith/");
  assert.equal(canonical, "nairametrics.com/2026/09/27/zenith");
  for (const variant of [
    "http://www.nairametrics.com/2026/09/27/zenith",
    "https://nairametrics.com/2026/09/27/zenith/?utm_source=rss&utm_medium=feed",
    "https://NAIRAMETRICS.com/2026/09/27/zenith/#comments",
    "https://nairametrics.com/2026/09/27/zenith?fbclid=abc123",
  ]) {
    assert.equal(urlKey(variant), canonical, variant);
  }
});

test("urlKey keeps meaningful query params, order-independent", () => {
  assert.equal(urlKey("https://x.com/a?id=2&page=1"), urlKey("https://x.com/a?page=1&id=2&utm_campaign=z"));
  assert.notEqual(urlKey("https://x.com/a?id=2"), urlKey("https://x.com/a?id=3"));
  assert.equal(urlKey("not a url"), null);
});

test("cleanText strips markup, collapses whitespace and truncates", () => {
  assert.equal(cleanText("<b>Hello</b>\n\n   world"), "Hello world");
  assert.equal(cleanText("a".repeat(20), 10), "aaaaaaaaa…");
});
