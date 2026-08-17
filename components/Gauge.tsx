"use client";

type GaugeProps = {
  label: string;
  value: number;
  accent?: string;
};

export function Gauge({ label, value, accent = "#5CB8FF" }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = 28;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 80 80" className="h-20 w-20">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 40 40)"
        />
        <text
          x="40"
          y="45"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontFamily="var(--font-outfit)"
        >
          {clamped}
        </text>
      </svg>
      <span className="text-[11px] uppercase tracking-[0.16em] text-white/55">
        {label}
      </span>
    </div>
  );
}
