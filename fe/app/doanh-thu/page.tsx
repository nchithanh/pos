"use client";

import { useMemo, useState } from "react";
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
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DASHBOARD_STATS, REVENUE_SERIES } from "@/data/dashboard";
import { formatVnd } from "@/lib/format";

type RangeKey = "today" | "7d" | "30d" | "month";

const RANGES: { id: RangeKey; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" },
  { id: "month", label: "Tháng này" },
];

export default function RevenuePage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const data = REVENUE_SERIES[range];

  const chartData = useMemo(
    () =>
      data.daily.map((d) => ({
        ...d,
        label: `${d.date.slice(8)}/${d.date.slice(5, 7)}`,
      })),
    [data],
  );

  return (
    <AppShell>
      <PageHeader
        title="Doanh thu"
        description="Báo cáo bán hàng theo khoảng thời gian"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              range === r.id
                ? "border-[var(--pos-green)] bg-[var(--pos-green)] text-white"
                : "border-[var(--pos-border)] bg-white text-slate-600"
            }`}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Doanh thu" value={formatVnd(data.revenue)} tone="green" />
        <StatCard label="Lợi nhuận" value={formatVnd(data.profit)} tone="sky" />
        <StatCard label="Số đơn" value={String(data.orders)} />
        <StatCard label="Đơn trung bình" value={formatVnd(data.aov)} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="pos-card p-4">
          <h2 className="mb-3 text-base font-bold">Doanh thu theo ngày</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}tr`}
                />
                <Tooltip formatter={(v: number) => formatVnd(v)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  fill="url(#rev2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pos-card p-4">
          <h2 className="mb-3 text-base font-bold">Số đơn theo ngày</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="pos-card mt-4 p-4">
        <h2 className="mb-3 text-base font-bold">Top sản phẩm</h2>
        <ul className="divide-y divide-[var(--pos-border)]">
          {DASHBOARD_STATS.topProducts.map((p, i) => (
            <li key={p.productId} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pos-green-soft)] text-xs font-bold text-[var(--pos-green-dark)]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500">Đã bán {p.sold}</p>
                </div>
              </div>
              <p className="shrink-0 font-bold">{formatVnd(p.revenue)}</p>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
