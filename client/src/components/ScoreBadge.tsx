export function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

export function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
      style={{ backgroundColor: `${color}22`, color, border: `2px solid ${color}` }}
    >
      {Math.round(score)}
    </div>
  );
}
