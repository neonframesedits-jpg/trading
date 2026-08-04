import webpush from "web-push";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vapidPath = path.join(__dirname, "..", "vapid.json");

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

function loadOrCreateVapidKeys(): VapidKeys {
  if (fs.existsSync(vapidPath)) {
    return JSON.parse(fs.readFileSync(vapidPath, "utf-8"));
  }
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidPath, JSON.stringify(keys, null, 2));
  return keys;
}

export const vapidKeys = loadOrCreateVapidKeys();

webpush.setVapidDetails("mailto:no-reply@neoninvest.local", vapidKeys.publicKey, vapidKeys.privateKey);

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const insertSubscription = db.prepare(`
  INSERT OR REPLACE INTO push_subscriptions (device_id, endpoint, p256dh, auth, created_at)
  VALUES (@device_id, @endpoint, @p256dh, @auth, @created_at)
`);

export function saveSubscription(deviceId: string, sub: PushSubscriptionInput) {
  insertSubscription.run({
    device_id: deviceId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    created_at: new Date().toISOString(),
  });
}

export function removeSubscription(endpoint: string) {
  db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
}

interface DbSubscription {
  id: number;
  device_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushToDevice(deviceId: string, payload: { title: string; body: string; url?: string }) {
  const subs = db.prepare("SELECT * FROM push_subscriptions WHERE device_id = ?").all(deviceId) as DbSubscription[];
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      )
    )
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const err = r.reason as { statusCode?: number };
      if (err.statusCode === 404 || err.statusCode === 410) {
        removeSubscription(subs[i].endpoint);
      }
    }
  });

  return results;
}
