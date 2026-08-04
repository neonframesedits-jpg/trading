import { useEffect, useState } from "react";
import { fetchDataStatus, triggerDataRefresh, type DataStatus as DataStatusType } from "../api";
import { Disclaimer } from "../components/Disclaimer";

const SOURCE_LABELS: Record<string, string> = {
  "ngx-prices": "NGX share prices",
  "cbn-fx": "CBN USD/NGN exchange rate",
  "ngx-dividends": "NGX dividend declarations",
};

const STATUS_COLORS: Record<string, string> = {
  success: "text-emerald-400 border-emerald-700/40 bg-emerald-950/30",
  error: "text-red-400 border-red-700/40 bg-red-950/30",
  "no-match": "text-amber-400 border-amber-700/40 bg-amber-950/30",
};

export function DataStatus() {
  const [status, setStatus] = useState<DataStatusType | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetchDataStatus()
      .then(setStatus)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function refreshNow() {
    setRefreshing(true);
    setError(null);
    try {
      await triggerDataRefresh();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Live data status</h1>
      <p className="mt-1 text-neutral-400">
        Where each number in this app actually comes from, and when it was last refreshed.
      </p>

      <div className="mt-4">
        <Disclaimer text="This pipeline was written to fetch NGX's public price list, CBN's exchange rate page, and NGX's corporate-actions page, but could not be tested against the live pages from the environment this app was built in (outbound web access was blocked there). If every source below shows an error or 'no-match', that's expected until someone runs this with real network access and fixes whatever the live page structure doesn't match." />
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {status && (
        <>
          <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
            <span className="font-semibold text-white">{status.liveCompanyCount}</span> of{" "}
            <span className="font-semibold text-white">{status.totalCompanies}</span> companies currently have a
            live-sourced price.
            {status.usdRate && (
              <>
                {" "}
                Latest USD/NGN rate: <span className="font-semibold text-white">₦{status.usdRate.rate.toLocaleString()}</span>{" "}
                (fetched {new Date(status.usdRate.fetchedAt).toLocaleString()}).
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {["ngx-prices", "cbn-fx", "ngx-dividends"].map((source) => {
              const entry = status.sources.find((s) => s.source === source);
              return (
                <div
                  key={source}
                  className={`rounded-xl border p-4 ${entry ? STATUS_COLORS[entry.status] ?? "border-neutral-800 bg-neutral-900 text-neutral-300" : "border-neutral-800 bg-neutral-900 text-neutral-500"}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{SOURCE_LABELS[source] ?? source}</h3>
                    <span className="text-xs uppercase tracking-wide">{entry?.status ?? "never run"}</span>
                  </div>
                  <p className="mt-1 text-sm opacity-90">
                    {entry ? entry.message : "No refresh attempt recorded yet — click \"Refresh now\" below."}
                  </p>
                  {entry && (
                    <p className="mt-1 text-xs opacity-60">
                      Last attempt: {new Date(entry.finished_at).toLocaleString()} · records updated: {entry.records_updated}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={refreshNow}
            disabled={refreshing}
            className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh now"}
          </button>
        </>
      )}
    </div>
  );
}
