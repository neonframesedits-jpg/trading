interface Props {
  value: number; // 0-100
  label: string;
  size?: number;
  color?: string;
}

export function ProgressCircle({ value, label, size = 88, color = "#22c55e" }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2a2e3a"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e6e8ef"
          fontSize={size * 0.22}
          fontWeight={600}
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        >
          {Math.round(clamped)}
        </text>
      </svg>
      <span className="text-xs text-center text-neutral-400 max-w-[100px]">{label}</span>
    </div>
  );
}
