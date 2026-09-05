"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface NavbarProps {
  onToggleDarkMode?: () => void;
  isDark?: boolean;
}

export default function Navbar({ onToggleDarkMode, isDark }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/tasks", label: "Tasks" },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--foreground)]/8 bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-[var(--foreground)] shrink-0"
        >
          <span className="text-lg">🔥</span>
          <span className="hidden sm:inline">Habit Tracker</span>
        </Link>

        {/* Nav links */}
        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                pathname === href
                  ? "bg-[var(--foreground)]/[0.06] text-[var(--foreground)]"
                  : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.03]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Dark mode toggle */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Toggle dark mode"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        )}

        {/* User email + sign out */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--foreground)]/40 hidden sm:inline truncate max-w-[160px]">
            {email}
          </span>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Sign out"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
