import { Router } from "express";
import { refreshAllDataSources } from "./datasources/refreshAll.js";
import { getLatestRefreshBySource } from "./datasources/refreshLog.js";
import { getLatestUsdRate } from "./datasources/cbnRates.js";
import { db } from "./db.js";

export const dataRouter = Router();

// This endpoint is public once deployed, so without a cooldown anyone could
// hammer NGX/CBN through the server and get its IP blocked.
const MANUAL_REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
let lastManualRefreshAt = 0;

dataRouter.post("/refresh", async (_req, res) => {
  const waitMs = lastManualRefreshAt + MANUAL_REFRESH_COOLDOWN_MS - Date.now();
  if (waitMs > 0) {
    return res.status(429).json({
      error: `A refresh ran recently — try again in ${Math.ceil(waitMs / 60000)} minute(s).`,
    });
  }
  lastManualRefreshAt = Date.now();
  const result = await refreshAllDataSources();
  res.json(result);
});

dataRouter.get("/status", (_req, res) => {
  const log = getLatestRefreshBySource();
  const usdRate = getLatestUsdRate();
  const liveCompanyCount = (
    db.prepare("SELECT COUNT(*) AS n FROM companies WHERE price_source != 'seed'").get() as { n: number }
  ).n;
  const totalCompanies = (db.prepare("SELECT COUNT(*) AS n FROM companies").get() as { n: number }).n;

  res.json({
    sources: log,
    usdRate,
    liveCompanyCount,
    totalCompanies,
    usingLiveData: liveCompanyCount > 0,
  });
});
