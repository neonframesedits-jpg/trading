import { db } from "./db.js";
import type { Company, FinancialYear, ScoredCompany } from "./types.js";

// Weighted composite score (0-100). Each component is normalized against
// the full dataset (min-max) so scores are relative, not absolute truths.
const WEIGHTS = {
  yield: 0.3,
  consistency: 0.2,
  payout: 0.15,
  profitability: 0.15,
  leverage: 0.1,
  growth: 0.1,
};

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[]): number {
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((n) => (n - m) ** 2)));
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

interface RawMetrics {
  company: Company;
  history: FinancialYear[];
  avgYield: number;
  latestYield: number;
  yieldCV: number; // coefficient of variation of dividend per share
  dividendCuts: number; // count of year-over-year dividend decreases
  avgPayoutRatio: number;
  hasNegativeEps: boolean;
  avgRoe: number;
  avgDebtToEquity: number;
  avgRevenueGrowth: number;
  flags: string[];
}

function computeRawMetrics(company: Company, history: FinancialYear[]): RawMetrics {
  const sorted = [...history].sort((a, b) => a.year - b.year);
  const yields = sorted.map((f) => f.dividend_per_share / f.price);
  const avgYield = mean(yields);
  const latestYield = yields[yields.length - 1];

  const divs = sorted.map((f) => f.dividend_per_share);
  const divMean = mean(divs);
  const yieldCV = divMean === 0 ? 1 : stddev(divs) / divMean;

  let dividendCuts = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].dividend_per_share < sorted[i - 1].dividend_per_share) dividendCuts++;
  }

  const payoutRatios = sorted
    .filter((f) => f.eps > 0)
    .map((f) => f.dividend_per_share / f.eps);
  const avgPayoutRatio = payoutRatios.length ? mean(payoutRatios) : 2; // no positive-earnings years is a red flag

  const hasNegativeEps = sorted.some((f) => f.eps < 0);
  const avgRoe = mean(sorted.map((f) => f.roe));
  const avgDebtToEquity = mean(sorted.map((f) => f.debt_to_equity));
  const avgRevenueGrowth = mean(sorted.map((f) => f.revenue_growth));

  const flags: string[] = [];
  if (dividendCuts > 0) flags.push(`Dividend cut in ${dividendCuts} of the last ${sorted.length} years`);
  if (hasNegativeEps) flags.push("Reported a net loss in at least one recent year");
  if (avgPayoutRatio > 0.9) flags.push("Payout ratio averages above 90% of earnings — low reinvestment cushion");
  if (avgDebtToEquity > 3) flags.push("High leverage (debt/equity above 3x)");

  return {
    company,
    history: sorted,
    avgYield,
    latestYield,
    yieldCV,
    dividendCuts,
    avgPayoutRatio,
    hasNegativeEps,
    avgRoe,
    avgDebtToEquity,
    avgRevenueGrowth,
    flags,
  };
}

export function scoreAllCompanies(): ScoredCompany[] {
  const companies = db.prepare("SELECT * FROM companies").all() as Company[];
  const financialStmt = db.prepare("SELECT * FROM financials WHERE company_id = ? ORDER BY year");

  const raw = companies.map((c) => {
    const history = financialStmt.all(c.id) as FinancialYear[];
    return computeRawMetrics(c, history);
  });

  const yieldMin = Math.min(...raw.map((r) => r.avgYield));
  const yieldMax = Math.max(...raw.map((r) => r.avgYield));
  const cvMin = Math.min(...raw.map((r) => r.yieldCV));
  const cvMax = Math.max(...raw.map((r) => r.yieldCV));
  const roeMin = Math.min(...raw.map((r) => r.avgRoe));
  const roeMax = Math.max(...raw.map((r) => r.avgRoe));
  const deMin = Math.min(...raw.map((r) => r.avgDebtToEquity));
  const deMax = Math.max(...raw.map((r) => r.avgDebtToEquity));
  const growthMin = Math.min(...raw.map((r) => r.avgRevenueGrowth));
  const growthMax = Math.max(...raw.map((r) => r.avgRevenueGrowth));

  const scored: ScoredCompany[] = raw.map((r) => {
    const yieldScore = normalize(r.avgYield, yieldMin, yieldMax);

    // Lower coefficient-of-variation = more consistent = higher score.
    // Any dividend cut caps consistency hard, since a cut is what
    // actually hurts income investors, not just statistical variance.
    let consistencyScore = normalize(cvMax - r.yieldCV, 0, cvMax - cvMin);
    if (r.dividendCuts > 0) consistencyScore = Math.min(consistencyScore, 40 - r.dividendCuts * 10);
    consistencyScore = Math.max(0, consistencyScore);

    // Payout sustainability: ideal band is roughly 30%-70% of earnings.
    let payoutScore: number;
    if (r.avgPayoutRatio < 0) payoutScore = 0;
    else if (r.avgPayoutRatio <= 0.3) payoutScore = normalize(r.avgPayoutRatio, 0, 0.3) * 0.7; // paying little is safe but not efficient
    else if (r.avgPayoutRatio <= 0.7) payoutScore = 100;
    else if (r.avgPayoutRatio <= 1.0) payoutScore = normalize(1.0 - r.avgPayoutRatio, 0, 0.3);
    else payoutScore = Math.max(0, 20 - (r.avgPayoutRatio - 1) * 40);

    const profitabilityScore = normalize(r.avgRoe, roeMin, roeMax);
    const leverageScore = normalize(deMax - r.avgDebtToEquity, 0, deMax - deMin);
    const growthScore = normalize(r.avgRevenueGrowth, growthMin, growthMax);

    const score =
      yieldScore * WEIGHTS.yield +
      consistencyScore * WEIGHTS.consistency +
      payoutScore * WEIGHTS.payout +
      profitabilityScore * WEIGHTS.profitability +
      leverageScore * WEIGHTS.leverage +
      growthScore * WEIGHTS.growth;

    return {
      ...r.company,
      score: Math.round(Math.max(0, Math.min(100, score)) * 10) / 10,
      sectorRank: 0,
      sectorSize: 0,
      avgYield: r.avgYield,
      latestYield: r.latestYield,
      consistencyScore: Math.round(consistencyScore),
      payoutScore: Math.round(payoutScore),
      profitabilityScore: Math.round(profitabilityScore),
      leverageScore: Math.round(leverageScore),
      growthScore: Math.round(growthScore),
      yieldScore: Math.round(yieldScore),
      flags: r.flags,
    };
  });

  // Sector-relative rank
  const bySector = new Map<string, ScoredCompany[]>();
  for (const s of scored) {
    if (!bySector.has(s.sector)) bySector.set(s.sector, []);
    bySector.get(s.sector)!.push(s);
  }
  for (const group of bySector.values()) {
    group.sort((a, b) => b.score - a.score);
    group.forEach((c, i) => {
      c.sectorRank = i + 1;
      c.sectorSize = group.length;
    });
  }

  return scored.sort((a, b) => b.score - a.score);
}
