"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { toggleTheme } from "@/lib/theme";

type AuthMode = "signin" | "signup" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [isDark, setIsDark] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark =
      stored !== null
        ? stored === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: "Check your email for your secure magic link.",
        });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage({
          type: "success",
          text: "Account registered. Check your email to confirm.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      {/* Theme Toggle in top right */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={() => toggleTheme(isDark, setIsDark)}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-xs cursor-pointer"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-6 sm:p-7 shadow-xl shadow-zinc-200/40 dark:shadow-black/40 backdrop-blur-md">
          {/* Segmented Mode Selector */}
          <div className="flex gap-1 mb-6 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 p-1">
            {(
              [
                ["signin", "Sign In"],
                ["signup", "Sign Up"],
                ["magic", "Magic Link"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  setMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === key
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/30 focus:border-zinc-500 transition-all"
                />
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            {mode !== "magic" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500/30 focus:border-zinc-500 transition-all"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Alert Message */}
            {message && (
              <div
                className={`flex items-start gap-2.5 text-xs p-3 rounded-xl border animate-in fade-in duration-150 ${
                  message.type === "error"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {message.type === "error" ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{message.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : mode === "magic" ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Send Magic Link</span>
                </>
              ) : mode === "signup" ? (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
