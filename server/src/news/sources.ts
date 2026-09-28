// How much to trust a source, by domain. Tier 1 = official/primary sources,
// tier 2 = established outlets with editorial standards, tier 3 = anything
// else (unknown sites surfaced by GDELT, blogs, and later social media).
// Signals from tier 3 alone should always be presented as unverified.
export type SourceTier = 1 | 2 | 3;

const TIER_1_DOMAINS = ["ngxgroup.com"];
const TIER_1_SUFFIXES = [".gov.ng"];

const TIER_2_DOMAINS = [
  // Nigerian business and general news
  "nairametrics.com",
  "businessday.ng",
  "premiumtimesng.com",
  "thecable.ng",
  "punchng.com",
  "vanguardngr.com",
  "guardian.ng",
  "thisdaylive.com",
  "proshareng.com",
  "leadership.ng",
  "dailytrust.com",
  "channelstv.com",
  // International
  "reuters.com",
  "bloomberg.com",
  "ft.com",
  "wsj.com",
  "economist.com",
  "bbc.com",
  "bbc.co.uk",
  "aljazeera.com",
  "theafricareport.com",
  "africanbusinesscentral.com",
  "cnbcafrica.com",
];

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function domainMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith("." + domain);
}

export function classifyTier(domainOrUrl: string): SourceTier {
  const host = domainOrUrl.includes("://") ? hostOf(domainOrUrl) : domainOrUrl.toLowerCase().replace(/^www\./, "");
  if (!host) return 3;
  if (TIER_1_DOMAINS.some((d) => domainMatches(host, d)) || TIER_1_SUFFIXES.some((s) => host.endsWith(s))) {
    return 1;
  }
  if (TIER_2_DOMAINS.some((d) => domainMatches(host, d))) return 2;
  return 3;
}

export interface FeedConfig {
  name: string;
  url: string;
}

// Standard RSS/Atom feeds. The URLs follow each site's usual feed location
// but couldn't be fetched from the session this was written in (outbound
// access blocked) — the data status page will show any that fail.
export const RSS_FEEDS: FeedConfig[] = [
  { name: "Nairametrics", url: "https://nairametrics.com/feed/" },
  { name: "BusinessDay", url: "https://businessday.ng/feed/" },
  { name: "Premium Times", url: "https://www.premiumtimesng.com/feed" },
  { name: "TheCable", url: "https://www.thecable.ng/feed" },
  { name: "BBC News Africa", url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml" },
];

// Broad GDELT searches for opportunities that may not mention a tracked
// company yet. GDELT indexes news in many languages, so these surface
// foreign coverage of Nigerian deals as well as local reporting.
export const SCOUTING_THEMES: { label: string; query: string }[] = [
  { label: "Contract awards", query: `Nigeria ("contract award" OR "awarded a contract" OR "wins contract")` },
  { label: "Investment deals", query: `Nigeria ("foreign direct investment" OR "investment deal" OR "memorandum of understanding")` },
  { label: "Mergers & acquisitions", query: `Nigeria (acquisition OR merger OR "acquires stake")` },
  { label: "Nigerian stock market", query: `("Nigerian Exchange" OR "Nigerian stock market" OR "NGX All-Share")` },
];
