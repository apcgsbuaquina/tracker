"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, EntryWithTask, DayData, TaskBreakdown } from "@/lib/types";
import {
  formatDate,
  calculateStreak,
  type Thresholds,
  DEFAULT_THRESHOLDS,
} from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Heatmap from "@/components/Heatmap";
import StatsBar from "@/components/StatsBar";
import DayEntryModal from "@/components/DayEntryModal";
import ThresholdsModal from "@/components/ThresholdsModal";
import {
  Download,
  Plus,
  Filter,
  Command,
  Sliders,
} from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<EntryWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<string>("all");
  const [isDark, setIsDark] = useState(false);
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [thresholdsMap, setThresholdsMap] = useState<Record<string, Thresholds>>({
    all: DEFAULT_THRESHOLDS,
  });

  // Date range: ~12 months back from today
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date(endDate);
    d.setFullYear(d.getFullYear() - 1);
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    return d;
  }, [endDate]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    const storedThresholds = localStorage.getItem("tracker_thresholds");
    if (storedThresholds) {
      try {
        setThresholdsMap(JSON.parse(storedThresholds));
      } catch {
        // use default
      }
    }
  }, []);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  function handleSaveThresholds(taskId: string, newThresholds: Thresholds) {
    setThresholdsMap((prev) => {
      const updated = { ...prev, [taskId]: newThresholds };
      localStorage.setItem("tracker_thresholds", JSON.stringify(updated));
      return updated;
    });
  }

  const activeThresholds: Thresholds = useMemo(() => {
    return (
      thresholdsMap[filterTaskId] ||
      thresholdsMap["all"] ||
      DEFAULT_THRESHOLDS
    );
  }, [thresholdsMap, filterTaskId]);

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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setSelectedDate(formatDate(new Date()));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build heatmap data
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
        name: meta?.name ?? "Habit",
        color: meta?.color ?? "#10b981",
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

  // Determine heatmap active color
  const heatmapColor = useMemo(() => {
    if (filterTaskId === "all") return "#10b981";
    const task = tasks.find((t) => t.id === filterTaskId);
    return task?.color ?? "#10b981";
  }, [filterTaskId, tasks]);

  // CSV export
  function exportCsv() {
    const filtered =
      filterTaskId === "all"
        ? entries
        : entries.filter((e) => e.task_id === filterTaskId);

    const rows = [["Date", "Habit", "Hours", "Note"]];
    for (const e of filtered) {
      const meta = Array.isArray(e.tasks) ? e.tasks[0] : e.tasks;
      rows.push([
        e.entry_date,
        meta?.name ?? "Habit",
        String(e.hours),
        e.note ?? "",
      ]);
    }

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-pulse-export-${formatDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeTasks = tasks.filter((t) => !t.is_archived);

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar onToggleDarkMode={toggleDarkMode} isDark={isDark} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Overview
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Annual consistency grid and habit performance metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterTaskId}
                onChange={(e) => setFilterTaskId(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/40 cursor-pointer shadow-xs transition-colors"
              >
                <option value="all">All Habits Combined</option>
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Customize Scale Button */}
            <button
              onClick={() => setShowThresholdsModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors shadow-xs cursor-pointer"
              title="Customize shade intensity thresholds"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Color Scale</span>
            </button>

            {/* CSV Export Button */}
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors shadow-xs cursor-pointer"
              title="Export CSV history"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Log Today Button */}
            <button
              onClick={() => setSelectedDate(formatDate(new Date()))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Today</span>
              <span className="hidden md:inline-flex items-center ml-1 text-[10px] opacity-70 px-1 py-0.5 rounded bg-white/20 dark:bg-black/20">
                Ctrl+L
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
            <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-xs font-medium">Synchronizing habits...</span>
          </div>
        ) : (
          <>
            {/* Stats Metrics Grid */}
            <StatsBar
              streak={stats.streak}
              totalHours={stats.totalHours}
              daysLogged={stats.daysLogged}
              avgHoursPerDay={stats.avgHoursPerDay}
            />

            {/* Heatmap Card */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: heatmapColor }}
                  />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {filterTaskId === "all"
                      ? "Combined Activity"
                      : activeTasks.find((t) => t.id === filterTaskId)?.name ?? "Selected Habit"}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    · {stats.totalHours.toFixed(1)} hrs logged
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="hidden sm:inline">Quick log:</span>
                  <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[10px] font-mono">
                    <Command className="w-2.5 h-2.5" />L
                  </kbd>
                </div>
              </div>

              <Heatmap
                data={dayMap}
                baseColor={heatmapColor}
                startDate={startDate}
                endDate={endDate}
                onDayClick={setSelectedDate}
                isDark={isDark}
                thresholds={activeThresholds}
                onOpenThresholds={() => setShowThresholdsModal(true)}
              />
            </div>
          </>
        )}
      </main>

      {/* Day Entry Modal (Log, Edit, Delete) */}
      {selectedDate && (
        <DayEntryModal
          date={selectedDate}
          tasks={tasks}
          onClose={() => setSelectedDate(null)}
          onSaved={fetchData}
        />
      )}

      {/* Thresholds / Color Scale Modal */}
      {showThresholdsModal && (
        <ThresholdsModal
          tasks={tasks}
          activeTaskId={filterTaskId}
          thresholdsMap={thresholdsMap}
          onSave={handleSaveThresholds}
          onClose={() => setShowThresholdsModal(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
