import { useEffect, useState } from "react";
import { fetchNews, type NewsArticle } from "../api";
import { NewsList } from "../components/NewsList";

const ALL = "All";
const TRACKED = "Tracked companies";

export function News() {
  const [themes, setThemes] = useState<string[]>([]);
  const [filter, setFilter] = useState(ALL);
  const [articles, setArticles] = useState<NewsArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setArticles(null);
    fetchNews(filter === TRACKED ? { linkedOnly: true } : filter === ALL ? {} : { theme: filter })
      .then((r) => {
        setThemes(r.themes);
        setArticles(r.articles);
      })
      .catch((e) => setError(e.message));
  }, [filter]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">News & opportunities</h1>
      <p className="mt-1 text-neutral-400">
        Collected hourly from Nigerian and international outlets, plus searches for contract awards, investment deals and
        M&A involving Nigeria, including foreign-language coverage.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Companies are tagged by name matching, not yet by AI analysis — a tag means the article mentions the company, not
        that it's material to its share price. Treat anything from an unverified source as a lead to check, not a fact.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {[ALL, TRACKED, ...themes].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              filter === t ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {error && <p className="text-sm text-red-400">Failed to load: {error}</p>}
        {!error && !articles && <p className="text-neutral-400">Loading…</p>}
        {articles && (
          <NewsList
            articles={articles}
            emptyText="No articles yet. News is collected hourly once the app is deployed somewhere with internet access — check the Data status page if this stays empty."
          />
        )}
      </div>
    </div>
  );
}
