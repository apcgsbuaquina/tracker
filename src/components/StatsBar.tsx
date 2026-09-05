"use client";

interface StatsBarProps {
  streak: number;
  totalHours: number;
  daysLogged: number;
  avgHoursPerDay: number;
}

export default function StatsBar({
  streak,
  totalHours,
  daysLogged,
  avgHoursPerDay,
}: StatsBarProps) {
  const stats = [
    {
      label: "Current streak",
      value: `${streak}`,
      unit: streak === 1 ? "day" : "days",
      icon: "🔥",
    },
    {
      label: "Total hours",
      value: totalHours.toFixed(1),
      unit: "hrs",
      icon: "⏱️",
    },
    {
      label: "Days logged",
      value: `${daysLogged}`,
      unit: "",
      icon: "📅",
    },
    {
      label: "Daily average",
      value: avgHoursPerDay.toFixed(1),
      unit: "hrs/day",
      icon: "📊",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, unit, icon }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--foreground)]/8 bg-[var(--foreground)]/[0.02] px-4 py-3 hover:border-[var(--foreground)]/12 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{icon}</span>
            <span className="text-[11px] font-medium text-[var(--foreground)]/45 uppercase tracking-wide">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[var(--foreground)]">
              {value}
            </span>
            {unit && (
              <span className="text-xs text-[var(--foreground)]/40">
                {unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
