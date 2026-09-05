"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, Entry } from "@/lib/types";
import { parseDate } from "@/lib/utils";

interface DayEntryModalProps {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  onClose: () => void;
  onSaved: () => void;
}

interface EntryDraft {
  taskId: string;
  hours: string;
  note: string;
  existing: boolean; // whether an entry already exists for this day+task
}

export default function DayEntryModal({
  date,
  tasks,
  onClose,
  onSaved,
}: DayEntryModalProps) {
  const supabase = createClient();
  const [drafts, setDrafts] = useState<EntryDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeTasks = tasks.filter((t) => !t.is_archived);

  const fetchExisting = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("entries")
        .select("*")
        .eq("entry_date", date)
        .in(
          "task_id",
          activeTasks.map((t) => t.id)
        );

      const entries = (data as Entry[]) ?? [];
      const entryMap = new Map(entries.map((e) => [e.task_id, e]));

      setDrafts(
        activeTasks.map((t) => {
          const existing = entryMap.get(t.id);
          return {
            taskId: t.id,
            hours: existing ? String(existing.hours) : "",
            note: existing?.note ?? "",
            existing: !!existing,
          };
        })
      );
    } catch (err) {
      console.error("Failed to load existing entries:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, date, activeTasks]);

  useEffect(() => {
    fetchExisting();
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDraft(
    taskId: string,
    field: "hours" | "note",
    value: string
  ) {
    setDrafts((prev) =>
      prev.map((d) => (d.taskId === taskId ? { ...d, [field]: value } : d))
    );
  }

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Build upsert rows — only include entries where hours is filled in
    const rows = drafts
      .filter((d) => d.hours !== "" && parseFloat(d.hours) >= 0)
      .map((d) => ({
        user_id: user.id,
        task_id: d.taskId,
        entry_date: date,
        hours: parseFloat(d.hours),
        note: d.note.trim() || null,
      }));

    // Delete entries that were cleared (had existing data but now empty)
    const toDelete = drafts
      .filter((d) => d.existing && (d.hours === "" || parseFloat(d.hours) === 0))
      .map((d) => d.taskId);

    if (rows.length > 0) {
      await supabase.from("entries").upsert(rows, {
        onConflict: "task_id,entry_date",
      });
    }

    if (toDelete.length > 0) {
      await supabase
        .from("entries")
        .delete()
        .eq("entry_date", date)
        .in("task_id", toDelete);
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  const dateObj = parseDate(date);
  const formatted = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--foreground)]/10 bg-[var(--background)] p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Log hours
            </h2>
            <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
              {formatted}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/50 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : activeTasks.length === 0 ? (
          <p className="text-center text-[var(--foreground)]/40 py-8">
            No active tasks. Create some tasks first.
          </p>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const task = activeTasks.find((t) => t.id === draft.taskId);
              if (!task) return null;

              return (
                <div
                  key={draft.taskId}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[var(--foreground)]/8 hover:border-[var(--foreground)]/12 transition-colors"
                >
                  {/* Task info */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                    style={{ backgroundColor: task.color + "20" }}
                  >
                    {task.emoji || (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: task.color }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {task.name}
                    </span>

                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.25"
                        value={draft.hours}
                        onChange={(e) =>
                          updateDraft(draft.taskId, "hours", e.target.value)
                        }
                        placeholder="0"
                        className="w-20 px-2.5 py-1.5 text-sm rounded-lg border border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.02] text-[var(--foreground)] placeholder:text-[var(--foreground)]/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
                      />
                      <span className="text-xs text-[var(--foreground)]/40">
                        hours
                      </span>
                    </div>

                    <input
                      type="text"
                      value={draft.note}
                      onChange={(e) =>
                        updateDraft(draft.taskId, "note", e.target.value)
                      }
                      placeholder="Note (optional)"
                      maxLength={200}
                      className="w-full mt-1.5 px-2.5 py-1.5 text-sm rounded-lg border border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.02] text-[var(--foreground)] placeholder:text-[var(--foreground)]/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTasks.length > 0 && !loading && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--foreground)]/10 text-[var(--foreground)]/70 font-medium hover:bg-[var(--foreground)]/[0.04] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save all"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
