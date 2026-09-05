"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { DayData } from "@/lib/types";
import {
  generateDateRange,
  parseDate,
  bucketValue,
  intensityColor,
  DAY_LABELS,
  MONTH_LABELS,
  formatDate,
} from "@/lib/utils";

interface HeatmapProps {
  data: Map<string, DayData>;
  baseColor: string;
  startDate: Date;
  endDate: Date;
  onDayClick: (date: string) => void;
  isDark: boolean;
}

const CELL_SIZE = 13;
const CELL_GAP = 3;

export default function Heatmap({
  data,
  baseColor,
  startDate,
  endDate,
  onDayClick,
  isDark,
}: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build the grid: weeks as columns, days (Mon-Sun) as rows
  const { weeks, monthLabels, maxValue } = useMemo(() => {
    const allDates = generateDateRange(startDate, endDate);

    // Find the max daily total for bucketing
    let max = 0;
    for (const d of allDates) {
      const day = data.get(d);
      if (day && day.totalHours > max) max = day.totalHours;
    }
    // Ensure max is at least 1 to avoid division by zero
    if (max < 1) max = 1;

    // Organize into weeks. Week starts on Monday.
    const weeksList: (string | null)[][] = [];
    let currentWeek: (string | null)[] = [];

    // Pad the first week with nulls so it starts on Monday
    const firstDate = parseDate(allDates[0]);
    const firstDow = (firstDate.getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push(null);
    }

    for (const dateStr of allDates) {
      const d = parseDate(dateStr);
      const dow = (d.getDay() + 6) % 7; // Mon=0
      if (dow === 0 && currentWeek.length > 0) {
        // Pad incomplete week
        while (currentWeek.length < 7) currentWeek.push(null);
        weeksList.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(dateStr);
    }
    // Push last incomplete week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeksList.push(currentWeek);
    }

    // Build month labels with their column positions
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < weeksList.length; col++) {
      // Find first non-null date in this week
      const firstInWeek = weeksList[col].find((d) => d !== null);
      if (firstInWeek) {
        const month = parseDate(firstInWeek).getMonth();
        if (month !== lastMonth) {
          labels.push({ label: MONTH_LABELS[month], col });
          lastMonth = month;
        }
      }
    }

    return { weeks: weeksList, monthLabels: labels, maxValue: max };
  }, [data, startDate, endDate]);

  // Scroll to the right (most recent) on mount
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
      y: rect.top - containerRect.top - 8,
    });
  }

  const today = formatDate(new Date());

  return (
    <div className="relative" ref={containerRef}>
      {/* Scrollable area */}
      <div className="overflow-x-auto pb-2">
        <div
          className="inline-flex flex-col"
          style={{
            paddingLeft: 32, // space for day labels
          }}
        >
          {/* Month labels */}
          <div
            className="flex mb-1"
            style={{
              paddingLeft: 0,
              height: 16,
            }}
          >
            {monthLabels.map(({ label, col }, i) => (
              <span
                key={i}
                className="text-[10px] text-[var(--foreground)]/40 absolute"
                style={{
                  left: 32 + col * (CELL_SIZE + CELL_GAP),
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {/* Day-of-week labels */}
            <div
              className="flex flex-col gap-[3px] shrink-0"
              style={{ marginLeft: -32, width: 28 }}
            >
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="flex items-center justify-end pr-1 text-[10px] text-[var(--foreground)]/40"
                  style={{
                    height: CELL_SIZE,
                    visibility: i % 2 === 0 ? "visible" : "hidden",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
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
                  const bucket = bucketValue(value, maxValue);
                  const color = intensityColor(bucket, baseColor, isDark);
                  const isToday = dateStr === today;

                  return (
                    <div
                      key={dayIdx}
                      className="rounded-[3px] cursor-pointer transition-all hover:scale-125 hover:z-10"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: color,
                        outline: isToday
                          ? `2px solid ${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}`
                          : "none",
                        outlineOffset: -1,
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

      {/* Tooltip */}
      {tooltip && (
        <Tooltip
          date={tooltip.date}
          dayData={data.get(tooltip.date) ?? null}
          x={tooltip.x}
          y={tooltip.y}
          isDark={isDark}
        />
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-[var(--foreground)]/40">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((bucket) => (
          <div
            key={bucket}
            className="rounded-[3px]"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: intensityColor(bucket, baseColor, isDark),
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
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
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const total = dayData?.totalHours ?? 0;
  const breakdown = dayData?.breakdown ?? [];

  return (
    <div
      className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y }}
    >
      <div
        className={`rounded-xl px-3 py-2.5 text-xs shadow-xl border min-w-[160px] ${
          isDark
            ? "bg-zinc-800 border-zinc-700 text-zinc-200"
            : "bg-white border-gray-200 text-gray-800"
        }`}
      >
        <div className="font-medium mb-1">{formatted}</div>
        {total === 0 ? (
          <div className={isDark ? "text-zinc-500" : "text-gray-400"}>
            No entries
          </div>
        ) : (
          <>
            <div className="font-semibold text-sm mb-1.5">
              {total.toFixed(1)}h total
            </div>
            <div className="space-y-0.5">
              {breakdown.map((b) => (
                <div key={b.taskId} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="truncate">
                    {b.emoji ? `${b.emoji} ` : ""}
                    {b.name}
                  </span>
                  <span className={`ml-auto shrink-0 ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                    {b.hours}h
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
