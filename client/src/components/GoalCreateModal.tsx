import { useState } from "react";
import { createGoal, type Goal } from "../api";

const PRESETS = [
  { value: "land", label: "Land / Property", defaultName: "Land down payment" },
  { value: "car", label: "Car", defaultName: "Car" },
  { value: "business", label: "Business capital", defaultName: "Business startup capital" },
  { value: "emergency", label: "Emergency fund", defaultName: "Emergency fund" },
  { value: "education", label: "Education", defaultName: "Tuition / education" },
  { value: "custom", label: "Custom", defaultName: "" },
];

export function GoalCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (goal: Goal) => void }) {
  const [category, setCategory] = useState("land");
  const [name, setName] = useState(PRESETS[0].defaultName);
  const [targetAmount, setTargetAmount] = useState(5000000);
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectCategory(value: string) {
    setCategory(value);
    const preset = PRESETS.find((p) => p.value === value);
    if (preset && (name === "" || PRESETS.some((p) => p.defaultName === name))) {
      setName(preset.defaultName);
    }
  }

  async function submit() {
    if (!name.trim() || targetAmount <= 0) {
      setError("Give your goal a name and a target amount above zero.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { goal } = await createGoal({
        name,
        category,
        targetAmount,
        targetDate: targetDate || undefined,
      });
      onCreated(goal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create goal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">What are you investing toward?</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Pick something concrete — it's easier to stay consistent when there's a real finish line.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => selectCategory(p.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                category === p.value ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm text-neutral-400">
          Goal name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 3-bedroom plot in Lekki"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
          />
        </label>

        <label className="mt-3 block text-sm text-neutral-400">
          Target amount (₦)
          <input
            type="number"
            min={1000}
            step={1000}
            value={targetAmount}
            onChange={(e) => setTargetAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
          />
        </label>

        <label className="mt-3 block text-sm text-neutral-400">
          Target date (optional)
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-600"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:text-white">
            Not now
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Set goal"}
          </button>
        </div>
      </div>
    </div>
  );
}
