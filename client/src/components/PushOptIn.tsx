import { useEffect, useState } from "react";
import { enablePushNotifications, getPushPermissionState, pushSupported, sendTestPush } from "../push";

export function PushOptIn() {
  const [state, setState] = useState<NotificationPermission | "unsupported" | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    getPushPermissionState().then(setState);
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    const result = await enablePushNotifications();
    setBusy(false);
    if (result.ok) {
      setState("granted");
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  async function test() {
    await sendTestPush();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  }

  if (!pushSupported() || state === "unsupported") {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
        This browser doesn't support push notifications. On iPhone, add NEON Invest to your Home Screen first (Share →
        Add to Home Screen), then notifications become available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="font-semibold text-white">Goal check-in notifications</h3>
      <p className="mt-1 text-sm text-neutral-400">
        Get a nudge on this device when it's time to check your goals — not spam, roughly weekly at most.
      </p>

      {state === "granted" ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-emerald-400">Notifications enabled</span>
          <button onClick={test} className="text-sm text-neutral-400 underline hover:text-white">
            Send test notification
          </button>
          {testSent && <span className="text-xs text-neutral-500">Sent — check your notifications.</span>}
        </div>
      ) : state === "denied" ? (
        <p className="mt-3 text-sm text-amber-400">
          Notifications are blocked for this site. Enable them in your browser's site settings to turn this on.
        </p>
      ) : (
        <button
          onClick={enable}
          disabled={busy}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Enabling…" : "Enable notifications"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
