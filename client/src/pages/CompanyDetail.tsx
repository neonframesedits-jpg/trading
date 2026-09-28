import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCompany, fetchCompanyNews, formatNaira, formatPercent, type CompanyDetailResponse, type NewsArticle } from "../api";
import { NewsList } from "../components/NewsList";
import { ProgressCircle } from "../components/ProgressCircle";
import { HistoryChart } from "../components/HistoryChart";
import { InvestmentCalculator } from "../components/InvestmentCalculator";
import { SignalCard } from "../components/Signal";
import { Disclaimer } from "../components/Disclaimer";
import { scoreColor } from "../components/ScoreBadge";

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CompanyDetailResponse | null>(null);
  const [news, setNews] = useState<NewsArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setData(null);
    setNews(null);
    fetchCompany(id)
      .then(setData)
      .catch((e) => setError(e.message));
    fetchCompanyNews(id)
      .then((r) => setNews(r.articles))
      .catch(() => setNews([]));
  }, [id]);

  if (error) return <div className="p-8 text-red-400">Failed to load: {error}</div>;
  if (!data) return <div className="p-8 text-neutral-400">Loading…</div>;

  const { company, history, scored } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-neutral-400 hover:text-white">
        ← Back to screener
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {company.name} <span className="text-neutral-500">({company.symbol})</span>
          </h1>
          <p className="mt-1 max-w-xl text-neutral-400">{company.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-400">
            <span className="rounded bg-neutral-800 px-2 py-0.5">{company.sector}</span>
            <span>{formatNaira(company.price)}/share</span>
            <span>
              Sector rank #{scored.sectorRank}/{scored.sectorSize}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold"
            style={{
              backgroundColor: `${scoreColor(scored.score)}22`,
              color: scoreColor(scored.score),
              border: `3px solid ${scoreColor(scored.score)}`,
            }}
          >
            {scored.score}
          </div>
          <span className="mt-1 text-xs text-neutral-500">Composite score</span>
        </div>
      </div>

      <div className="mt-4">
        <Disclaimer text={data.disclaimer} />
      </div>

      <div className="mt-6">
        <SignalCard company={scored} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Score breakdown</h2>
        <div className="mt-3 flex flex-wrap gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <ProgressCircle value={scored.yieldScore} label="Dividend yield" color="#22c55e" />
          <ProgressCircle value={scored.consistencyScore} label="Dividend consistency" color="#38bdf8" />
          <ProgressCircle value={scored.payoutScore} label="Payout sustainability" color="#a78bfa" />
          <ProgressCircle value={scored.profitabilityScore} label="Profitability (ROE)" color="#f97316" />
          <ProgressCircle value={scored.leverageScore} label="Low leverage" color="#eab308" />
          <ProgressCircle value={scored.growthScore} label="Revenue growth" color="#ec4899" />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Growth history (last {history.length} years)</h2>
        <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <HistoryChart history={history} />
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <span className="text-neutral-400">
              Avg yield: <span className="text-white">{formatPercent(scored.avgYield)}</span>
            </span>
            <span className="text-neutral-400">
              Latest yield: <span className="text-white">{formatPercent(scored.latestYield)}</span>
            </span>
            <span className="text-neutral-400">
              Latest dividend/share: <span className="text-white">{formatNaira(history[history.length - 1].dividend_per_share)}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">In the news</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Articles that mention {company.name}, matched by name. Check the source badge before acting on anything.
        </p>
        <div className="mt-3">
          {news === null ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : (
            <NewsList
              articles={news}
              showCompanies={false}
              emptyText="No articles found yet. News is collected hourly once the app is running with internet access."
            />
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Investment calculator</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Enter an amount to see roughly what it buys and what dividend income it could generate, based on this company's yield history.
        </p>
        <div className="mt-3">
          <InvestmentCalculator companyId={company.id} />
        </div>
      </section>
    </div>
  );
}
