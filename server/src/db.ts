import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(path.join(__dirname, "..", "data.sqlite"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL
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

  CREATE TABLE IF NOT EXISTS news_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT NOT NULL REFERENCES companies(id),
    date TEXT NOT NULL,
    headline TEXT NOT NULL,
    tag TEXT NOT NULL,
    source TEXT NOT NULL
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
`);
