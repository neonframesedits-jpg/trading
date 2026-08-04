import { db } from "./db.js";
import { deviceNeedsCheckin, markPrompted } from "./checkin.js";
import { sendPushToDevice } from "./push.js";

const PROMPTS = [
  "What are you investing toward this week? Pick or update a goal.",
  "Quick check-in: still working on that goal? Log some progress.",
  "Haven't set a target yet — a car, land, business capital? Takes 30 seconds.",
];

async function runCheckinSweep() {
  const deviceIds = db
    .prepare("SELECT DISTINCT device_id FROM push_subscriptions")
    .all() as { device_id: string }[];

  for (const { device_id } of deviceIds) {
    const { shouldPrompt } = deviceNeedsCheckin(device_id);
    if (!shouldPrompt) continue;

    const body = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    await sendPushToDevice(device_id, { title: "NEON Invest", body, url: "/goals" });
    markPrompted(device_id);
  }
}

export function startScheduler() {
  const HOUR = 60 * 60 * 1000;
  setInterval(() => {
    runCheckinSweep().catch((err) => console.error("Checkin sweep failed:", err));
  }, HOUR);
}
