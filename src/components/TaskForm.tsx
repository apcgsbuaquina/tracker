"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";

const PRESET_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
];

interface TaskFormProps {
  task?: Task | null;
  onSave: (data: { name: string; color: string; emoji: string }) => Promise<void>;
  onCancel: () => void;
}

export default function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [name, setName] = useState(task?.name ?? "");
  const [color, setColor] = useState(task?.color ?? PRESET_COLORS[0]);
  const [emoji, setEmoji] = useState(task?.emoji ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name: name.trim(), color, emoji: emoji.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-5">
          {task ? "Edit task" : "New task"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="task-name"
              className="block text-sm font-medium text-[var(--foreground)]/70 mb-1.5"
            >
              Name
            </label>
            <input
              id="task-name"
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reading, Gym, Coding"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.02] text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
              autoFocus
            />
          </div>

          {/* Emoji */}
          <div>
            <label
              htmlFor="task-emoji"
              className="block text-sm font-medium text-[var(--foreground)]/70 mb-1.5"
            >
              Emoji (optional)
            </label>
            <input
              id="task-emoji"
              type="text"
              maxLength={4}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="📚"
              className="w-20 px-3.5 py-2.5 rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.02] text-[var(--foreground)] text-center text-lg placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]/70 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all cursor-pointer ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-[var(--background)] ring-[var(--foreground)]/30 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-[var(--foreground)]/10 text-[var(--foreground)]/70 font-medium hover:bg-[var(--foreground)]/[0.04] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
