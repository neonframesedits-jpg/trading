import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { contributeToGoal, fetchGoals, fetchProjection, formatNaira, formatPercent, type Goal, type ProjectionResult } from "../api";

const PRESETS = [50000, 100000, 500000, 1000000];

export function InvestmentCalculator({ companyId }: { companyId: string }) {
  const [amount, setAmount] = useState(100000);
  const [years, setYears] = useState(5);
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{ goalName: string; progressPct: number; justCompleted: boolean } | null>(null);

  useEffect(() => {
    fetchGoals()
      .then((r) => {
        setGoals(r.goals);
        if (r.goals.length > 0) setSelectedGoalId(r.goals[0].id);
      })
      .catch(() => {});
  }, []);

  async function commitToGoal() {
    if (!result || !selectedGoalId) return;
    setCommitting(true);
    setCommitResult(null);
    try {
      const { goal, justCompleted } = await contributeToGoal(selectedGoalId, {
        amount: result.amount,
        companySymbol: result.company.symbol,
      });
      setCommitResult({ goalName: goal.name, progressPct: goal.progressPct, justCompleted });
      setGoals((gs) => gs?.map((g) => (g.id === goal.id ? goal : g)) ?? null);
    } catch {
      setError("Couldn't commit to that goal — try again.");
    } finally {
      setCommitting(false);
    }
  }

  async function run(nextAmount = amount, nextYears = years) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchProjection(companyId, nextAmount, nextYears);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to calculate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h3 className="text-lg font-semibold text-white">If I invest…</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setAmount(p);
              run(p, years);
            }}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              amount === p ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
          >
            {formatNaira(p)}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm text-neutral-400">
          Custom amount (₦)
          <input
            type="number"
            min={1000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-40 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-white outline-none focus:border-emerald-600"
          />
        </label>
        <label className="flex flex-col text-sm text-neutral-400">
          Time frame
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-white outline-none focus:border-emerald-600"
          >
            {[1, 3, 5, 10].map((y) => (
              <option key={y} value={y}>
                {y} year{y > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => run()}
          disabled={loading || amount <= 0}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Calculating…" : "Calculate"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Shares bought" value={result.shares.toLocaleString()} />
            <Stat label="Leftover cash" value={formatNaira(result.leftoverCash)} />
            <Stat label="Est. yield range" value={`${formatPercent(result.minYield)} – ${formatPercent(result.maxYield)}`} />
            <Stat label={`Yr 1 dividend income`} value={formatNaira(result.projectedAnnualIncomeExpected)} sub={`${formatNaira(result.projectedAnnualIncomeLow)} – ${formatNaira(result.projectedAnnualIncomeHigh)}`} />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer>
              <ComposedChart data={result.projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" />
                <XAxis dataKey="year" stroke="#8a8f9c" tickFormatter={(y) => `Yr ${y}`} />
                <YAxis stroke="#8a8f9c" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#16171d", border: "1px solid #2a2e3a", borderRadius: 8 }}
                  formatter={(value) => formatNaira(Number(value))}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Area type="monotone" dataKey="cumulativeHigh" stroke="none" fill="#22c55e" fillOpacity={0.08} />
                <Area type="monotone" dataKey="cumulativeLow" stroke="none" fill="#0b0e14" fillOpacity={1} />
                <Line type="monotone" dataKey="cumulativeExpected" stroke="#22c55e" strokeWidth={2} dot />
                <Line type="monotone" dataKey="cumulativeLow" stroke="#4b5563" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="cumulativeHigh" stroke="#4b5563" strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-neutral-500">
            Green line: cumulative dividend income at the historical average yield. Dashed lines: low/high range based on this company's actual yield history. Share-price gains or losses are not included.
          </p>

          <ul className="space-y-1.5 text-sm text-neutral-300">
            {result.tips.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-500">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            {goals && goals.length > 0 ? (
              <>
                <p className="text-sm text-neutral-300">Put this {formatNaira(result.amount)} toward a goal:</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-600"
                  >
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.progressPct.toFixed(0)}%)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={commitToGoal}
                    disabled={committing}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {committing ? "Committing…" : "Commit"}
                  </button>
                </div>
                {commitResult && (
                  <p className="mt-3 text-sm font-medium text-emerald-400">
                    {commitResult.justCompleted
                      ? `Goal reached — "${commitResult.goalName}" is fully funded.`
                      : `Nice — "${commitResult.goalName}" is now ${commitResult.progressPct.toFixed(1)}% funded.`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-400">
                <Link to="/goals" className="text-emerald-400 underline">
                  Set a goal
                </Link>{" "}
                to see how this investment moves you toward something concrete — a down payment, a car, business capital.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-neutral-950 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-base font-semibold text-white">{value}</div>
      {sub && <div className="text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}
