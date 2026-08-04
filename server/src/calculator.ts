import { db } from "./db.js";
import type { Company, FinancialYear } from "./types.js";

export interface ProjectionYear {
  year: number; // years from now, 1-based
  lowIncome: number;
  expectedIncome: number;
  highIncome: number;
  cumulativeLow: number;
  cumulativeExpected: number;
  cumulativeHigh: number;
}

export interface ProjectionResult {
  company: Company;
  amount: number;
  shares: number;
  leftoverCash: number;
  latestDividendPerShare: number;
  minYield: number;
  avgYield: number;
  maxYield: number;
  projectedAnnualIncomeLow: number;
  projectedAnnualIncomeExpected: number;
  projectedAnnualIncomeHigh: number;
  projection: ProjectionYear[];
  tips: string[];
}

export function computeProjection(companyId: string, amount: number, years = 5): ProjectionResult | null {
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(companyId) as Company | undefined;
  if (!company) return null;

  const history = db
    .prepare("SELECT * FROM financials WHERE company_id = ? ORDER BY year")
    .all(companyId) as FinancialYear[];

  const yields = history.map((f) => f.dividend_per_share / f.price);
  const minYield = Math.min(...yields);
  const maxYield = Math.max(...yields);
  const avgYield = yields.reduce((a, b) => a + b, 0) / yields.length;

  const shares = Math.floor(amount / company.price);
  const leftoverCash = Math.round((amount - shares * company.price) * 100) / 100;
  const latestDividendPerShare = history[history.length - 1].dividend_per_share;

  const projectedAnnualIncomeLow = round2(amount * minYield);
  const projectedAnnualIncomeExpected = round2(amount * avgYield);
  const projectedAnnualIncomeHigh = round2(amount * maxYield);

  const projection: ProjectionYear[] = [];
  let cumLow = 0, cumExp = 0, cumHigh = 0;
  for (let y = 1; y <= years; y++) {
    cumLow += projectedAnnualIncomeLow;
    cumExp += projectedAnnualIncomeExpected;
    cumHigh += projectedAnnualIncomeHigh;
    projection.push({
      year: y,
      lowIncome: projectedAnnualIncomeLow,
      expectedIncome: projectedAnnualIncomeExpected,
      highIncome: projectedAnnualIncomeHigh,
      cumulativeLow: round2(cumLow),
      cumulativeExpected: round2(cumExp),
      cumulativeHigh: round2(cumHigh),
    });
  }

  const tips: string[] = [];
  if (shares > 0 && leftoverCash >= company.price * 0.8) {
    tips.push(
      `You're ₦${(company.price - leftoverCash).toLocaleString()} short of another full share — topping up to ₦${((shares + 1) * company.price).toLocaleString()} would use your money more efficiently.`
    );
  } else if (shares === 0) {
    tips.push(
      `This amount doesn't cover even one share at the current price of ₦${company.price.toLocaleString()} — increase the amount or pick a lower-priced company.`
    );
  }
  if (amount < company.price * 10) {
    tips.push("This is a small position in this company — fine for learning the ropes, but returns in naira terms will be modest at this size.");
  }
  tips.push(
    "This projection covers dividend income only, based on historical yield range. It does not predict share price movement — a stock's price can rise or fall independently of its dividend, and past yields are not a guarantee of future payouts."
  );
  tips.push("Spreading an investment across multiple sectors reduces the impact of any single company cutting its dividend or reporting a loss.");

  return {
    company,
    amount,
    shares,
    leftoverCash,
    latestDividendPerShare,
    minYield,
    avgYield,
    maxYield,
    projectedAnnualIncomeLow,
    projectedAnnualIncomeExpected,
    projectedAnnualIncomeHigh,
    projection,
    tips,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
