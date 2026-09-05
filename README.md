# Habit Tracker

A daily habit/task time tracker with a GitHub-contributions-style heatmap. Built with Next.js (App Router, TypeScript), Tailwind CSS, and Supabase.

## Features

- Create, edit, archive, and delete tasks (habits) with custom colors and emojis
- Log hours per task for any day with an upsert modal
- GitHub-style heatmap showing intensity of logged hours over the past year
- Filter the heatmap to a single task or view all tasks combined
- Running streak counter, total hours, days logged, and daily average
- Tooltip on hover with per-task breakdown for each day
- Dark mode (manual toggle + system preference detection)
- CSV export of entries
- Keyboard shortcut (Ctrl+L / Cmd+L) to quick-add today's entry
- Supabase Auth with email/password and magic link
- Row Level Security: each user only sees their own data
- Mobile-responsive with horizontal scroll on the heatmap

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project. Copy the **Project URL** and **anon public** API key from Settings > API.

### 2. Run the database schema

Open the SQL Editor in your Supabase dashboard and paste the contents of [`supabase/schema.sql`](./supabase/schema.sql). Run it. This creates the `tasks` and `entries` tables, enables Row Level Security, and adds indexes.

### 3. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install dependencies

```bash
npm install
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` to create an account.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in [vercel.com](https://vercel.com).
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy.

Make sure your Supabase project's Auth settings allow the Vercel URL as a redirect:
- Go to Supabase Dashboard > Authentication > URL Configuration
- Add your Vercel domain to **Redirect URLs** (e.g. `https://your-app.vercel.app/auth/callback`)

## Project structure

```
src/
├── app/
│   ├── layout.tsx          Root layout (fonts, metadata, dark mode)
│   ├── page.tsx            Dashboard (heatmap, stats, task filter)
│   ├── login/page.tsx      Auth page (sign in, sign up, magic link)
│   ├── tasks/page.tsx      Task management (CRUD)
│   └── auth/callback/      Magic link callback handler
├── components/
│   ├── Heatmap.tsx         GitHub-style contribution heatmap
│   ├── DayEntryModal.tsx   Log hours per task for a day
│   ├── StatsBar.tsx        Streak, total hours, averages
│   ├── Navbar.tsx          Top navigation
│   ├── TaskForm.tsx        Create/edit task modal
│   └── TaskList.tsx        Task list with actions
├── lib/
│   ├── supabase/           Browser + server clients, middleware
│   ├── types.ts            TypeScript interfaces
│   └── utils.ts            Date helpers, heatmap color math
└── middleware.ts           Auth guard
```

## Tech stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** v4
- **Supabase** (Postgres, Auth, RLS)
- **@supabase/ssr** for cookie-based auth in Next.js
- Deployable on **Vercel**
