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
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, unit, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              {label}
            </span>
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${bg} ${color}`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
