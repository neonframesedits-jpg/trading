import { refreshAllDataSources } from "./refreshAll.js";

// Runs once shortly after startup (so a fresh deploy doesn't wait a full
// day for its first live-data attempt), then daily. NGX/CBN pages don't
// change intraday in ways this app needs to react to immediately.
export function startDataRefreshScheduler() {
  const DAY = 24 * 60 * 60 * 1000;
  const INITIAL_DELAY = 30_000;

  setTimeout(() => {
    refreshAllDataSources()
      .then((r) => console.log("Initial data refresh:", JSON.stringify(r)))
      .catch((err) => console.error("Initial data refresh failed:", err));

    setInterval(() => {
      refreshAllDataSources().catch((err) => console.error("Scheduled data refresh failed:", err));
    }, DAY);
  }, INITIAL_DELAY);
}
