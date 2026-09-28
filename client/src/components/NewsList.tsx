import { Link } from "react-router-dom";
import type { NewsArticle } from "../api";

const TIERS = {
  1: { label: "Official source", className: "border-emerald-700/50 bg-emerald-950/40 text-emerald-300" },
  2: { label: "Established outlet", className: "border-sky-700/50 bg-sky-950/40 text-sky-300" },
  3: { label: "Unverified source", className: "border-amber-700/50 bg-amber-950/40 text-amber-300" },
} as const;

export function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const t = TIERS[tier] ?? TIERS[3];
  return <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${t.className}`}>{t.label}</span>;
}

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG");
}

function isEnglish(language: string | null): boolean {
  return !language || /^en(\b|-|glish)/i.test(language);
}

export function NewsList({
  articles,
  showCompanies = true,
  emptyText,
}: {
  articles: NewsArticle[];
  showCompanies?: boolean;
  emptyText: string;
}) {
  if (articles.length === 0) {
    return <p className="rounded-xl border border-dashed border-neutral-700 p-6 text-center text-sm text-neutral-400">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {articles.map((a) => (
        <li key={a.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <TierBadge tier={a.tier} />
            <span className="text-neutral-300">{a.source_name}</span>
            <span>·</span>
            <span>{timeAgo(a.published_at ?? a.fetched_at)}</span>
            {!isEnglish(a.language) && (
              <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300">{a.language}</span>
            )}
            {a.source_country && <span>· {a.source_country}</span>}
            {a.theme && <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300">{a.theme}</span>}
          </div>
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block font-medium text-white hover:text-emerald-400"
          >
            {a.title}
          </a>
          {a.summary && <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{a.summary}</p>}
          {showCompanies && a.companies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {a.companies.map((c) => (
                <Link
                  key={c.id}
                  to={`/company/${c.id}`}
                  title={c.match_reason}
                  className="rounded bg-emerald-600/15 px-2 py-0.5 text-xs text-emerald-300 hover:bg-emerald-600/25"
                >
                  {c.symbol}
                </Link>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
