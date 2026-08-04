import { Router } from "express";
import { refreshAllDataSources } from "./datasources/refreshAll.js";
import { getLatestRefreshBySource } from "./datasources/refreshLog.js";
import { getLatestUsdRate } from "./datasources/cbnRates.js";
import { db } from "./db.js";

export const dataRouter = Router();

dataRouter.post("/refresh", async (_req, res) => {
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
