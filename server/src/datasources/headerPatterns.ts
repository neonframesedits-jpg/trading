// Header keyword patterns for the scraped pages, kept separate from the
// fetchers so they can be tested against realistic layouts. The real pages
// haven't been inspected yet (see README) — when one shows "no-match" on the
// data status page, this is the file to adjust.

const NOT_PRIOR_OR_INTRADAY = /^(?!.*\b(prev|previous|open|opening|high|low)\b)/i;

export const NGX_PRICE_HEADERS = {
  symbol: /symbol|ticker/i,
  // Price lists typically show "Prev. Close" before "Close" — taking the
  // first "close" column would record yesterday's price as today's.
  price: [
    new RegExp(NOT_PRIOR_OR_INTRADAY.source + ".*clos(e|ing)", "i"),
    new RegExp(NOT_PRIOR_OR_INTRADAY.source + ".*(current|last|price)", "i"),
  ],
};

export const CBN_RATE_HEADERS = {
  currency: /currency/i,
  // CBN tables list buying, central and selling rates, often after a
  // "Rate Date" column; the central rate is the official one.
  rate: [/central/i, /^(?!.*date).*(buying|rate)/i],
};

export const NGX_DIVIDEND_HEADERS = {
  symbol: /symbol|company|security/i,
  // Skip "Dividend Type" (Interim/Final) and date columns.
  dividend: [/per\s*share|amount/i, /^(?!.*\b(type|date)\b).*dividend/i],
  year: /year|period/i,
};
