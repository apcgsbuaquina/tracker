"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BackgroundPicker from "@/components/BackgroundPicker";
import {
  LayoutDashboard,
  CheckSquare2,
  Sun,
  Moon,
  LogOut,
  User,
} from "lucide-react";

interface NavbarProps {
  onToggleDarkMode?: () => void;
  isDark?: boolean;
}

export default function Navbar({ onToggleDarkMode, isDark }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Habits", icon: CheckSquare2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand and nav links */}
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-base font-black tracking-[0.1em] text-zinc-900 dark:text-zinc-100"
          >
            COMPOUND
          </Link>

          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-zinc-900 dark:text-zinc-100 stroke-[2.2]" : "text-zinc-400"}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <BackgroundPicker />

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 transition-transform rotate-0 scale-100 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 transition-transform rotate-0 scale-100 text-zinc-600" />
              )}
            </button>
          )}

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

          {/* User profile & sign out */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              title="Account"
              aria-label="Account"
            >
              <User className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
