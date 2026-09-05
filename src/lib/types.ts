export interface Task {
  id: string;
  user_id: string;
  name: string;
  color: string;
  emoji: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  task_id: string;
  entry_date: string; // YYYY-MM-DD
  hours: number;
  note: string | null;
  created_at: string;
}

/** An entry joined with its parent task (used for dashboard queries). */
export interface EntryWithTask extends Entry {
  tasks: Pick<Task, "name" | "color" | "emoji">;
}

/** Per-task breakdown for a single day (used by heatmap tooltip). */
export interface TaskBreakdown {
  taskId: string;
  name: string;
  color: string;
  emoji: string | null;
  hours: number;
  note: string | null;
}

/** Aggregated data for a single day cell in the heatmap. */
export interface DayData {
  date: string; // YYYY-MM-DD
  totalHours: number;
  breakdown: TaskBreakdown[];
}
