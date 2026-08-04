import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCompanies, formatNaira, formatPercent, type CompaniesResponse } from "../api";
import { ScoreBadge } from "../components/ScoreBadge";
import { Disclaimer } from "../components/Disclaimer";

export function Home() {
  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sector, setSector] = useState<string>("All");

  useEffect(() => {
    fetchCompanies()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const sectors = useMemo(() => {
    if (!data) return [];
    return ["All", ...Array.from(new Set(data.companies.map((c) => c.sector))).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return sector === "All" ? data.companies : data.companies.filter((c) => c.sector === sector);
  }, [data, sector]);

  if (error) return <div className="p-8 text-red-400">Failed to load: {error}</div>;
  if (!data) return <div className="p-8 text-neutral-400">Loading companies…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white">Nigeria Investment Screener</h1>
      <p className="mt-1 text-neutral-400">
        NGX-listed companies ranked by a dividend-yield-weighted composite score. Informational only — not investment advice.
      </p>

      <div className="mt-4">
        <Disclaimer text={data.disclaimer} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {sectors.map((s) => (
          <button
            key={s}
            onClick={() => setSector(s)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              sector === s
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {filtered.map((c) => (
          <Link
            key={c.id}
            to={`/company/${c.id}`}
            className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700 hover:bg-neutral-850"
          >
            <ScoreBadge score={c.score} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="truncate text-lg font-semibold text-white">
                  {c.name} <span className="text-neutral-500">({c.symbol})</span>
                </h2>
                <span className="whitespace-nowrap text-sm text-neutral-400">{formatNaira(c.price)}/share</span>
              </div>
              <p className="mt-0.5 truncate text-sm text-neutral-400">{c.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                <span className="rounded bg-neutral-800 px-2 py-0.5">{c.sector}</span>
                <span>Avg yield: {formatPercent(c.avgYield)}</span>
                <span>
                  Sector rank #{c.sectorRank}/{c.sectorSize}
                </span>
                {c.flags.length > 0 && (
                  <span className="text-amber-400">⚠ {c.flags.length} flag{c.flags.length > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
