"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, Entry } from "@/lib/types";
import { parseDate } from "@/lib/utils";
import TaskIcon from "@/components/TaskIcon";
import {
  Calendar,
  X,
  Clock,
  FileText,
  Check,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

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
  existing: boolean;
  markedForDeletion?: boolean;
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
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

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
            markedForDeletion: false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDraft(
    taskId: string,
    field: "hours" | "note",
    value: string
  ) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.taskId === taskId
          ? { ...d, [field]: value, markedForDeletion: false }
          : d
      )
    );
  }

  function addQuickHours(taskId: string, amount: number) {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.taskId !== taskId) return d;
        const current = d.markedForDeletion ? 0 : parseFloat(d.hours) || 0;
        const next = Math.max(0, current + amount);
        return {
          ...d,
          markedForDeletion: false,
          hours: next === 0 ? "" : String(next % 1 === 0 ? next : next.toFixed(2)),
        };
      })
    );
  }

  // Toggle deletion of an individual task entry
  function toggleDeleteEntry(taskId: string) {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.taskId !== taskId) return d;
        if (d.markedForDeletion) {
          // Undo delete
          return { ...d, markedForDeletion: false };
        } else {
          // Mark for deletion and clear hours
          return { ...d, hours: "", note: "", markedForDeletion: true };
        }
      })
    );
  }

  // Delete all entries for this specific day immediately
  async function handleDeleteAllDayEntries() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from("entries").delete().eq("entry_date", date);
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to delete day entries:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Filter valid rows to upsert
    const rows = drafts
      .filter(
        (d) =>
          !d.markedForDeletion &&
          d.hours !== "" &&
          parseFloat(d.hours) > 0
      )
      .map((d) => ({
        user_id: user.id,
        task_id: d.taskId,
        entry_date: date,
        hours: parseFloat(d.hours),
        note: d.note.trim() || null,
      }));

    // Identify rows that need removal
    const toDelete = drafts
      .filter(
        (d) =>
          d.existing &&
          (d.markedForDeletion ||
            d.hours === "" ||
            parseFloat(d.hours) === 0)
      )
      .map((d) => d.taskId);

    try {
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

      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save entries:", err);
    } finally {
      setSaving(false);
    }
  }

  const dateObj = parseDate(date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasAnyExistingEntries = drafts.some((d) => d.existing);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Log, Edit, or Delete Hours
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formattedDate}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-xs">Loading day data...</span>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-xs">
              No active habits found. Create a habit to start logging.
            </div>
          ) : (
            drafts.map((draft) => {
              const task = activeTasks.find((t) => t.id === draft.taskId);
              if (!task) return null;

              const hasHours = parseFloat(draft.hours) > 0;
              const isMarkedDelete = draft.markedForDeletion;

              return (
                <div
                  key={draft.taskId}
                  className={`p-3.5 rounded-xl border transition-all duration-150 ${
                    isMarkedDelete
                      ? "border-rose-300 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 opacity-75"
                      : hasHours
                      ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : "border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${task.color}18`,
                          color: task.color,
                          border: `1px solid ${task.color}35`,
                        }}
                      >
                        <TaskIcon name={task.emoji} className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {task.name}
                        </span>
                        {draft.existing && !isMarkedDelete && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Logged
                          </span>
                        )}
                        {isMarkedDelete && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Will Delete
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick increment & Delete buttons */}
                    <div className="flex items-center gap-1">
                      {isMarkedDelete ? (
                        <button
                          type="button"
                          onClick={() => toggleDeleteEntry(task.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-500 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      ) : (
                        <>
                          {[0.5, 1, 2].map((inc) => (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => addQuickHours(task.id, inc)}
                              className="px-2 py-1 rounded-md text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors cursor-pointer"
                            >
                              +{inc}h
                            </button>
                          ))}

                          {(draft.existing || hasHours) && (
                            <button
                              type="button"
                              onClick={() => toggleDeleteEntry(task.id)}
                              className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1 cursor-pointer"
                              title="Delete entry for this habit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Input row (disabled if marked for deletion) */}
                  {!isMarkedDelete && (
                    <div className="flex items-center gap-2">
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.25"
                          value={draft.hours}
                          onChange={(e) =>
                            updateDraft(draft.taskId, "hours", e.target.value)
                          }
                          placeholder="0.0"
                          className="w-full pl-7 pr-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/40"
                        />
                        <Clock className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
                      </div>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={180}
                          value={draft.note}
                          onChange={(e) =>
                            updateDraft(draft.taskId, "note", e.target.value)
                          }
                          placeholder="Optional note / reflection..."
                          className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/40"
                        />
                        <FileText className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        {activeTasks.length > 0 && !loading && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-b-2xl">
            {/* Delete All Day Entries */}
            <div>
              {hasAnyExistingEntries && !confirmDeleteAll && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAll(true)}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete all for this date</span>
                </button>
              )}

              {confirmDeleteAll && (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    Delete entire day?
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteAllDayEntries}
                    disabled={saving}
                    className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Save & Cancel */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
