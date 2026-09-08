"use client";

import { Flame, Clock, CalendarCheck2, TrendingUp } from "lucide-react";

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
      label: "Current Streak",
      value: `${streak}`,
      unit: streak === 1 ? "day" : "days",
      icon: Flame,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Total Time Logged",
      value: totalHours.toFixed(1),
      unit: "hrs",
      icon: Clock,
      color: "text-zinc-700 dark:text-zinc-300",
      bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700",
    },
    {
      label: "Active Days",
      value: `${daysLogged}`,
      unit: "days",
      icon: CalendarCheck2,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Daily Average",
      value: avgHoursPerDay.toFixed(1),
      unit: "hrs/day",
      icon: TrendingUp,
      color: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 overflow-hidden">
      {stats.map(({ label, value, unit, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="group relative overflow-hidden px-3 py-4 sm:px-4 sm:py-3.5 border-zinc-200/70 dark:border-zinc-800/80 transition-colors duration-200 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 first:border-r last:border-l sm:border-r sm:last:border-l-0"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${bg} ${color}`}
            >
              <Icon className="w-3 h-3 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.14em] truncate">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {value}
            </span>
            {unit && <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
