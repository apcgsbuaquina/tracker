"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";

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
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
          task.is_archived
            ? "border-[var(--foreground)]/5 opacity-60"
            : "border-[var(--foreground)]/8 hover:border-[var(--foreground)]/15 hover:shadow-md hover:shadow-black/5"
        }`}
      >
        {/* Color dot + emoji */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: task.color + "20" }}
        >
          {task.emoji || (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: task.color }}
            />
          )}
        </div>

        {/* Name */}
        <span className="flex-1 font-medium text-[var(--foreground)] truncate">
          {task.name}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Edit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>

          <button
            onClick={() => onArchive(task)}
            className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title={task.is_archived ? "Unarchive" : "Archive"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {task.is_archived ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              )}
            </svg>
          </button>

          {isConfirming ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => {
                  onDelete(task);
                  setConfirmDeleteId(null);
                }}
                className="px-2 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-2 py-1 text-xs font-medium rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(task.id)}
              className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--foreground)]/50 hover:text-red-400 transition-colors cursor-pointer"
              title="Delete"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.length === 0 && (
        <p className="text-center text-[var(--foreground)]/40 py-8">
          No tasks yet. Create one to get started.
        </p>
      )}

      {active.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}

      {archived.length > 0 && (
        <div className="pt-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${
                showArchived ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {archived.length} archived task{archived.length > 1 ? "s" : ""}
          </button>

          {showArchived && (
            <div className="space-y-2 mt-3">
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
