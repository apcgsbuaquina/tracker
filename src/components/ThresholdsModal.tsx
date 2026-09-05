"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import {
  type Thresholds,
  DEFAULT_THRESHOLDS,
  intensityColor,
} from "@/lib/utils";
import { Sliders, X, Check, RotateCcw } from "lucide-react";

interface ThresholdsModalProps {
  tasks: Task[];
  activeTaskId: string; // 'all' or specific task ID
  thresholdsMap: Record<string, Thresholds>;
  onSave: (taskId: string, thresholds: Thresholds) => void;
  onClose: () => void;
  isDark: boolean;
}

const PRESETS: { label: string; values: Thresholds }[] = [
  { label: "Light (0.25h / 0.5h / 1h)", values: [0.25, 0.5, 1] },
  { label: "Standard (1h / 2h / 4h)", values: [1, 2, 4] },
  { label: "Deep Focus (2h / 4h / 6h)", values: [2, 4, 6] },
];

export default function ThresholdsModal({
  tasks,
  activeTaskId,
  thresholdsMap,
  onSave,
  onClose,
  isDark,
}: ThresholdsModalProps) {
  const [selectedTask, setSelectedTask] = useState<string>(activeTaskId);

  // Get current thresholds for the selected task, or fallback to 'all', or default
  const current =
    thresholdsMap[selectedTask] ||
    thresholdsMap["all"] ||
    DEFAULT_THRESHOLDS;

  const [t1, setT1] = useState<string>(String(current[0]));
  const [t2, setT2] = useState<string>(String(current[1]));
  const [t3, setT3] = useState<string>(String(current[2]));

  // Change task selection
  function handleSelectTask(id: string) {
    setSelectedTask(id);
    const target =
      thresholdsMap[id] || thresholdsMap["all"] || DEFAULT_THRESHOLDS;
    setT1(String(target[0]));
    setT2(String(target[1]));
    setT3(String(target[2]));
  }

  function applyPreset(values: Thresholds) {
    setT1(String(values[0]));
    setT2(String(values[1]));
    setT3(String(values[2]));
  }

  function handleReset() {
    applyPreset(DEFAULT_THRESHOLDS);
  }

  function handleSave() {
    const v1 = Math.max(0.1, parseFloat(t1) || 1);
    const v2 = Math.max(v1 + 0.1, parseFloat(t2) || v1 + 1);
    const v3 = Math.max(v2 + 0.1, parseFloat(t3) || v2 + 1);

    onSave(selectedTask, [v1, v2, v3]);
    onClose();
  }

  const taskObj = tasks.find((t) => t.id === selectedTask);
  const baseColor = taskObj?.color || "#10b981";

  const num1 = parseFloat(t1) || 1;
  const num2 = parseFloat(t2) || 2;
  const num3 = parseFloat(t3) || 4;

  const levels = [
    {
      level: 0,
      name: "Empty",
      hours: "0 hrs",
      bucket: 0 as const,
    },
    {
      level: 1,
      name: "Lightest",
      hours: `> 0h to < ${num1}h`,
      bucket: 1 as const,
    },
    {
      level: 2,
      name: "Light",
      hours: `≥ ${num1}h to < ${num2}h`,
      bucket: 2 as const,
    },
    {
      level: 3,
      name: "Medium",
      hours: `≥ ${num2}h to < ${num3}h`,
      bucket: 3 as const,
    },
    {
      level: 4,
      name: "Intense",
      hours: `≥ ${num3}h`,
      bucket: 4 as const,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Heatmap Color Scale
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Set hours required for each color shade intensity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Target Task Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Customize For
            </label>
            <select
              value={selectedTask}
              onChange={(e) => handleSelectTask(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
            >
              <option value="all">All Habits (Default)</option>
              {tasks
                .filter((t) => !t.is_archived)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.values)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Shade Preview & Threshold Inputs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Color Intensity Thresholds
            </label>
            <div className="space-y-2 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60">
              {levels.map((lvl) => (
                <div
                  key={lvl.level}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-[3.5px] border border-black/10 dark:border-white/10 shrink-0"
                      style={{
                        backgroundColor: intensityColor(
                          lvl.bucket,
                          baseColor,
                          isDark
                        ),
                      }}
                    />
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {lvl.name}
                    </span>
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                    {lvl.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Numerical Inputs */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Level 2 (hrs)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.25"
                value={t1}
                onChange={(e) => setT1(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Level 3 (hrs)
              </label>
              <input
                type="number"
                min="0.2"
                step="0.25"
                value={t2}
                onChange={(e) => setT2(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Level 4 (hrs)
              </label>
              <input
                type="number"
                min="0.3"
                step="0.25"
                value={t3}
                onChange={(e) => setT3(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Reset to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save Thresholds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
