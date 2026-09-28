import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production, DATABASE_PATH should point at persistent storage (e.g. a
// Railway Volume mounted at /data) — a container's own disk is wiped on
// every redeploy. Locally it defaults to server/data.sqlite.
const databasePath = process.env.DATABASE_PATH ?? path.join(__dirname, "..", "data.sqlite");
export const dataDir = path.dirname(databasePath);
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    price_source TEXT NOT NULL DEFAULT 'seed',
    price_updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS financials (
    company_id TEXT NOT NULL REFERENCES companies(id),
    year INTEGER NOT NULL,
    price REAL NOT NULL,
    dividend_per_share REAL NOT NULL,
    eps REAL NOT NULL,
    roe REAL NOT NULL,
    debt_to_equity REAL NOT NULL,
    revenue_growth REAL NOT NULL,
    PRIMARY KEY (company_id, year)
  );

  CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    url_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT,
    source_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    tier INTEGER NOT NULL,
    language TEXT,
    source_country TEXT,
    published_at TEXT,
    fetched_at TEXT NOT NULL,
    origin TEXT NOT NULL,
    theme TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at);

  CREATE TABLE IF NOT EXISTS article_companies (
    article_id INTEGER NOT NULL REFERENCES news_articles(id),
    company_id TEXT NOT NULL REFERENCES companies(id),
    match_reason TEXT NOT NULL,
    PRIMARY KEY (article_id, company_id)
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    last_prompted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES devices(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    target_amount REAL NOT NULL,
    target_date TEXT,
    committed_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goal_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id TEXT NOT NULL REFERENCES goals(id),
    amount REAL NOT NULL,
    company_symbol TEXT,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fx_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair TEXT NOT NULL,
    rate REAL NOT NULL,
    source TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS data_refresh_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    records_updated INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL
  );
`);

// Best-effort migration for databases created before price_source/price_updated_at existed.
const companyColumns = db.prepare("PRAGMA table_info(companies)").all() as { name: string }[];
const columnNames = new Set(companyColumns.map((c) => c.name));
if (!columnNames.has("price_source")) {
  db.exec("ALTER TABLE companies ADD COLUMN price_source TEXT NOT NULL DEFAULT 'seed'");
}
if (!columnNames.has("price_updated_at")) {
  db.exec("ALTER TABLE companies ADD COLUMN price_updated_at TEXT");
}
