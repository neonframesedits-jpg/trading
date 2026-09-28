export interface CompanyMatcher {
  companyId: string;
  alias: string;
  pattern: RegExp;
}

// Lowercase and strip accents so "Nestlé" matches "Nestle".
export function normalizeForMatching(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMatchers(companies: { id: string; aliases: string[] }[]): CompanyMatcher[] {
  const matchers: CompanyMatcher[] = [];
  for (const c of companies) {
    for (const alias of c.aliases) {
      const normalized = escapeRegExp(normalizeForMatching(alias)).replace(/\s+/g, "\\s+");
      // Whole-word match, so "GTCO" doesn't match inside "GTCOM".
      matchers.push({ companyId: c.id, alias, pattern: new RegExp(`(^|[^a-z0-9])${normalized}([^a-z0-9]|$)`) });
    }
  }
  return matchers;
}

/** Returns each company mentioned in the text, with the alias that matched. */
export function matchCompanies(text: string, matchers: CompanyMatcher[]): { companyId: string; alias: string }[] {
  const normalized = normalizeForMatching(text);
  const found = new Map<string, string>();
  for (const m of matchers) {
    if (!found.has(m.companyId) && m.pattern.test(normalized)) found.set(m.companyId, m.alias);
  }
  return [...found].map(([companyId, alias]) => ({ companyId, alias }));
}
