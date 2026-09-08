"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { DayData } from "@/lib/types";
import {
  generateDateRange,
  parseDate,
  bucketValue,
  intensityColor,
  hexToHsl,
  HEATMAP_PALETTE,
  DAY_LABELS,
  MONTH_LABELS,
  formatDate,
  type Thresholds,
  DEFAULT_THRESHOLDS,
} from "@/lib/utils";
import TaskIcon from "@/components/TaskIcon";
import { Calendar, Sliders } from "lucide-react";

interface HeatmapProps {
  data: Map<string, DayData>;
  baseColor: string;
  startDate: Date;
  endDate: Date;
  onDayClick: (date: string) => void;
  isDark: boolean;
  thresholds?: Thresholds;
  onOpenThresholds?: () => void;
  isCombined?: boolean;
  isBooleanTask?: boolean;
}

const CELL_SIZE = 14;
const CELL_GAP = 3.5;

export default function Heatmap({
  data,
  baseColor,
  startDate,
  endDate,
  onDayClick,
  isDark,
  thresholds = DEFAULT_THRESHOLDS,
  onOpenThresholds,
  isCombined = false,
  isBooleanTask = false,
}: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build grid: columns = weeks, rows = days (Mon = 0 ... Sun = 6)
  const { weeks, monthLabels } = useMemo(() => {
    const allDates = generateDateRange(startDate, endDate);

    const weeksList: (string | null)[][] = [];
    let currentWeek: (string | null)[] = [];

    const firstDate = parseDate(allDates[0]);
    const firstDow = (firstDate.getDay() + 6) % 7;
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push(null);
    }

    for (const dateStr of allDates) {
      const d = parseDate(dateStr);
      const dow = (d.getDay() + 6) % 7;
      if (dow === 0 && currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeksList.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(dateStr);
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeksList.push(currentWeek);
    }

    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < weeksList.length; col++) {
      const firstInWeek = weeksList[col].find((d) => d !== null);
      if (firstInWeek) {
        const month = parseDate(firstInWeek).getMonth();
        if (month !== lastMonth) {
          labels.push({ label: MONTH_LABELS[month], col });
          lastMonth = month;
        }
      }
    }

    return { weeks: weeksList, monthLabels: labels };
  }, [startDate, endDate]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [weeks]);

  function handleMouseEnter(
    dateStr: string,
    e: React.MouseEvent<HTMLDivElement>
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setTooltip({
      date: dateStr,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
    });
  }

  const today = formatDate(new Date());

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* Centered Scrollable Grid Container */}
      <div className="-translate-y-3 overflow-x-auto pb-1 pt-0 scroll-smooth flex items-center justify-center">
        <div
          className="inline-flex flex-col w-max mx-auto"
          style={{ paddingLeft: 34 }}
        >
          {/* Month Labels */}
          <div className="relative h-5 mb-1.5 pointer-events-none">
            {monthLabels.map(({ label, col }, i) => (
              <span
                key={i}
                className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-200 absolute"
                style={{
                  left: col * (CELL_SIZE + CELL_GAP),
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Day rows + Week columns */}
          <div className="flex gap-[3.5px]">
            {/* Day of week labels */}
            <div
              className="flex flex-col gap-[3.5px] shrink-0 pointer-events-none"
              style={{ marginLeft: -34, width: 28 }}
            >
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="flex items-center justify-end pr-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-200"
                  style={{
                    height: CELL_SIZE,
                    visibility: i % 2 === 0 ? "visible" : "hidden",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week Columns */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3.5px]">
                {week.map((dateStr, dayIdx) => {
                  if (!dateStr) {
                    return (
                      <div
                        key={dayIdx}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                        }}
                      />
                    );
                  }

                  const dayData = data.get(dateStr);
                  const value = dayData?.totalHours ?? 0;
                  const bucket = bucketValue(value, thresholds);
                  const color = isCombined
                    ? combinedDayColor(dayData, thresholds, isDark)
                    : isBooleanTask
                    ? value > 0
                      ? "#43A047"
                      : intensityColor(0, baseColor, isDark)
                    : intensityColor(bucket, baseColor, isDark);
                  const isToday = dateStr === today;

                  return (
                    <div
                      key={dayIdx}
                      className={`relative rounded-[3.5px] cursor-pointer transition-all duration-150 ${
                        bucket === 0
                          ? "border border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600"
                          : "border border-transparent hover:scale-125 hover:z-20 hover:shadow-md"
                      } ${
                        isToday
                          ? "ring-2 ring-zinc-700 dark:ring-zinc-300 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900"
                          : ""
                      }`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        background: color,
                      }}
                      onClick={() => onDayClick(dateStr)}
                      onMouseEnter={(e) => handleMouseEnter(dateStr, e)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <Tooltip
          date={tooltip.date}
          dayData={data.get(tooltip.date) ?? null}
          x={tooltip.x}
          y={tooltip.y}
          isDark={isDark}
        />
      )}

      {/* Footer Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mt-0 pt-1 text-[11px] text-zinc-700 dark:text-zinc-200">
        <span className="text-zinc-700 dark:text-zinc-200">
          Click on any square to view, log, edit, or delete hours
        </span>

        {!isBooleanTask && <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-200">0h</span>
            {([0, 1, 2, 3, 4] as const).map((bucket) => (
              <div
                key={bucket}
                className={`rounded-[3px] ${
                  bucket === 0 ? "border border-zinc-200 dark:border-zinc-800" : ""
                }`}
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: intensityColor(bucket, baseColor, isDark),
                }}
                title={
                  bucket === 0
                    ? "0 hours"
                    : bucket === 1
                    ? `< ${thresholds[0]}h`
                    : bucket === 2
                    ? `≥ ${thresholds[0]}h`
                    : bucket === 3
                    ? `≥ ${thresholds[1]}h`
                    : `≥ ${thresholds[2]}h`
                }
              />
            ))}
            <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-200">
              {thresholds[2]}h+
            </span>
          </div>

          {onOpenThresholds && (
            <button
              type="button"
              onClick={onOpenThresholds}
              className="glass-control inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors cursor-pointer text-[10px] font-medium"
              title="Customize color shade hour thresholds"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>Customize Scale</span>
            </button>
          )}
        </div>}
      </div>
    </div>
  );
}

function combinedDayColor(
  dayData: DayData | undefined,
  thresholds: Thresholds,
  isDark: boolean
): string {
  if (!dayData || dayData.totalHours <= 0) {
    return intensityColor(0, "#10b981", isDark);
  }

  let red = 0;
  let green = 0;
  let blue = 0;

  for (const entry of dayData.breakdown) {
    const weight = entry.hours / dayData.totalHours;
    const { h, s: baseSaturation } = hexToHsl(
      HEATMAP_PALETTE[bucketValue(entry.hours, thresholds) - 1]
    );
    const s = Math.min(baseSaturation + 5, 100);
    const lightness = intensityLightness(
      bucketValue(entry.hours, thresholds),
      isDark
    );
    const [entryRed, entryGreen, entryBlue] = hslToRgb(h, s, lightness);
    red += entryRed * weight;
    green += entryGreen * weight;
    blue += entryBlue * weight;
  }

  const blendedColor = [red, green, blue];
  const paletteColor = HEATMAP_PALETTE.reduce((closest, paletteHex) => {
    const paletteRgb = hexToRgb(paletteHex);
    return colorDistance(blendedColor, paletteRgb) <
      colorDistance(blendedColor, hexToRgb(closest))
      ? paletteHex
      : closest;
  });

  return intensityColor(
    bucketValue(dayData.totalHours, thresholds),
    paletteColor,
    isDark
  );
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function colorDistance(
  first: number[],
  second: [number, number, number]
): number {
  return Math.sqrt(
    (first[0] - second[0]) ** 2 +
      (first[1] - second[1]) ** 2 +
      (first[2] - second[2]) ** 2
  );
}

function intensityLightness(bucket: 0 | 1 | 2 | 3 | 4, isDark: boolean): number {
  if (bucket === 0) return isDark ? 9 : 95;
  return ({ 1: 60, 2: 54, 3: 48, 4: 42 } as const)[bucket];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = h / 60;
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green, blue] = [chroma, intermediate, 0];
  else if (segment < 2) [red, green, blue] = [intermediate, chroma, 0];
  else if (segment < 3) [red, green, blue] = [0, chroma, intermediate];
  else if (segment < 4) [red, green, blue] = [0, intermediate, chroma];
  else if (segment < 5) [red, green, blue] = [intermediate, 0, chroma];
  else [red, green, blue] = [chroma, 0, intermediate];

  return [
    (red + match) * 255,
    (green + match) * 255,
    (blue + match) * 255,
  ];
}

function Tooltip({
  date,
  dayData,
  x,
  y,
  isDark,
}: {
  date: string;
  dayData: DayData | null;
  x: number;
  y: number;
  isDark: boolean;
}) {
  const d = parseDate(date);
  const formattedDate = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const total = dayData?.totalHours ?? 0;
  const breakdown = dayData?.breakdown ?? [];

  return (
    <div
      className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-2 animate-in fade-in duration-150"
      style={{ left: x, top: y }}
    >
      <div
        className={`rounded-xl px-3.5 py-3 shadow-xl border min-w-[200px] backdrop-blur-md ${
          isDark
            ? "bg-zinc-900/95 border-zinc-800 text-zinc-100"
            : "bg-white/95 border-zinc-200 text-zinc-900"
        }`}
      >
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <Calendar className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{formattedDate}</span>
        </div>

        {total === 0 ? (
          <div className="text-xs text-zinc-600 dark:text-zinc-400 py-0.5">
            No habits logged this day
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">Total Tracked</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                {total.toFixed(1)} hrs
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {breakdown.map((b) => (
                <div
                  key={b.taskId}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${b.color}20`,
                        color: b.color,
                      }}
                    >
                      <TaskIcon name={b.emoji} className="w-3 h-3" />
                    </div>
                    <span className="font-medium truncate text-zinc-700 dark:text-zinc-300">
                      {b.name}
                    </span>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                    {b.hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
