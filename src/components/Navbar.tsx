"use client";

import { useState } from "react";
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
  Menu,
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);

  function keepExpanded() {
    setIsExpanded(true);
  }

  function collapseImmediately() {
    setIsExpanded(false);
  }

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
    <header className="sticky top-3 z-40 w-full px-4 sm:px-6 pointer-events-none">
      <div
        className={`group/header relative mr-auto flex h-10 max-w-6xl items-center gap-4 overflow-visible px-3 transition-[width,background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out pointer-events-auto ${
          isExpanded
            ? "glass-panel grain-surface w-[min(100%,22rem)] rounded-xl overflow-visible transition-[width,background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out"
            : "w-fit rounded-xl border border-transparent bg-transparent shadow-none backdrop-blur-none transition-none"
        }`}
        onMouseEnter={keepExpanded}
        onMouseLeave={collapseImmediately}
        onFocus={keepExpanded}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            collapseImmediately();
          }
        }}
      >
        {/* Left-aligned brand */}
        <div className="relative flex h-10 shrink-0 items-center">
          <Link
            href="/"
            className="relative z-10 whitespace-nowrap font-[Arial,sans-serif] text-sm font-bold tracking-[0.03em] text-zinc-900 dark:text-zinc-100"
          >
            COMPOUND
          </Link>

        </div>

        {/* Left-side controls */}
        <div className={`${isExpanded ? "flex" : "hidden"} pointer-events-none items-center gap-1.5 opacity-100 transition-opacity duration-200 group-hover/header:pointer-events-auto group-hover/header:opacity-100 group-focus-within/header:pointer-events-auto group-focus-within/header:opacity-100 sm:gap-2.5`}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPagesOpen((open) => !open)}
              className={`rounded-lg p-2 transition-colors ${
                isPagesOpen
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
              }`}
              title="Pages"
              aria-label="Pages"
              aria-expanded={isPagesOpen}
            >
              <Menu className="h-4 w-4" />
            </button>

            {isPagesOpen && (
              <nav className="absolute left-0 top-full z-50 mt-2 flex flex-col gap-1 rounded-xl border border-zinc-200/80 bg-white/95 p-1 shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/95">
                {links.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsPagesOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                          : "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? "text-zinc-900 dark:text-zinc-100 stroke-[2.2]" : "text-zinc-400"}`} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

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
        </div>

        {/* Right-side account controls */}
        <div className={`${isExpanded ? "flex" : "hidden"} pointer-events-none ml-auto items-center justify-end gap-1.5 opacity-100 transition-opacity duration-200 group-hover/header:pointer-events-auto group-hover/header:opacity-100 group-focus-within/header:pointer-events-auto group-focus-within/header:opacity-100 sm:gap-2.5`}>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

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
