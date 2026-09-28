// Names each company is actually referred to by in the press. Chosen for
// precision over recall: a wrong match (attaching MTN Group's South African
// news to MTN Nigeria, or the privately held Dangote refinery to Dangote
// Cement) is worse for reliability than a missed one, which the AI analysis
// step can recover later. Companies missing here fall back to their full name.
export const COMPANY_ALIASES: Record<string, string[]> = {
  GTCO: ["GTCO", "Guaranty Trust", "GTBank"],
  ZENITHBANK: ["Zenith Bank", "ZENITHBANK"],
  ACCESSCORP: ["Access Holdings", "Access Bank", "ACCESSCORP"],
  FBNH: ["FBN Holdings", "First HoldCo", "First Bank of Nigeria", "FirstBank", "FBNH"],
  STANBIC: ["Stanbic IBTC"],
  MTNN: ["MTN Nigeria", "MTNN"],
  AIRTELAFRI: ["Airtel Africa", "Airtel Nigeria", "AIRTELAFRI"],
  DANGCEM: ["Dangote Cement", "DANGCEM"],
  BUAFOODS: ["BUA Foods", "BUAFOODS"],
  NESTLE: ["Nestle Nigeria"],
  NB: ["Nigerian Breweries"],
  SEPLAT: ["Seplat"],
  OKOMUOIL: ["Okomu Oil", "OKOMUOIL"],
  PRESCO: ["Presco Plc", "Presco"],
  TRANSCORP: ["Transcorp", "Transnational Corporation"],
};

export function aliasesFor(symbol: string, fullName: string): string[] {
  return COMPANY_ALIASES[symbol] ?? [fullName];
}

// Ticker-style aliases (all caps, no spaces) are fine for matching text we
// already have, but make poor search queries, so GDELT searches skip them.
export function searchableAliases(symbol: string, fullName: string): string[] {
  return aliasesFor(symbol, fullName).filter((a) => !/^[A-Z]+$/.test(a));
}
