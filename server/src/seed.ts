import { db } from "./db.js";
import type { Company, FinancialYear } from "./types.js";

// Reference/illustrative dataset for NGX-listed companies, 2021-2025.
// Figures are order-of-magnitude illustrative approximations for demoing
// the screener, NOT live market data. Real figures must be sourced from
// NGX filings, company annual reports, and SEC Nigeria before any
// investment decision (see README).

interface Seed {
  company: Omit<Company, "price_source" | "price_updated_at">;
  financials: FinancialYear[];
}

const seeds: Seed[] = [
  {
    company: { id: "gtco", symbol: "GTCO", name: "Guaranty Trust Holding Co", sector: "Banking", description: "Pan-African financial holding company; parent of Guaranty Trust Bank.", price: 70 },
    financials: [
      { year: 2021, price: 28, dividend_per_share: 2.0, eps: 6.58, roe: 24, debt_to_equity: 2.1, revenue_growth: 8 },
      { year: 2022, price: 26, dividend_per_share: 3.0, eps: 7.28, roe: 22, debt_to_equity: 2.0, revenue_growth: 12 },
      { year: 2023, price: 39, dividend_per_share: 3.0, eps: 20.03, roe: 52, debt_to_equity: 1.8, revenue_growth: 78 },
      { year: 2024, price: 52, dividend_per_share: 7.03, eps: 23.3, roe: 45, debt_to_equity: 1.7, revenue_growth: 65 },
      { year: 2025, price: 70, dividend_per_share: 8.0, eps: 25.0, roe: 40, debt_to_equity: 1.6, revenue_growth: 30 },
    ],
  },
  {
    company: { id: "zenithbank", symbol: "ZENITHBANK", name: "Zenith Bank Plc", sector: "Banking", description: "One of Nigeria's largest banks by assets and profitability.", price: 58 },
    financials: [
      { year: 2021, price: 24, dividend_per_share: 3.0, eps: 7.94, roe: 22, debt_to_equity: 2.5, revenue_growth: 10 },
      { year: 2022, price: 25, dividend_per_share: 3.05, eps: 8.62, roe: 21, debt_to_equity: 2.4, revenue_growth: 15 },
      { year: 2023, price: 36, dividend_per_share: 4.0, eps: 17.99, roe: 35, debt_to_equity: 2.2, revenue_growth: 70 },
      { year: 2024, price: 42, dividend_per_share: 5.0, eps: 20.0, roe: 30, debt_to_equity: 2.1, revenue_growth: 55 },
      { year: 2025, price: 58, dividend_per_share: 5.5, eps: 21.5, roe: 28, debt_to_equity: 2.0, revenue_growth: 25 },
    ],
  },
  {
    company: { id: "accesscorp", symbol: "ACCESSCORP", name: "Access Holdings Plc", sector: "Banking", description: "Financial holding company for Access Bank, with a large pan-African footprint.", price: 24 },
    financials: [
      { year: 2021, price: 9, dividend_per_share: 0.8, eps: 3.86, roe: 16, debt_to_equity: 3.0, revenue_growth: 12 },
      { year: 2022, price: 10, dividend_per_share: 1.1, eps: 5.17, roe: 18, debt_to_equity: 2.9, revenue_growth: 20 },
      { year: 2023, price: 15, dividend_per_share: 1.3, eps: 9.11, roe: 20, debt_to_equity: 2.7, revenue_growth: 60 },
      { year: 2024, price: 19, dividend_per_share: 1.8, eps: 10.5, roe: 19, debt_to_equity: 2.6, revenue_growth: 45 },
      { year: 2025, price: 24, dividend_per_share: 2.1, eps: 12.0, roe: 18, debt_to_equity: 2.5, revenue_growth: 22 },
    ],
  },
  {
    company: { id: "fbnh", symbol: "FBNH", name: "FBN Holdings Plc", sector: "Banking", description: "Holding company for First Bank of Nigeria, one of the oldest banks in the country.", price: 32 },
    financials: [
      { year: 2021, price: 8, dividend_per_share: 0.15, eps: 2.24, roe: 9, debt_to_equity: 3.4, revenue_growth: 5 },
      { year: 2022, price: 11, dividend_per_share: 0.35, eps: 3.76, roe: 13, debt_to_equity: 3.2, revenue_growth: 18 },
      { year: 2023, price: 20, dividend_per_share: 0.55, eps: 8.68, roe: 22, debt_to_equity: 3.0, revenue_growth: 65 },
      { year: 2024, price: 26, dividend_per_share: 0.9, eps: 10.0, roe: 20, debt_to_equity: 2.9, revenue_growth: 48 },
      { year: 2025, price: 32, dividend_per_share: 1.5, eps: 11.5, roe: 19, debt_to_equity: 2.8, revenue_growth: 20 },
    ],
  },
  {
    company: { id: "stanbic", symbol: "STANBIC", name: "Stanbic IBTC Holdings Plc", sector: "Banking", description: "Nigerian arm of Standard Bank Group, spanning banking, pensions, and asset management.", price: 78 },
    financials: [
      { year: 2021, price: 38, dividend_per_share: 2.0, eps: 5.36, roe: 18, debt_to_equity: 2.0, revenue_growth: 9 },
      { year: 2022, price: 44, dividend_per_share: 3.55, eps: 8.15, roe: 24, debt_to_equity: 1.9, revenue_growth: 22 },
      { year: 2023, price: 55, dividend_per_share: 4.6, eps: 13.09, roe: 30, debt_to_equity: 1.7, revenue_growth: 48 },
      { year: 2024, price: 65, dividend_per_share: 5.05, eps: 14.5, roe: 28, debt_to_equity: 1.6, revenue_growth: 35 },
      { year: 2025, price: 78, dividend_per_share: 6.0, eps: 16.0, roe: 26, debt_to_equity: 1.5, revenue_growth: 18 },
    ],
  },
  {
    company: { id: "mtnn", symbol: "MTNN", name: "MTN Nigeria Communications Plc", sector: "Telecom", description: "Nigeria's largest mobile network operator by subscribers.", price: 220 },
    financials: [
      { year: 2021, price: 169, dividend_per_share: 14.0, eps: 15.05, roe: 110, debt_to_equity: 1.8, revenue_growth: 20 },
      { year: 2022, price: 198, dividend_per_share: 20.8, eps: 20.8, roe: 95, debt_to_equity: 2.0, revenue_growth: 22 },
      { year: 2023, price: 227, dividend_per_share: 6.0, eps: -19.83, roe: -60, debt_to_equity: 3.5, revenue_growth: 24 },
      { year: 2024, price: 195, dividend_per_share: 0.0, eps: -24.61, roe: -70, debt_to_equity: 4.2, revenue_growth: 30 },
      { year: 2025, price: 220, dividend_per_share: 5.0, eps: 8.0, roe: 20, debt_to_equity: 3.0, revenue_growth: 28 },
    ],
  },
  {
    company: { id: "airtelafri", symbol: "AIRTELAFRI", name: "Airtel Africa Plc", sector: "Telecom", description: "Pan-African telecom and mobile money operator, dual-listed on NGX and LSE.", price: 2400 },
    financials: [
      { year: 2021, price: 1200, dividend_per_share: 22.5, eps: 60, roe: 35, debt_to_equity: 1.5, revenue_growth: 18 },
      { year: 2022, price: 1450, dividend_per_share: 25.0, eps: 75, roe: 38, debt_to_equity: 1.4, revenue_growth: 20 },
      { year: 2023, price: 1800, dividend_per_share: 27.0, eps: 65, roe: 30, debt_to_equity: 1.6, revenue_growth: 16 },
      { year: 2024, price: 2100, dividend_per_share: 30.0, eps: 90, roe: 33, debt_to_equity: 1.5, revenue_growth: 19 },
      { year: 2025, price: 2400, dividend_per_share: 33.0, eps: 100, roe: 34, debt_to_equity: 1.4, revenue_growth: 17 },
    ],
  },
  {
    company: { id: "dangcem", symbol: "DANGCEM", name: "Dangote Cement Plc", sector: "Industrial Goods", description: "Africa's largest cement producer, with operations across 10+ countries.", price: 520 },
    financials: [
      { year: 2021, price: 265, dividend_per_share: 16.0, eps: 20.2, roe: 38, debt_to_equity: 0.9, revenue_growth: 8 },
      { year: 2022, price: 280, dividend_per_share: 20.0, eps: 20.5, roe: 35, debt_to_equity: 0.85, revenue_growth: 12 },
      { year: 2023, price: 350, dividend_per_share: 20.0, eps: 19.87, roe: 30, debt_to_equity: 0.8, revenue_growth: 35 },
      { year: 2024, price: 420, dividend_per_share: 22.0, eps: 23.14, roe: 32, debt_to_equity: 0.75, revenue_growth: 28 },
      { year: 2025, price: 520, dividend_per_share: 24.0, eps: 25.0, roe: 31, debt_to_equity: 0.7, revenue_growth: 15 },
    ],
  },
  {
    company: { id: "buafoods", symbol: "BUAFOODS", name: "BUA Foods Plc", sector: "Consumer Goods", description: "Diversified food producer covering sugar, flour, pasta, and edible oils.", price: 400 },
    financials: [
      { year: 2021, price: 60, dividend_per_share: 0.0, eps: 5.5, roe: 40, debt_to_equity: 1.2, revenue_growth: 15 },
      { year: 2022, price: 80, dividend_per_share: 0.0, eps: 6.7, roe: 42, debt_to_equity: 1.1, revenue_growth: 20 },
      { year: 2023, price: 150, dividend_per_share: 1.3, eps: 8.62, roe: 38, debt_to_equity: 1.0, revenue_growth: 39 },
      { year: 2024, price: 280, dividend_per_share: 2.0, eps: 10.0, roe: 36, debt_to_equity: 0.95, revenue_growth: 30 },
      { year: 2025, price: 400, dividend_per_share: 2.5, eps: 11.5, roe: 35, debt_to_equity: 0.9, revenue_growth: 20 },
    ],
  },
  {
    company: { id: "nestle", symbol: "NESTLE", name: "Nestle Nigeria Plc", sector: "Consumer Goods", description: "Major FMCG producer (Milo, Maggi, Golden Morn) heavily exposed to import costs.", price: 1450 },
    financials: [
      { year: 2021, price: 1350, dividend_per_share: 45.5, eps: 52.6, roe: 150, debt_to_equity: 2.2, revenue_growth: 18 },
      { year: 2022, price: 1250, dividend_per_share: 45.5, eps: 22.5, roe: 80, debt_to_equity: 2.8, revenue_growth: 16 },
      { year: 2023, price: 950, dividend_per_share: 0.0, eps: -42.3, roe: -90, debt_to_equity: 4.0, revenue_growth: 37 },
      { year: 2024, price: 1100, dividend_per_share: 5.0, eps: 8.0, roe: 20, debt_to_equity: 3.2, revenue_growth: 25 },
      { year: 2025, price: 1450, dividend_per_share: 20.0, eps: 35.0, roe: 55, debt_to_equity: 2.5, revenue_growth: 18 },
    ],
  },
  {
    company: { id: "nb", symbol: "NB", name: "Nigerian Breweries Plc", sector: "Consumer Goods", description: "Nigeria's largest brewer, part of the Heineken group; hit hard by FX losses in 2023-24.", price: 65 },
    financials: [
      { year: 2021, price: 44, dividend_per_share: 1.85, eps: 2.3, roe: 14, debt_to_equity: 1.3, revenue_growth: 10 },
      { year: 2022, price: 38, dividend_per_share: 0.65, eps: 0.98, roe: 6, debt_to_equity: 1.8, revenue_growth: 14 },
      { year: 2023, price: 26, dividend_per_share: 0.0, eps: -9.73, roe: -55, debt_to_equity: 3.2, revenue_growth: 45 },
      { year: 2024, price: 33, dividend_per_share: 0.0, eps: -2.5, roe: -15, debt_to_equity: 2.8, revenue_growth: 20 },
      { year: 2025, price: 65, dividend_per_share: 0.5, eps: 1.0, roe: 6, debt_to_equity: 2.2, revenue_growth: 15 },
    ],
  },
  {
    company: { id: "seplat", symbol: "SEPLAT", name: "Seplat Energy Plc", sector: "Oil & Gas", description: "Independent Nigerian oil and gas exploration and production company.", price: 6200 },
    financials: [
      { year: 2021, price: 750, dividend_per_share: 106, eps: 250, roe: 12, debt_to_equity: 0.6, revenue_growth: 20 },
      { year: 2022, price: 1200, dividend_per_share: 106, eps: 310, roe: 14, debt_to_equity: 0.55, revenue_growth: 25 },
      { year: 2023, price: 2800, dividend_per_share: 106, eps: 600, roe: 22, debt_to_equity: 0.5, revenue_growth: 55 },
      { year: 2024, price: 4500, dividend_per_share: 120, eps: 750, roe: 24, debt_to_equity: 0.45, revenue_growth: 40 },
      { year: 2025, price: 6200, dividend_per_share: 140, eps: 820, roe: 23, debt_to_equity: 0.4, revenue_growth: 20 },
    ],
  },
  {
    company: { id: "okomuoil", symbol: "OKOMUOIL", name: "Okomu Oil Palm Plc", sector: "Agriculture", description: "Palm oil and rubber producer, majority-owned by SOCFIN.", price: 520 },
    financials: [
      { year: 2021, price: 145, dividend_per_share: 9.25, eps: 16.2, roe: 28, debt_to_equity: 0.3, revenue_growth: 15 },
      { year: 2022, price: 180, dividend_per_share: 15.3, eps: 20.5, roe: 30, debt_to_equity: 0.25, revenue_growth: 22 },
      { year: 2023, price: 280, dividend_per_share: 20.0, eps: 34.0, roe: 35, debt_to_equity: 0.2, revenue_growth: 45 },
      { year: 2024, price: 400, dividend_per_share: 22.0, eps: 38.0, roe: 33, debt_to_equity: 0.2, revenue_growth: 20 },
      { year: 2025, price: 520, dividend_per_share: 24.0, eps: 36.0, roe: 30, debt_to_equity: 0.18, revenue_growth: 12 },
    ],
  },
  {
    company: { id: "presco", symbol: "PRESCO", name: "Presco Plc", sector: "Agriculture", description: "Vertically integrated palm oil producer and refiner.", price: 830 },
    financials: [
      { year: 2021, price: 130, dividend_per_share: 15.0, eps: 23.8, roe: 32, debt_to_equity: 0.25, revenue_growth: 18 },
      { year: 2022, price: 210, dividend_per_share: 20.0, eps: 29.5, roe: 34, debt_to_equity: 0.2, revenue_growth: 24 },
      { year: 2023, price: 400, dividend_per_share: 26.0, eps: 48.2, roe: 38, debt_to_equity: 0.18, revenue_growth: 50 },
      { year: 2024, price: 650, dividend_per_share: 30.0, eps: 55.0, roe: 35, debt_to_equity: 0.15, revenue_growth: 22 },
      { year: 2025, price: 830, dividend_per_share: 35.0, eps: 52.0, roe: 32, debt_to_equity: 0.15, revenue_growth: 14 },
    ],
  },
  {
    company: { id: "transcorp", symbol: "TRANSCORP", name: "Transnational Corporation Plc", sector: "Conglomerate", description: "Diversified holding company spanning power generation, hospitality, and oil & gas.", price: 38 },
    financials: [
      { year: 2021, price: 1.2, dividend_per_share: 0.02, eps: 0.35, roe: 8, debt_to_equity: 1.0, revenue_growth: 10 },
      { year: 2022, price: 1.8, dividend_per_share: 0.05, eps: 0.55, roe: 11, debt_to_equity: 0.9, revenue_growth: 25 },
      { year: 2023, price: 8.5, dividend_per_share: 0.15, eps: 1.2, roe: 18, debt_to_equity: 0.8, revenue_growth: 60 },
      { year: 2024, price: 22, dividend_per_share: 0.2, eps: 1.6, roe: 20, debt_to_equity: 0.7, revenue_growth: 45 },
      { year: 2025, price: 38, dividend_per_share: 0.25, eps: 1.8, roe: 19, debt_to_equity: 0.6, revenue_growth: 30 },
    ],
  },
];

const insertCompany = db.prepare(`
  INSERT OR REPLACE INTO companies (id, symbol, name, sector, description, price)
  VALUES (@id, @symbol, @name, @sector, @description, @price)
`);

const insertFinancial = db.prepare(`
  INSERT OR REPLACE INTO financials (company_id, year, price, dividend_per_share, eps, roe, debt_to_equity, revenue_growth)
  VALUES (@company_id, @year, @price, @dividend_per_share, @eps, @roe, @debt_to_equity, @revenue_growth)
`);

const run = db.transaction(() => {
  for (const seed of seeds) {
    insertCompany.run(seed.company);
    for (const f of seed.financials) {
      insertFinancial.run({ company_id: seed.company.id, ...f });
    }
  }
});

run();

console.log(`Seeded ${seeds.length} companies with ${seeds.reduce((n, s) => n + s.financials.length, 0)} financial-year records.`);
