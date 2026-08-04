export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="neon-grad" x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path
          d="M6 32L16 18L23 26L34 8"
          stroke="url(#neon-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(34,197,94,0.7))" }}
        />
        <path d="M26 8H34V16" stroke="url(#neon-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withWordmark && (
        <span className="text-lg font-bold tracking-tight text-white">
          NEON <span className="text-emerald-400" style={{ textShadow: "0 0 12px rgba(34,197,94,0.6)" }}>Invest</span>
        </span>
      )}
    </div>
  );
}
