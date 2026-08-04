export interface Company {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  description: string;
  price: number;
  price_source: string;
  price_updated_at: string | null;
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
