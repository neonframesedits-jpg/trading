import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dismissCheckin, fetchCheckin } from "../api";

const NO_GOALS_LINES = [
  "What are you investing toward? Pick a goal and watch each investment count toward it.",
  "A land down payment, a car, business capital — what's yours? Set a goal to get started.",
];

const STALE_LINES = [
  "Still working toward your goal? Log some progress and see how close you are.",
  "Quick check-in — anything to add toward your goal this week?",
];

export function CheckinPrompt() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCheckin()
        .then(({ shouldPrompt, reason }) => {
          if (!shouldPrompt) return;
          const lines = reason === "no-goals" ? NO_GOALS_LINES : STALE_LINES;
          setMessage(lines[Math.floor(Math.random() * lines.length)]);
          setVisible(true);
        })
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    dismissCheckin().catch(() => {});
  }

  function goToGoals() {
    setVisible(false);
    dismissCheckin().catch(() => {});
    navigate("/goals?create=1");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex max-w-md items-center gap-3 rounded-xl border border-emerald-700/40 bg-neutral-900 p-4 shadow-lg">
        <p className="flex-1 text-sm text-neutral-200">{message}</p>
        <div className="flex shrink-0 gap-2">
          <button onClick={dismiss} className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white">
            Later
          </button>
          <button
            onClick={goToGoals}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Set a goal
          </button>
        </div>
      </div>
    </div>
  );
}
