import { db } from "../db.js";
import { fetchText } from "../datasources/fetchHtml.js";
import { logRefresh } from "../datasources/refreshLog.js";
import { aliasesFor, searchableAliases } from "./companyAliases.js";
import { buildMatchers, matchCompanies } from "./match.js";
import { parseFeed, parseGdeltResponse, urlKey, type NewsItem } from "./parse.js";
import { classifyTier, RSS_FEEDS, SCOUTING_THEMES } from "./sources.js";

export interface StoreResult {
  inserted: number;
  linked: number;
}

interface StoreOptions {
  origin: "gdelt" | "rss";
  theme?: string;
  // GDELT searches full article text (including non-English articles), so
  // when an article came back from a company-specific search, it's linked to
  // that company even if our title/summary matching can't see the mention.
  searchedCompanyId?: string;
  searchedAlias?: string;
}

function loadMatchers() {
  const companies = db.prepare("SELECT id, symbol, name FROM companies").all() as {
    id: string;
    symbol: string;
    name: string;
  }[];
  return buildMatchers(companies.map((c) => ({ id: c.id, aliases: aliasesFor(c.symbol, c.name) })));
}

export function storeArticles(items: NewsItem[], options: StoreOptions): StoreResult {
  const matchers = loadMatchers();
  const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO news_articles
      (url, url_key, title, summary, source_name, domain, tier, language, source_country, published_at, fetched_at, origin, theme)
    VALUES
      (@url, @url_key, @title, @summary, @source_name, @domain, @tier, @language, @source_country, @published_at, @fetched_at, @origin, @theme)
  `);
  const findByKey = db.prepare("SELECT id FROM news_articles WHERE url_key = ?");
  const linkCompany = db.prepare(
    "INSERT OR IGNORE INTO article_companies (article_id, company_id, match_reason) VALUES (?, ?, ?)"
  );

  let inserted = 0;
  let linked = 0;
  const now = new Date().toISOString();

  db.transaction(() => {
    for (const item of items) {
      const key = urlKey(item.url);
      if (!key) continue;

      const info = insertArticle.run({
        url: item.url,
        url_key: key,
        title: item.title,
        summary: item.summary,
        source_name: item.sourceName,
        domain: item.domain,
        tier: classifyTier(item.domain),
        language: item.language,
        source_country: item.sourceCountry,
        published_at: item.publishedAt,
        fetched_at: now,
        origin: options.origin,
        theme: options.theme ?? null,
      });
      if (info.changes > 0) inserted++;

      // Link on every sighting, not just first insert: the same article can
      // arrive once from an RSS feed and again from a GDELT company search.
      const articleId = (findByKey.get(key) as { id: number }).id;
      for (const m of matchCompanies(`${item.title} ${item.summary ?? ""}`, matchers)) {
        linked += linkCompany.run(articleId, m.companyId, `Mentions "${m.alias}"`).changes;
      }
      if (options.searchedCompanyId) {
        linked += linkCompany.run(
          articleId,
          options.searchedCompanyId,
          `GDELT full-text match for "${options.searchedAlias}"`
        ).changes;
      }
    }
  })();

  return { inserted, linked };
}

export async function refreshRssNews() {
  const startedAt = new Date().toISOString();
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const xml = await fetchText(feed.url, "application/rss+xml,application/atom+xml,application/xml,text/xml");
      const items = parseFeed(xml, feed.name);
      if (items.length === 0) throw new Error(`${feed.name}: fetched, but no articles could be parsed from it`);
      return { feed: feed.name, ...storeArticles(items, { origin: "rss" }) };
    })
  );

  const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const failures = results
    .map((r, i) => (r.status === "rejected" ? `${RSS_FEEDS[i].name}: ${r.reason instanceof Error ? r.reason.message : r.reason}` : null))
    .filter((f): f is string => f !== null);
  const inserted = ok.reduce((n, r) => n + r.inserted, 0);
  const linked = ok.reduce((n, r) => n + r.linked, 0);

  const message =
    `${ok.length} of ${RSS_FEEDS.length} feeds read; ${inserted} new articles, ${linked} new company links.` +
    (failures.length ? ` Failed: ${failures.join(" | ")}` : "");
  const status = ok.length > 0 ? "success" : "error";
  logRefresh({ source: "rss-news", status, message, recordsUpdated: inserted, startedAt });
  return { status, message, inserted, linked };
}

const GDELT_API = "https://api.gdeltproject.org/api/v2/doc/doc";
// GDELT asks API users to keep to roughly one request every five seconds.
const GDELT_REQUEST_SPACING_MS = 5500;

function gdeltUrl(query: string): string {
  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    format: "json",
    maxrecords: "50",
    timespan: "1d",
    sort: "DateDesc",
  });
  return `${GDELT_API}?${params}`;
}

let gdeltRun: Promise<unknown> | null = null;

// One search per tracked company plus the broader scouting themes. Takes a
// couple of minutes because of GDELT's rate limit, so callers that don't want
// to wait should fire and forget; overlapping calls share the same run.
export function refreshGdeltNews() {
  gdeltRun ??= runGdeltRefresh().finally(() => {
    gdeltRun = null;
  });
  return gdeltRun;
}

async function runGdeltRefresh() {
  const startedAt = new Date().toISOString();
  const companies = db.prepare("SELECT id, symbol, name FROM companies").all() as {
    id: string;
    symbol: string;
    name: string;
  }[];

  const searches = [
    ...companies.map((c) => {
      const aliases = searchableAliases(c.symbol, c.name);
      return {
        label: c.symbol,
        query: aliases.length === 1 ? `"${aliases[0]}"` : `(${aliases.map((a) => `"${a}"`).join(" OR ")})`,
        options: { origin: "gdelt" as const, searchedCompanyId: c.id, searchedAlias: aliases.join(" / ") },
      };
    }),
    ...SCOUTING_THEMES.map((t) => ({
      label: t.label,
      query: t.query,
      options: { origin: "gdelt" as const, theme: t.label },
    })),
  ];

  let inserted = 0;
  let linked = 0;
  const failures: string[] = [];
  for (const [i, search] of searches.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, GDELT_REQUEST_SPACING_MS));
    try {
      const body = await fetchText(gdeltUrl(search.query), "application/json", 30000);
      const result = storeArticles(parseGdeltResponse(body), search.options);
      inserted += result.inserted;
      linked += result.linked;
    } catch (err) {
      failures.push(`${search.label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const succeeded = searches.length - failures.length;
  const message =
    `${succeeded} of ${searches.length} searches succeeded; ${inserted} new articles, ${linked} new company links.` +
    (failures.length ? ` Failed: ${failures.slice(0, 5).join(" | ")}${failures.length > 5 ? ` (+${failures.length - 5} more)` : ""}` : "");
  const status = succeeded > 0 ? "success" : "error";
  logRefresh({ source: "gdelt-news", status, message, recordsUpdated: inserted, startedAt });
  return { status, message, inserted, linked };
}
