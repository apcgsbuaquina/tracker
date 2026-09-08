"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { formatDurationMinutes } from "@/lib/utils";
import TaskIcon, { AVAILABLE_ICONS } from "@/components/TaskIcon";
import { Check, X, Clock, ToggleRight, AlertTriangle } from "lucide-react";

const PRESET_COLORS = [
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#f97316", // Orange
  "#eab308", // Amber
  "#84cc16", // Lime
];

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 },
  { label: "1.5 hr", value: 90 },
  { label: "2 hr", value: 120 },
];

interface TaskFormProps {
  task?: Task | null;
  onSave: (data: {
    name: string;
    color: string;
    emoji: string;
    task_type: "time" | "boolean";
    estimated_minutes: number | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [name, setName] = useState(task?.name ?? "");
  const [color, setColor] = useState(task?.color ?? PRESET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(task?.emoji ?? "target");
  const [taskType, setTaskType] = useState<"time" | "boolean">(
    task?.task_type ?? "time"
  );

  const initialDuration = task?.estimated_minutes ?? 30;
  const isInitialCustom = !DURATION_OPTIONS.some(
    (opt) => opt.value === initialDuration
  );

  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(isInitialCustom);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(
    isInitialCustom ? String(initialDuration) : "20"
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(initialDuration);
  const [saving, setSaving] = useState(false);

  // Warn when an existing task is switching types
  const isTypeChange = task != null && task.task_type !== taskType;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const finalMinutes =
      taskType === "boolean"
        ? isCustomDuration
          ? Math.max(1, parseInt(customMinutesInput, 10) || estimatedMinutes || 30)
          : estimatedMinutes
        : null;

    try {
      await onSave({
        name: name.trim(),
        color,
        emoji: selectedIcon,
        task_type: taskType,
        estimated_minutes: finalMinutes,
      });
    } finally {
      setSaving(false);
    }
  }

  const currentEffectiveMinutes = isCustomDuration
    ? parseInt(customMinutesInput, 10) || estimatedMinutes || 30
    : estimatedMinutes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {task ? "Edit Habit" : "Create New Habit"}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Configure routine type, target metrics, and custom appearance.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Two-column layout on medium screens and up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-start">
            {/* Left Column: Core Setup & Tracking Mode */}
            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="task-name"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  Habit Name
                </label>
                <input
                  id="task-name"
                  type="text"
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Deep Work, Workout, Reading"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  autoFocus
                />
              </div>

              {/* Tracking Type */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Tracking Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskType("time")}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      taskType === "time"
                        ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        taskType === "time"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          taskType === "time"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        Time-tracked
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Log hours & min
                      </p>
                    </div>
                    {taskType === "time" && (
                      <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0 stroke-[2.5]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskType("boolean")}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      taskType === "boolean"
                        ? "border-violet-500 bg-violet-500/5 dark:bg-violet-500/10"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        taskType === "boolean"
                          ? "bg-violet-500/15 text-violet-500"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <ToggleRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          taskType === "boolean"
                            ? "text-violet-600 dark:text-violet-400"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        Done / Not done
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Simple checkbox
                      </p>
                    </div>
                    {taskType === "boolean" && (
                      <Check className="w-3.5 h-3.5 text-violet-500 ml-auto shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Estimated Duration (boolean only) */}
              {taskType === "boolean" && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Estimated Duration
                    <span className="ml-1 font-normal normal-case text-[11px] text-zinc-500">
                      (for combined grid)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_OPTIONS.map((opt) => {
                      const isSelected =
                        !isCustomDuration && estimatedMinutes === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setIsCustomDuration(false);
                            setEstimatedMinutes(opt.value);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDuration(true);
                        const parsed = parseInt(customMinutesInput, 10);
                        if (!isNaN(parsed) && parsed > 0) {
                          setEstimatedMinutes(parsed);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isCustomDuration
                          ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Custom Duration Input */}
                  {isCustomDuration && (
                    <div className="mt-2 flex items-center gap-2 animate-in fade-in duration-150">
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          value={customMinutesInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMinutesInput(val);
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed) && parsed > 0) {
                              setEstimatedMinutes(parsed);
                            }
                          }}
                          placeholder="e.g. 25"
                          className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-violet-500/40"
                          autoFocus
                        />
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        minutes
                      </span>
                      {parseInt(customMinutesInput, 10) > 0 && (
                        <span className="text-[11px] text-zinc-400">
                          (≈ {formatDurationMinutes(parseInt(customMinutesInput, 10))})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Type-change warning */}
              {isTypeChange && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-amber-300/70 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-950/20 animate-in fade-in duration-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                    Switching type affects how logged data displays. Existing
                    records are kept intact.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Appearance & Live Preview */}
            <div className="space-y-4">
              {/* Live Preview Card */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Habit Preview
                </label>
                <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all"
                    style={{
                      backgroundColor: `${color}18`,
                      color: color,
                      border: `1.5px solid ${color}35`,
                    }}
                  >
                    <TaskIcon name={selectedIcon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {name.trim() || "Habit Name"}
                      </p>
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          taskType === "boolean"
                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {taskType === "boolean"
                          ? `✓ Done/No · ${formatDurationMinutes(currentEffectiveMinutes)}`
                          : "⏱ Time"}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      Ready for daily logging
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Theme Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = color.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white drop-shadow-sm stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Select Icon
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-32 overflow-y-auto p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                  {AVAILABLE_ICONS.map((item) => {
                    const isSelected = selectedIcon === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedIcon(item.id)}
                        title={item.label}
                        className={`aspect-square rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm scale-105"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? "Saving..." : task ? "Update Habit" : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
