"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import Navbar from "@/components/Navbar";
import { Plus, ListTodo } from "lucide-react";

export default function TasksPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      setTasks((data as Task[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleSave(data: {
    name: string;
    color: string;
    emoji: string;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (editingTask) {
      await supabase
        .from("tasks")
        .update({ name: data.name, color: data.color, emoji: data.emoji || null })
        .eq("id", editingTask.id);
    } else {
      await supabase.from("tasks").insert({
        user_id: user.id,
        name: data.name,
        color: data.color,
        emoji: data.emoji || null,
      });
    }

    setShowForm(false);
    setEditingTask(null);
    fetchTasks();
  }

  async function handleArchive(task: Task) {
    await supabase
      .from("tasks")
      .update({ is_archived: !task.is_archived })
      .eq("id", task.id);
    fetchTasks();
  }

  async function handleDelete(task: Task) {
    await supabase.from("tasks").delete().eq("id", task.id);
    fetchTasks();
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar onToggleDarkMode={toggleDarkMode} isDark={isDark} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                <ListTodo className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Manage Habits
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Habits & Routines
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Organize the activities you track on your daily contribution grid.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
            <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading habits...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <TaskList
              tasks={tasks}
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </div>
        )}

        {showForm && (
          <TaskForm
            task={editingTask}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
