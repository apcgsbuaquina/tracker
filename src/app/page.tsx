"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, EntryWithTask, DayData, TaskBreakdown } from "@/lib/types";
import { formatDate, calculateStreak } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Heatmap from "@/components/Heatmap";
import StatsBar from "@/components/StatsBar";
import DayEntryModal from "@/components/DayEntryModal";

export default function DashboardPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<EntryWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<string>("all");
  const [isDark, setIsDark] = useState(false);

  // Date range: ~12 months back from today
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date(endDate);
    d.setFullYear(d.getFullYear() - 1);
    // Align to Monday
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    return d;
  }, [endDate]);

  // Dark mode: check system preference on mount, persist manual toggle
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    if (isDark) {
      document.documentElement.style.setProperty("--background", "#0a0a0a");
      document.documentElement.style.setProperty("--foreground", "#ededed");
    } else {
      document.documentElement.style.setProperty("--background", "#ffffff");
      document.documentElement.style.setProperty("--foreground", "#171717");
    }
  }, [isDark]);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const fetchData = useCallback(async () => {
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    try {
      const [tasksRes, entriesRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("entries")
          .select("*, tasks(name, color, emoji)")
          .gte("entry_date", startStr)
          .lte("entry_date", endStr)
          .order("entry_date", { ascending: true }),
      ]);

      setTasks((tasksRes.data as Task[]) ?? []);
      setEntries((entriesRes.data as unknown as EntryWithTask[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard shortcut: Ctrl+L / Cmd+L to open today's entry modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        setSelectedDate(formatDate(new Date()));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build heatmap data: group entries by date
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();

    const filtered =
      filterTaskId === "all"
        ? entries
        : entries.filter((e) => e.task_id === filterTaskId);

    for (const entry of filtered) {
      const existing = map.get(entry.entry_date);
      const meta = Array.isArray(entry.tasks) ? entry.tasks[0] : entry.tasks;
      const breakdown: TaskBreakdown = {
        taskId: entry.task_id,
        name: meta?.name ?? "Unknown task",
        color: meta?.color ?? "#22c55e",
        emoji: meta?.emoji ?? null,
        hours: Number(entry.hours),
        note: entry.note,
      };

      if (existing) {
        existing.totalHours += Number(entry.hours);
        existing.breakdown.push(breakdown);
      } else {
        map.set(entry.entry_date, {
          date: entry.entry_date,
          totalHours: Number(entry.hours),
          breakdown: [breakdown],
        });
      }
    }

    return map;
  }, [entries, filterTaskId]);

  // Compute stats
  const stats = useMemo(() => {
    let totalHours = 0;
    let daysLogged = 0;

    for (const [, day] of dayMap) {
      if (day.totalHours > 0) {
        totalHours += day.totalHours;
        daysLogged++;
      }
    }

    const streak = calculateStreak(dayMap);
    const avgHoursPerDay = daysLogged > 0 ? totalHours / daysLogged : 0;

    return { streak, totalHours, daysLogged, avgHoursPerDay };
  }, [dayMap]);

  // Determine the heatmap color: use the filtered task's color, or default green
  const heatmapColor = useMemo(() => {
    if (filterTaskId === "all") return "#22c55e";
    const task = tasks.find((t) => t.id === filterTaskId);
    return task?.color ?? "#22c55e";
  }, [filterTaskId, tasks]);

  // CSV export
  function exportCsv() {
    const filtered =
      filterTaskId === "all"
        ? entries
        : entries.filter((e) => e.task_id === filterTaskId);

    const rows = [["Date", "Task", "Hours", "Note"]];
    for (const e of filtered) {
      const meta = Array.isArray(e.tasks) ? e.tasks[0] : e.tasks;
      rows.push([
        e.entry_date,
        meta?.name ?? "Unknown task",
        String(e.hours),
        e.note ?? "",
      ]);
    }

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-tracker-export-${formatDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeTasks = tasks.filter((t) => !t.is_archived);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar onToggleDarkMode={toggleDarkMode} isDark={isDark} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            Dashboard
          </h1>

          <div className="flex items-center gap-2 sm:ml-auto">
            {/* Task filter */}
            <select
              value={filterTaskId}
              onChange={(e) => setFilterTaskId(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            >
              <option value="all">All tasks</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji ? `${t.emoji} ` : ""}
                  {t.name}
                </option>
              ))}
            </select>

            {/* CSV export */}
            <button
              onClick={exportCsv}
              className="px-3 py-2 text-sm rounded-xl border border-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.04] transition-colors cursor-pointer"
              title="Export CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* Quick-add today */}
            <button
              onClick={() => setSelectedDate(formatDate(new Date()))}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Log today</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <StatsBar
              streak={stats.streak}
              totalHours={stats.totalHours}
              daysLogged={stats.daysLogged}
              avgHoursPerDay={stats.avgHoursPerDay}
            />

            {/* Heatmap */}
            <div className="rounded-2xl border border-[var(--foreground)]/8 bg-[var(--foreground)]/[0.02] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--foreground)]/50">
                  {stats.totalHours > 0
                    ? `${stats.totalHours.toFixed(1)} hours in the last year`
                    : "Click a day to start logging"}
                </p>
                <p className="text-xs text-[var(--foreground)]/30">
                  <kbd className="px-1.5 py-0.5 rounded border border-[var(--foreground)]/10 text-[10px]">
                    Ctrl+L
                  </kbd>{" "}
                  quick-add
                </p>
              </div>
              <Heatmap
                data={dayMap}
                baseColor={heatmapColor}
                startDate={startDate}
                endDate={endDate}
                onDayClick={setSelectedDate}
                isDark={isDark}
              />
            </div>
          </>
        )}
      </main>

      {/* Day entry modal */}
      {selectedDate && (
        <DayEntryModal
          date={selectedDate}
          tasks={tasks}
          onClose={() => setSelectedDate(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
