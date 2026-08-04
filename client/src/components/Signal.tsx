import type { ScoredCompany } from "../api";

interface SignalInfo {
  tone: "positive" | "neutral" | "caution";
  headline: string;
  points: string[];
}

export function buildSignal(c: ScoredCompany): SignalInfo {
  const points: string[] = [];
  let tone: SignalInfo["tone"] = "neutral";
  let headline = "Mixed picture — worth a closer look";

  if (c.score >= 70 && c.flags.length === 0) {
    tone = "positive";
    headline = "Strong on the metrics this screener tracks";
  } else if (c.score < 35 || c.flags.length >= 2) {
    tone = "caution";
    headline = "Several red flags worth investigating before buying";
  }

  if (c.yieldScore >= 70) points.push("Dividend yield is high relative to the rest of this dataset.");
  if (c.consistencyScore >= 70) points.push("Dividend has been paid consistently, without recent cuts.");
  if (c.consistencyScore < 40) points.push("Dividend history is inconsistent — check for recent cuts before relying on this income.");
  if (c.payoutScore >= 70) points.push("Payout ratio looks sustainable relative to earnings.");
  if (c.payoutScore < 40) points.push("Payout ratio is stretched thin against earnings — a downturn could force a dividend cut.");
  if (c.leverageScore < 30) points.push("Debt load is relatively high compared to peers, adding financial risk.");
  if (c.profitabilityScore >= 70) points.push("Return on equity is strong relative to peers.");
  for (const f of c.flags) points.push(f);

  if (points.length === 0) points.push("No standout strengths or weaknesses versus the rest of this dataset.");

  return { tone, headline, points };
}

const toneStyles: Record<SignalInfo["tone"], string> = {
  positive: "border-emerald-700/40 bg-emerald-950/30 text-emerald-200",
  neutral: "border-neutral-700/40 bg-neutral-900 text-neutral-200",
  caution: "border-red-700/40 bg-red-950/30 text-red-200",
};

export function SignalCard({ company }: { company: ScoredCompany }) {
  const signal = buildSignal(company);
  return (
    <div className={`rounded-xl border p-4 ${toneStyles[signal.tone]}`}>
      <h3 className="font-semibold">{signal.headline}</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm opacity-90">
        {signal.points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs opacity-70">
        This is an informational signal generated from historical fundamentals, not a recommendation to buy or sell. Markets are unpredictable — verify current data before acting.
      </p>
    </div>
  );
}
