"use client";

/**
 * Toggle between light and dark modes with a synchronized, seamless transition.
 * Adds a temporary class to <html> that forces all elements (backgrounds, borders, text, SVG)
 * to transition with the exact same 200ms duration and easing curve, preventing inconsistent lag.
 */
export function toggleTheme(
  currentIsDark: boolean,
  setIsDark: (val: boolean) => void
) {
  const next = !currentIsDark;
  const root = document.documentElement;

  // Add the synchronized transition class
  root.classList.add("theme-transitioning");

  // Force reflow so the browser registers the transition rules before values change
  void root.offsetHeight;

  // Toggle class and persist preference
  root.classList.toggle("dark", next);
  setIsDark(next);
  try {
    localStorage.setItem("theme", next ? "dark" : "light");
  } catch {
    // localStorage might be unavailable
  }

  // Remove the transition class after animation finishes so hover states remain snappy
  window.setTimeout(() => {
    root.classList.remove("theme-transitioning");
  }, 250);
}
