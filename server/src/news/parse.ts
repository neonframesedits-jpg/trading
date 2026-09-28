import * as cheerio from "cheerio";
import { hostOf } from "./sources.js";

// Pure parsing functions (no network, no database), so they can be tested
// against sample payloads even where the real sources can't be reached.

export interface NewsItem {
  url: string;
  title: string;
  summary: string | null;
  sourceName: string;
  domain: string;
  language: string | null;
  sourceCountry: string | null;
  publishedAt: string | null;
}

const TRACKING_PARAMS = /^(utm_.*|fbclid|gclid|mc_cid|mc_eid|ref|cmpid)$/i;

// Same article, different URL spellings (tracking params, www, trailing
// slash, http vs https) should dedupe to one key.
export function urlKey(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const params = [...parsed.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.test(k))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? "?" + new URLSearchParams(params).toString() : "";
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return hostOf(url) + pathname + query;
}

const BLOCK_TAG = /<\/?(p|div|br|li|ul|ol|h[1-6]|tr|td|th|blockquote|section|article)\b[^>]*>/gi;

export function cleanText(htmlOrText: string, maxLength = 500): string {
  // Block-level tags separate words ("paid</p><p>next" → "paid next");
  // inline ones like <strong> must not, so only block tags get a space.
  const spaced = htmlOrText.replace(BLOCK_TAG, " $&");
  const text = cheerio.load(`<div>${spaced}</div>`)("div").text().replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength - 1).trimEnd() + "…" : text;
}

function toIso(date: Date): string | null {
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// GDELT's "seendate" format: 20260928T101500Z
export function parseGdeltDate(raw: string | undefined): string | null {
  const m = raw?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return null;
  return toIso(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])));
}

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

/**
 * Parses a GDELT DOC 2.0 API response (mode=ArtList, format=json). GDELT
 * returns `{}` when nothing matched, and plain-text error messages (not
 * JSON) for rejected queries, which are surfaced as errors.
 */
export function parseGdeltResponse(body: string): NewsItem[] {
  const trimmed = body.trim();
  if (!trimmed.startsWith("{")) {
    throw new Error(`GDELT returned a non-JSON response: ${trimmed.slice(0, 200)}`);
  }
  const data = JSON.parse(trimmed) as { articles?: GdeltArticle[] };
  const items: NewsItem[] = [];
  for (const a of data.articles ?? []) {
    if (!a.url || !a.title) continue;
    const domain = (a.domain ?? hostOf(a.url)).toLowerCase().replace(/^www\./, "");
    items.push({
      url: a.url,
      title: cleanText(a.title, 300),
      summary: null,
      sourceName: domain,
      domain,
      language: a.language || null,
      sourceCountry: a.sourcecountry || null,
      publishedAt: parseGdeltDate(a.seendate),
    });
  }
  return items;
}

/** Parses an RSS 2.0 or Atom feed. */
export function parseFeed(xml: string, feedName: string): NewsItem[] {
  const $ = cheerio.load(xml, { xml: true });
  const items: NewsItem[] = [];

  const rssItems = $("rss channel > item, rdf\\:RDF > item");
  if (rssItems.length > 0) {
    const language = $("rss channel > language").first().text().trim() || null;
    rssItems.each((_, el) => {
      const $el = $(el);
      const url = $el.children("link").first().text().trim() || $el.children("guid").first().text().trim();
      const title = cleanText($el.children("title").first().text(), 300);
      if (!url || !title || !/^https?:\/\//.test(url)) return;
      const description = $el.children("description").first().text();
      items.push({
        url,
        title,
        summary: description ? cleanText(description) || null : null,
        sourceName: feedName,
        domain: hostOf(url),
        language,
        sourceCountry: null,
        publishedAt: toIso(new Date($el.children("pubDate").first().text().trim())),
      });
    });
    return items;
  }

  const language = $("feed").first().attr("xml:lang") ?? null;
  $("feed > entry").each((_, el) => {
    const $el = $(el);
    const links = $el.children("link");
    const alternate = links.filter((_, l) => ($(l).attr("rel") ?? "alternate") === "alternate").first();
    const url = (alternate.attr("href") ?? links.first().attr("href") ?? "").trim();
    const title = cleanText($el.children("title").first().text(), 300);
    if (!url || !title || !/^https?:\/\//.test(url)) return;
    const summary = $el.children("summary").first().text() || $el.children("content").first().text();
    const dateRaw = $el.children("published").first().text() || $el.children("updated").first().text();
    items.push({
      url,
      title,
      summary: summary ? cleanText(summary) || null : null,
      sourceName: feedName,
      domain: hostOf(url),
      language,
      sourceCountry: null,
      publishedAt: dateRaw ? toIso(new Date(dateRaw.trim())) : null,
    });
  });
  return items;
}
