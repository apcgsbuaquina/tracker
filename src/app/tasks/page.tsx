"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import Navbar from "@/components/Navbar";

export default function TasksPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    setTasks((data as Task[]) ?? []);
    setLoading(false);
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
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[var(--foreground)]">Tasks</h1>
          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New task
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
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
