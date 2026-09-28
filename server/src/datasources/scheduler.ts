import { refreshAllDataSources } from "./refreshAll.js";
import { refreshGdeltNews, refreshRssNews } from "../news/ingest.js";

// Runs once shortly after startup (so a fresh deploy doesn't wait a full
// day for its first live-data attempt), then on two cadences: prices, FX and
// dividends daily (those pages don't change intraday in ways this app needs
// to react to), news hourly.
export function startDataRefreshScheduler() {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const INITIAL_DELAY = 30_000;

  setTimeout(() => {
    refreshAllDataSources()
      .then((r) => console.log("Initial data refresh:", JSON.stringify(r)))
      .catch((err) => console.error("Initial data refresh failed:", err));

    setInterval(() => {
      refreshAllDataSources().catch((err) => console.error("Scheduled data refresh failed:", err));
    }, DAY);

    setInterval(() => {
      refreshRssNews().catch((err) => console.error("Scheduled RSS refresh failed:", err));
      refreshGdeltNews().catch((err) => console.error("Scheduled GDELT refresh failed:", err));
    }, HOUR);
  }, INITIAL_DELAY);
}
