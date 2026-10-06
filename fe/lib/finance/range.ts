import {
  endOfMonth,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

export type RangeKey =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "lastMonth"
  | "custom";

export const RANGE_OPTIONS: { id: RangeKey; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "yesterday", label: "Hôm qua" },
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" },
  { id: "month", label: "Tháng này" },
  { id: "lastMonth", label: "Tháng trước" },
  { id: "custom", label: "Tùy chỉnh" },
];

export interface DateWindow {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function dateWindow(
  key: RangeKey,
  now = new Date(),
  custom?: { from: string; to: string },
): DateWindow {
  let start = startOfDay(now);
  let end = endOfDay(now);

  if (key === "yesterday") {
    start = startOfDay(subDays(now, 1));
    end = endOfDay(subDays(now, 1));
  } else if (key === "7d") {
    start = startOfDay(subDays(now, 6));
  } else if (key === "30d") {
    start = startOfDay(subDays(now, 29));
  } else if (key === "month") {
    start = startOfMonth(now);
    end = endOfDay(now);
  } else if (key === "lastMonth") {
    const prev = subMonths(now, 1);
    start = startOfMonth(prev);
    end = endOfMonth(prev);
  } else if (key === "custom" && custom?.from && custom?.to) {
    start = startOfDay(new Date(custom.from));
    end = endOfDay(new Date(custom.to));
  }

  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - span);
  return { start, end, prevStart, prevEnd };
}

export function inWindow(iso: string, start: Date, end: Date) {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function formatPct(n: number) {
  const sign = n > 0 ? "↑" : n < 0 ? "↓" : "→";
  return `${sign} ${Math.abs(n).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}
