"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn, formatVnd } from "@/lib/utils";
import {
  RANGE_OPTIONS,
  formatPct,
  type RangeKey,
} from "@/lib/finance/range";
import type { FinancePackage } from "@/lib/finance/model";

export function useChartTheme() {
  const [theme, setTheme] = useState({
    brand: "#10b981",
    brandSoft: "#10b98133",
    ink: "#0f172a",
    grid: "#e2e8f0",
  });

  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const raw = cs.getPropertyValue("--brand-500").trim();
      const brand = raw.startsWith("#") && raw.length === 7 ? raw : "#10b981";
      setTheme({
        brand,
        brandSoft: `${brand}33`,
        ink: cs.getPropertyValue("--foreground").trim() || "#0f172a",
        grid: cs.getPropertyValue("--border").trim() || "#e2e8f0",
      });
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-vertical"],
    });
    return () => obs.disconnect();
  }, []);

  return theme;
}

const PACKAGE_LABEL: Record<FinancePackage, string> = {
  basic: "BASIC",
  advanced: "ADVANCED",
  pro: "PRO",
  ai: "AI",
};

export function PackageBadge({ tier }: { tier: FinancePackage }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {PACKAGE_LABEL[tier]}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="min-w-[200px] flex-1 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight">{value}</p>
      {delta != null ? (
        <p
          className={cn(
            "mt-1 text-xs font-semibold",
            up ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {formatPct(delta)} so với kỳ trước
        </p>
      ) : null}
    </Card>
  );
}

export function DateRangeFilter({
  value,
  onChange,
  from,
  to,
  onFrom,
  onTo,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="text-sm">
        <span className="sr-only">Khoảng thời gian</span>
        <select
          className="min-h-11 rounded-[10px] border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={value}
          onChange={(e) => onChange(e.target.value as RangeKey)}
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {value === "custom" ? (
        <div className="flex gap-2">
          <input
            type="date"
            aria-label="Từ ngày"
            className="min-h-11 rounded-[10px] border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={from}
            onChange={(e) => onFrom(e.target.value)}
          />
          <input
            type="date"
            aria-label="Đến ngày"
            className="min-h-11 rounded-[10px] border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={to}
            onChange={(e) => onTo(e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-[12px] bg-slate-100 dark:bg-slate-800"
        />
      ))}
    </div>
  );
}

export function EmptyBlock({ text }: { text: string }) {
  return (
    <p className="rounded-[10px] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
      {text}
    </p>
  );
}

export function ErrorBlock({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {text}
    </p>
  );
}

type Point = { label: string; inflow: number; outflow: number; net: number };

function VndTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs shadow dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold">{label}</p>
      <p>Tiền vào: {formatVnd(row.inflow)}</p>
      <p>Tiền ra: {formatVnd(row.outflow)}</p>
      <p>Ròng: {row.net >= 0 ? "+" : ""}{formatVnd(row.net)}</p>
    </div>
  );
}

export function CashflowChart({ data }: { data: Point[] }) {
  const chart = useChartTheme();
  if (!data.some((d) => d.inflow || d.outflow)) {
    return <EmptyBlock text="Chưa có dòng tiền trong 30 ngày này." />;
  }
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <Tooltip content={<VndTooltip />} />
          <Area
            type="monotone"
            dataKey="inflow"
            name="Tiền vào"
            stroke={chart.brand}
            fill={chart.brandSoft}
          />
          <Area
            type="monotone"
            dataKey="outflow"
            name="Tiền ra"
            stroke="#f43f5e"
            fill="#f43f5e22"
          />
          <Area
            type="monotone"
            dataKey="net"
            name="Ròng"
            stroke={chart.ink}
            fill={`${chart.ink}11`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBar({
  data,
  xKey,
  yKey,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
}) {
  const chart = useChartTheme();
  if (!data.length) return <EmptyBlock text="Chưa có số liệu cho biểu đồ." />;
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <Tooltip
            formatter={(v) => formatVnd(Number(v ?? 0))}
          />
          <Bar dataKey={yKey} fill={chart.brand} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Tabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; badge?: FinancePackage }[];
}) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold",
            value === o.id
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
          )}
          onClick={() => onChange(o.id)}
        >
          {o.label}
          {o.badge ? <PackageBadge tier={o.badge} /> : null}
        </button>
      ))}
    </div>
  );
}

export function useRangeState() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  return { range, setRange, from, setFrom, to, setTo };
}
