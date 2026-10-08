"use client";

import { tr } from "@/lib/i18n/translate";

import Link from "next/link";
import { cn } from "@/lib/utils";

export const fieldClass =
  "min-h-11 rounded-[10px] border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900";

export type StockLevel = "out" | "low" | "ok" | "high" | "inactive";

export function stockLevel(stock: number, minStock: number, active: boolean): StockLevel {
  if (!active) return "inactive";
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  if (stock >= Math.max(minStock * 3, minStock + 20)) return "high";
  return "ok";
}

export function stockLevelLabel(level: StockLevel) {
  if (level === "out") return tr("Hết hàng");
  if (level === "low") return tr("Sắp hết");
  if (level === "high") return tr("Tồn cao");
  if (level === "inactive") return tr("Ngừng kinh doanh");
  return tr("Còn hàng");
}

export function ProductThumb({
  name,
  emoji,
  imageColor,
  imageUrl,
}: {
  name: string;
  emoji: string;
  imageColor: string;
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-[10px] object-cover"
      />
    );
  }
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-lg"
      style={{ backgroundColor: imageColor }}
      aria-hidden
    >
      <span className="sr-only">{name}</span>
      {emoji}
    </span>
  );
}

export function StockMeter({ stock, minStock }: { stock: number; minStock: number }) {
  const cap = Math.max(minStock * 2, stock, 1);
  const pct = Math.min(100, Math.round((Math.max(stock, 0) / cap) * 100));
  const level = stockLevel(stock, minStock, true);
  const bar =
    level === "out" ? "bg-rose-500" : level === "low" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-24">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn("h-full", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatusPill({
  label,
  warn,
  tone,
}: {
  label: string;
  warn?: boolean;
  tone?: "ok" | "warn" | "danger" | "neutral";
}) {
  const resolved = tone ?? (warn ? "warn" : "neutral");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        resolved === "ok" && "bg-emerald-100 text-emerald-800",
        resolved === "warn" && "bg-amber-100 text-amber-800",
        resolved === "danger" && "bg-rose-100 text-rose-800",
        resolved === "neutral" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {label}
    </span>
  );
}

export function purchaseTone(status: string): "ok" | "warn" | "danger" | "neutral" {
  if (status === "done") return "ok";
  if (status === "variance" || status === "awaiting_receive") return "warn";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export function outboundTone(status: string): "ok" | "warn" | "danger" | "neutral" {
  if (status === "shipped" || status === "ready") return "ok";
  if (status === "pending" || status === "partial" || status === "picking") return "warn";
  if (status === "rejected" || status === "cancelled") return "danger";
  return "neutral";
}

export function Sparkline({ points }: { points: number[] }) {
  const nums = points.length > 1 ? points : [0, 0];
  const max = Math.max(...nums, 1);
  const min = Math.min(...nums, 0);
  const w = 72;
  const h = 28;
  const d = nums
    .map((n, i) => {
      const x = (i / (nums.length - 1)) * w;
      const y = h - ((n - min) / (max - min || 1)) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="text-emerald-500">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        active
          ? "bg-emerald-500 !text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {children}
    </button>
  );
}

export function EmptyBlock({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[10px] border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
      <svg width="72" height="56" viewBox="0 0 72 56" aria-hidden className="text-slate-300">
        <rect x="8" y="16" width="56" height="32" rx="8" fill="currentColor" opacity="0.35" />
        <rect x="20" y="8" width="32" height="16" rx="6" fill="currentColor" />
      </svg>
      <p className="mt-3 text-base font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-[10px] bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

export function QuickLink({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        primary
          ? "bg-emerald-500 !text-white hover:bg-emerald-600"
          : "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
      )}
    >
      {children}
    </Link>
  );
}
