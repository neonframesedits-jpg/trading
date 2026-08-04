import { db } from "./db.js";

interface GoalRow {
  updated_at: string;
}

export function deviceNeedsCheckin(deviceId: string): { shouldPrompt: boolean; reason?: "no-goals" | "stale-goal" } {
  const device = db.prepare("SELECT last_prompted_at FROM devices WHERE id = ?").get(deviceId) as
    | { last_prompted_at: string | null }
    | undefined;

  const dayMs = 24 * 60 * 60 * 1000;
  const lastPrompted = device?.last_prompted_at ? new Date(device.last_prompted_at) : null;
  if (lastPrompted && Date.now() - lastPrompted.getTime() < dayMs) {
    return { shouldPrompt: false };
  }

  const goals = db
    .prepare("SELECT updated_at FROM goals WHERE device_id = ? ORDER BY updated_at DESC LIMIT 1")
    .all(deviceId) as GoalRow[];

  if (goals.length === 0) return { shouldPrompt: true, reason: "no-goals" };

  const staleMs = 7 * dayMs;
  if (Date.now() - new Date(goals[0].updated_at).getTime() > staleMs) {
    return { shouldPrompt: true, reason: "stale-goal" };
  }

  return { shouldPrompt: false };
}

export function markPrompted(deviceId: string) {
  db.prepare("UPDATE devices SET last_prompted_at = ? WHERE id = ?").run(new Date().toISOString(), deviceId);
}
