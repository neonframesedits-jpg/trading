import { db } from "../db.js";

interface LogInput {
  source: string;
  status: "success" | "error";
  message: string;
  recordsUpdated: number;
  startedAt: string;
}

export function logRefresh(input: LogInput) {
  db.prepare(`
    INSERT INTO data_refresh_log (source, status, message, records_updated, started_at, finished_at)
    VALUES (@source, @status, @message, @recordsUpdated, @startedAt, @finishedAt)
  `).run({ ...input, finishedAt: new Date().toISOString() });
}

export interface RefreshLogEntry {
  id: number;
  source: string;
  status: string;
  message: string | null;
  records_updated: number;
  started_at: string;
  finished_at: string;
}

export function getLatestRefreshBySource(): RefreshLogEntry[] {
  return db
    .prepare(`
      SELECT l.* FROM data_refresh_log l
      INNER JOIN (
        SELECT source, MAX(id) AS max_id FROM data_refresh_log GROUP BY source
      ) latest ON latest.source = l.source AND latest.max_id = l.id
      ORDER BY l.source
    `)
    .all() as RefreshLogEntry[];
}
