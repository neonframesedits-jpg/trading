import { formatNaira, type Goal } from "../api";
import { ProgressCircle } from "./ProgressCircle";
import { scoreColor } from "./ScoreBadge";

const CATEGORY_LABELS: Record<string, string> = {
  land: "Land / Property",
  car: "Car",
  business: "Business capital",
  emergency: "Emergency fund",
  education: "Education",
  custom: "Custom goal",
};

export function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: string) => void }) {
  const remaining = Math.max(0, goal.target_amount - goal.committed_amount);
  const complete = goal.progressPct >= 100;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <ProgressCircle value={goal.progressPct} label="" size={72} color={complete ? "#22c55e" : scoreColor(goal.progressPct)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-base font-semibold text-white">{goal.name}</h3>
          <button onClick={() => onDelete(goal.id)} className="text-xs text-neutral-500 hover:text-red-400">
            Remove
          </button>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="rounded bg-neutral-800 px-2 py-0.5">{CATEGORY_LABELS[goal.category] ?? goal.category}</span>
          <span>
            {formatNaira(goal.committed_amount)} of {formatNaira(goal.target_amount)}
          </span>
          {goal.target_date && <span>by {new Date(goal.target_date).toLocaleDateString("en-NG")}</span>}
        </div>
        <p className="mt-1.5 text-sm">
          {complete ? (
            <span className="font-medium text-emerald-400">Goal reached — nice work.</span>
          ) : (
            <span className="text-neutral-300">{formatNaira(remaining)} to go.</span>
          )}
        </p>
      </div>
    </div>
  );
}

export { CATEGORY_LABELS };
