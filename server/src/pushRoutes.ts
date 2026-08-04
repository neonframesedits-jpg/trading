import { Router } from "express";
import { requireDevice } from "./deviceMiddleware.js";
import { vapidKeys, saveSubscription, removeSubscription, sendPushToDevice } from "./push.js";

export const pushRouter = Router();

pushRouter.get("/public-key", (_req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

pushRouter.use(requireDevice);

pushRouter.post("/subscribe", (req, res) => {
  const { subscription } = req.body ?? {};
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: "Valid push subscription object required" });
  }
  saveSubscription(req.deviceId, subscription);
  res.status(201).json({ ok: true });
});

pushRouter.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body ?? {};
  if (typeof endpoint !== "string") return res.status(400).json({ error: "endpoint required" });
  removeSubscription(endpoint);
  res.status(204).send();
});

pushRouter.post("/test", async (req, res) => {
  await sendPushToDevice(req.deviceId, {
    title: "NEON Invest",
    body: "Notifications are working. We'll nudge you here when it's time to check your goals.",
    url: "/goals",
  });
  res.json({ ok: true });
});
