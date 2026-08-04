export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
      <span className="font-semibold">Note: </span>
      {text}
    </div>
  );
}
