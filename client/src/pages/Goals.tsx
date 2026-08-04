import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteGoal, fetchGoals, formatNaira, type Goal } from "../api";
import { GoalCard } from "../components/GoalCard";
import { GoalCreateModal } from "../components/GoalCreateModal";
import { PushOptIn } from "../components/PushOptIn";

export function Goals() {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    fetchGoals().then((r) => setGoals(r.goals));
  }, []);

  useEffect(() => {
    if (params.get("create") === "1") {
      setShowCreate(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  async function handleDelete(id: string) {
    setGoals((g) => g?.filter((goal) => goal.id !== id) ?? null);
    await deleteGoal(id);
  }

  const totalCommitted = goals?.reduce((sum, g) => sum + g.committed_amount, 0) ?? 0;
  const totalTarget = goals?.reduce((sum, g) => sum + g.target_amount, 0) ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Your goals</h1>
          <p className="mt-1 text-neutral-400">
            Turn "invest more" into something concrete. Commit an amount from any company's calculator toward one of these.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + New goal
        </button>
      </div>

      {goals && goals.length > 0 && (
        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
          Across all goals: <span className="font-semibold text-white">{formatNaira(totalCommitted)}</span> committed
          toward <span className="font-semibold text-white">{formatNaira(totalTarget)}</span> in targets.
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {goals === null && <p className="text-neutral-400">Loading…</p>}
        {goals?.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center text-neutral-400">
            No goals yet. Set one — a land down payment, a car, business capital — and see how each investment moves the
            needle.
          </div>
        )}
        {goals?.map((g) => (
          <GoalCard key={g.id} goal={g} onDelete={handleDelete} />
        ))}
      </div>

      <div className="mt-8">
        <PushOptIn />
      </div>

      {showCreate && (
        <GoalCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(goal) => {
            setGoals((g) => [goal, ...(g ?? [])]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
