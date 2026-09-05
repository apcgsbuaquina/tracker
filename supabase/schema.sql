-- ============================================================
-- Habit Tracker schema
-- Run this in the Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- 1. Tasks -------------------------------------------------

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text not null default '#22c55e',
  emoji      text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- 2. Entries -----------------------------------------------

create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  task_id    uuid not null references public.tasks (id) on delete cascade,
  entry_date date not null,
  hours      numeric(5,2) not null check (hours >= 0),
  note       text,
  created_at timestamptz not null default now(),

  unique (task_id, entry_date)
);

alter table public.entries enable row level security;

create policy "Users can view their own entries"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on public.entries for delete
  using (auth.uid() = user_id);

-- 3. Indexes -----------------------------------------------

create index if not exists idx_entries_entry_date on public.entries (entry_date);
create index if not exists idx_entries_task_id    on public.entries (task_id);
create index if not exists idx_entries_user_id    on public.entries (user_id);
create index if not exists idx_tasks_user_id      on public.tasks   (user_id);
