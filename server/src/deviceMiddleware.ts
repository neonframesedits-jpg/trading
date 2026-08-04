import type { NextFunction, Request, Response } from "express";
import { db } from "./db.js";

declare global {
  namespace Express {
    interface Request {
      deviceId: string;
    }
  }
}

const upsertDevice = db.prepare(`
  INSERT INTO devices (id, created_at) VALUES (?, ?)
  ON CONFLICT(id) DO NOTHING
`);

export function requireDevice(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header("x-device-id");
  if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8) {
    return res.status(400).json({ error: "Missing X-Device-Id header" });
  }
  upsertDevice.run(deviceId, new Date().toISOString());
  req.deviceId = deviceId;
  next();
}
