"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import TaskIcon from "@/components/TaskIcon";
import {
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertCircle,
  FolderArchive,
  ChevronRight,
  ListTodo,
} from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskList({
  tasks,
  onEdit,
  onArchive,
  onDelete,
}: TaskListProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const active = tasks.filter((t) => !t.is_archived);
  const archived = tasks.filter((t) => t.is_archived);

  function TaskCard({ task }: { task: Task }) {
    const isConfirming = confirmDeleteId === task.id;

    return (
      <div
        className={`group relative flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
          task.is_archived
            ? "border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-70"
            : "border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Icon Badge */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${task.color}15`,
              color: task.color,
              border: `1px solid ${task.color}30`,
            }}
          >
            <TaskIcon name={task.emoji} className="w-5 h-5" />
          </div>

          {/* Title & Metadata */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {task.name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: task.color }}
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                {task.is_archived ? "Archived" : "Active Tracking"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {isConfirming ? (
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 animate-in fade-in duration-150">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 ml-1" />
              <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
                Delete?
              </span>
              <button
                onClick={() => {
                  onDelete(task);
                  setConfirmDeleteId(null);
                }}
                className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-2 py-1 text-xs font-medium rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onEdit(task)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Edit Habit"
                aria-label="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onArchive(task)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={task.is_archived ? "Restore Habit" : "Archive Habit"}
                aria-label={task.is_archived ? "Restore" : "Archive"}
              >
                {task.is_archived ? (
                  <ArchiveRestore className="w-3.5 h-3.5" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={() => setConfirmDeleteId(task.id)}
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                title="Delete Habit"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.length === 0 && (
        <div className="text-center py-14 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No active habits yet
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Create your first habit above to track your daily progress on the contribution heatmap.
          </p>
        </div>
      )}

      {/* Active Habits List */}
      <div className="space-y-2.5">
        {active.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>

      {/* Archived Habits Section */}
      {archived.length > 0 && (
        <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showArchived ? "rotate-90" : ""
              }`}
            />
            <FolderArchive className="w-3.5 h-3.5" />
            <span>
              {archived.length} Archived Habit{archived.length > 1 ? "s" : ""}
            </span>
          </button>

          {showArchived && (
            <div className="space-y-2.5 mt-3 animate-in fade-in duration-150">
              {archived.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
