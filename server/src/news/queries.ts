import { db } from "../db.js";

export interface ArticleRow {
  id: number;
  url: string;
  title: string;
  summary: string | null;
  source_name: string;
  domain: string;
  tier: number;
  language: string | null;
  source_country: string | null;
  published_at: string | null;
  fetched_at: string;
  origin: string;
  theme: string | null;
}

export interface ArticleWithCompanies extends ArticleRow {
  companies: { id: string; symbol: string; name: string; match_reason: string }[];
}

function attachCompanies(articles: ArticleRow[]): ArticleWithCompanies[] {
  if (articles.length === 0) return [];
  const links = db
    .prepare(
      `SELECT ac.article_id, c.id, c.symbol, c.name, ac.match_reason
       FROM article_companies ac JOIN companies c ON c.id = ac.company_id
       WHERE ac.article_id IN (${articles.map(() => "?").join(",")})`
    )
    .all(...articles.map((a) => a.id)) as { article_id: number; id: string; symbol: string; name: string; match_reason: string }[];

  return articles.map((a) => ({
    ...a,
    companies: links.filter((l) => l.article_id === a.id).map(({ article_id: _, ...rest }) => rest),
  }));
}

const ORDER = "ORDER BY COALESCE(a.published_at, a.fetched_at) DESC";

export function getCompanyNews(companyId: string, limit = 20): ArticleWithCompanies[] {
  const rows = db
    .prepare(
      `SELECT a.* FROM news_articles a
       JOIN article_companies ac ON ac.article_id = a.id
       WHERE ac.company_id = ? ${ORDER} LIMIT ?`
    )
    .all(companyId, limit) as ArticleRow[];
  return attachCompanies(rows);
}

export function getLatestNews(options: { theme?: string; linkedOnly?: boolean; limit?: number } = {}): ArticleWithCompanies[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (options.theme) {
    where.push("a.theme = ?");
    params.push(options.theme);
  }
  if (options.linkedOnly) {
    where.push("EXISTS (SELECT 1 FROM article_companies ac WHERE ac.article_id = a.id)");
  }
  const rows = db
    .prepare(
      `SELECT a.* FROM news_articles a ${where.length ? "WHERE " + where.join(" AND ") : ""} ${ORDER} LIMIT ?`
    )
    .all(...params, options.limit ?? 50) as ArticleRow[];
  return attachCompanies(rows);
}
