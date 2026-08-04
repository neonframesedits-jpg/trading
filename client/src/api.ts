export interface Company {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  description: string;
  price: number;
}

export interface ScoredCompany extends Company {
  score: number;
  sectorRank: number;
  sectorSize: number;
  avgYield: number;
  latestYield: number;
  consistencyScore: number;
  payoutScore: number;
  profitabilityScore: number;
  leverageScore: number;
  growthScore: number;
  yieldScore: number;
  flags: string[];
}

export interface FinancialYear {
  year: number;
  price: number;
  dividend_per_share: number;
  eps: number;
  roe: number;
  debt_to_equity: number;
  revenue_growth: number;
}

export interface CompaniesResponse {
  generatedAt: string;
  disclaimer: string;
  companies: ScoredCompany[];
}

export interface CompanyDetailResponse {
  company: Company;
  history: FinancialYear[];
  scored: ScoredCompany;
  disclaimer: string;
}

export interface ProjectionYear {
  year: number;
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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function fetchCompanies(): Promise<CompaniesResponse> {
  return get("/api/companies");
}

export function fetchCompany(id: string): Promise<CompanyDetailResponse> {
  return get(`/api/companies/${id}`);
}

export async function fetchProjection(companyId: string, amount: number, years = 5): Promise<ProjectionResult> {
  const res = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, amount, years }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function formatNaira(n: number): string {
  return "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + "%";
}
