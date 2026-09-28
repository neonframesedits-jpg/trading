import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import { scoreAllCompanies } from "./scoring.js";
import { computeProjection } from "./calculator.js";
import { goalsRouter } from "./goals.js";
import { pushRouter } from "./pushRoutes.js";
import { dataRouter } from "./dataRoutes.js";
import { startScheduler } from "./scheduler.js";
import { startDataRefreshScheduler } from "./datasources/scheduler.js";
import { getCompanyNews, getLatestNews } from "./news/queries.js";
import { SCOUTING_THEMES } from "./news/sources.js";
import type { Company, FinancialYear } from "./types.js";

if (seedIfEmpty()) console.log("Empty database — loaded reference seed data.");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/goals", goalsRouter);
app.use("/api/push", pushRouter);
app.use("/api/data", dataRouter);

function fundamentalsDisclaimer() {
  return "Financial fundamentals (EPS, ROE, debt/equity, revenue growth) are still reference/illustrative data pending deeper integration — verify against NGX filings and audited reports before investing. This is informational, not investment advice.";
}

app.get("/api/companies", (_req, res) => {
  const companies = scoreAllCompanies();
  const liveCount = companies.filter((c) => c.price_source !== "seed").length;
  const disclaimer =
    liveCount > 0
      ? `Prices for ${liveCount} of ${companies.length} companies were pulled from a live source (see each company for its source and timestamp). ${fundamentalsDisclaimer()}`
      : `Scores and financials are reference/illustrative data for this demo, not a live market feed. Verify against NGX filings before investing. This is informational, not investment advice.`;

  res.json({ generatedAt: new Date().toISOString(), disclaimer, companies });
});

app.get("/api/companies/:id", (req, res) => {
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id) as Company | undefined;
  if (!company) return res.status(404).json({ error: "Company not found" });

  const history = db
    .prepare("SELECT * FROM financials WHERE company_id = ? ORDER BY year")
    .all(req.params.id) as FinancialYear[];

  const scored = scoreAllCompanies().find((c) => c.id === req.params.id);

  const disclaimer =
    company.price_source !== "seed"
      ? `Price sourced from ${company.price_source}, last refreshed ${company.price_updated_at}. ${fundamentalsDisclaimer()}`
      : `Reference/illustrative data for this demo, not a live market feed. Verify against NGX filings and the company's audited reports before investing.`;

  res.json({ company, history, scored, disclaimer });
});

app.get("/api/companies/:id/news", (req, res) => {
  res.json({ articles: getCompanyNews(req.params.id) });
});

app.get("/api/news", (req, res) => {
  const theme = typeof req.query.theme === "string" ? req.query.theme : undefined;
  const linkedOnly = req.query.linked === "1";
  res.json({
    themes: SCOUTING_THEMES.map((t) => t.label),
    articles: getLatestNews({ theme, linkedOnly, limit: 60 }),
  });
});

app.post("/api/calculate", (req, res) => {
  const { companyId, amount, years } = req.body ?? {};
  if (typeof companyId !== "string" || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "companyId (string) and amount (positive number) are required" });
  }
  const result = computeProjection(companyId, amount, typeof years === "number" ? years : 5);
  if (!result) return res.status(404).json({ error: "Company not found" });
  res.json(result);
});

// In production the built React app is served by this same server, so the
// whole thing deploys as one service on one URL. In development Vite serves
// the client and proxies /api here instead, and this directory won't exist.
const clientDist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  startScheduler();
  startDataRefreshScheduler();
});
