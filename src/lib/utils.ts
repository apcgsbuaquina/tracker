import type { DayData } from "./types";

/**
 * Generate an array of date strings (YYYY-MM-DD) between start and end,
 * inclusive on both ends.
 */
export function generateDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(0, 0, 0, 0);

  while (current <= endNorm) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Format a Date to YYYY-MM-DD. */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse a YYYY-MM-DD string into a Date (local timezone). */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Map a numeric value to an intensity bucket (0 = empty, 4 = max).
 * Uses a logarithmic-ish scale so low values still show color.
 */
export function bucketValue(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.1) return 1;
  if (ratio <= 0.35) return 2;
  if (ratio <= 0.65) return 3;
  return 4;
}

/**
 * Calculate the current streak: consecutive days ending at today (or
 * the most recent logged day) where totalHours > 0.
 */
export function calculateStreak(dayMap: Map<string, DayData>): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(today);
  while (true) {
    const key = formatDate(current);
    const day = dayMap.get(key);
    if (day && day.totalHours > 0) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Convert a hex color to HSL components.
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0,
    g = 0,
    b = 0;
  const cleaned = hex.replace("#", "");
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
  } else {
    r = parseInt(cleaned.substring(0, 2), 16) / 255;
    g = parseInt(cleaned.substring(2, 4), 16) / 255;
    b = parseInt(cleaned.substring(4, 6), 16) / 255;
  }

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Get a CSS color string for a given intensity bucket (0-4) and base hex color.
 * Bucket 0 returns a transparent/empty color.
 */
export function intensityColor(
  bucket: 0 | 1 | 2 | 3 | 4,
  baseHex: string,
  isDark: boolean
): string {
  if (bucket === 0) {
    return isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  }
  const { h, s } = hexToHsl(baseHex);
  // Map bucket to lightness: in dark mode high bucket = brighter,
  // in light mode high bucket = darker (more saturated)
  const lightnessMap = isDark
    ? { 1: 18, 2: 28, 3: 40, 4: 52 }
    : { 1: 85, 2: 70, 3: 52, 4: 38 };
  const saturation = Math.min(s + 10, 100);
  return `hsl(${h}, ${saturation}%, ${lightnessMap[bucket]}%)`;
}

/** Day-of-week labels (Mon = 0 ... Sun = 6). */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Short month names. */
export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
