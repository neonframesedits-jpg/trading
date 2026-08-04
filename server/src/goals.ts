import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { requireDevice } from "./deviceMiddleware.js";
import { deviceNeedsCheckin, markPrompted } from "./checkin.js";

export const goalsRouter = Router();
goalsRouter.use(requireDevice);

interface GoalRow {
  id: string;
  device_id: string;
  name: string;
  category: string;
  target_amount: number;
  target_date: string | null;
  committed_amount: number;
  created_at: string;
  updated_at: string;
}

function withProgress(g: GoalRow) {
  const progressPct = g.target_amount > 0 ? Math.min(100, (g.committed_amount / g.target_amount) * 100) : 0;
  return { ...g, progressPct: Math.round(progressPct * 10) / 10 };
}

goalsRouter.get("/", (req, res) => {
  const goals = db
    .prepare("SELECT * FROM goals WHERE device_id = ? ORDER BY created_at DESC")
    .all(req.deviceId) as GoalRow[];
  res.json({ goals: goals.map(withProgress) });
});

goalsRouter.post("/", (req, res) => {
  const { name, category, targetAmount, targetDate } = req.body ?? {};
  if (typeof name !== "string" || !name.trim() || typeof targetAmount !== "number" || targetAmount <= 0) {
    return res.status(400).json({ error: "name (string) and targetAmount (positive number) are required" });
  }
  const now = new Date().toISOString();
  const goal: GoalRow = {
    id: randomUUID(),
    device_id: req.deviceId,
    name: name.trim(),
    category: typeof category === "string" && category.trim() ? category.trim() : "custom",
    target_amount: targetAmount,
    target_date: typeof targetDate === "string" && targetDate ? targetDate : null,
    committed_amount: 0,
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO goals (id, device_id, name, category, target_amount, target_date, committed_amount, created_at, updated_at)
    VALUES (@id, @device_id, @name, @category, @target_amount, @target_date, @committed_amount, @created_at, @updated_at)
  `).run(goal);
  res.status(201).json({ goal: withProgress(goal) });
});

goalsRouter.post("/:id/contribute", (req, res) => {
  const goal = db
    .prepare("SELECT * FROM goals WHERE id = ? AND device_id = ?")
    .get(req.params.id, req.deviceId) as GoalRow | undefined;
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  const { amount, companySymbol, note } = req.body ?? {};
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "amount (positive number) is required" });
  }

  const now = new Date().toISOString();
  const newCommitted = goal.committed_amount + amount;

  db.prepare("UPDATE goals SET committed_amount = ?, updated_at = ? WHERE id = ?").run(newCommitted, now, goal.id);
  db.prepare(`
    INSERT INTO goal_contributions (goal_id, amount, company_symbol, note, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(goal.id, amount, typeof companySymbol === "string" ? companySymbol : null, typeof note === "string" ? note : null, now);

  const updated = { ...goal, committed_amount: newCommitted, updated_at: now };
  const wasBelow100 = (goal.committed_amount / goal.target_amount) * 100 < 100;
  const isAtOrAbove100 = (newCommitted / goal.target_amount) * 100 >= 100;

  res.json({
    goal: withProgress(updated),
    justCompleted: wasBelow100 && isAtOrAbove100,
  });
});

goalsRouter.delete("/:id", (req, res) => {
  const goal = db.prepare("SELECT id FROM goals WHERE id = ? AND device_id = ?").get(req.params.id, req.deviceId);
  if (!goal) return res.status(404).json({ error: "Goal not found" });
  db.prepare("DELETE FROM goal_contributions WHERE goal_id = ?").run(req.params.id);
  db.prepare("DELETE FROM goals WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

goalsRouter.get("/checkin", (req, res) => {
  res.json(deviceNeedsCheckin(req.deviceId));
});

goalsRouter.post("/checkin/dismiss", (req, res) => {
  markPrompted(req.deviceId);
  res.status(204).send();
});
