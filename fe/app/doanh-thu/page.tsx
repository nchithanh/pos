"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, subDays, startOfMonth, isAfter, parseISO } from "date-fns";
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
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatVnd } from "@/lib/utils";

type Range = "today" | "7d" | "30d" | "month";

export default function RevenuePage() {
  const orders = useLiveQuery(() => db.orders.toArray()) ?? [];
  const [range, setRange] = useState<Range>("7d");

  const filtered = useMemo(() => {
    const now = new Date("2026-10-06T23:59:59");
    let from = subDays(now, 6);
    if (range === "today") from = new Date("2026-10-06T00:00:00");
    if (range === "30d") from = subDays(now, 29);
    if (range === "month") from = startOfMonth(now);
    return orders.filter((o) => isAfter(parseISO(o.createdAt), from) || o.createdAt.startsWith(format(from, "yyyy-MM-dd")));
  }, [orders, range]);

  const metrics = useMemo(() => {
    const revenue = filtered.reduce((s, o) => s + o.total, 0);
    const cogs = filtered.reduce(
      (s, o) => s + o.items.reduce((x, i) => x + i.costPrice * i.quantity, 0),
      0,
    );
    const profit = revenue - cogs;
    const count = filtered.length;
    const aov = count ? Math.round(revenue / count) : 0;
    return { revenue, profit, count, aov };
  }, [filtered]);

  const daily = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const o of filtered) {
      const key = o.createdAt.slice(0, 10);
      const cur = map.get(key) ?? { revenue: 0, orders: 0 };
      cur.revenue += o.total;
      cur.orders += 1;
      map.set(key, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        label: `${date.slice(8)}/${date.slice(5, 7)}`,
        ...v,
      }));
  }, [filtered]);

  const byCashier = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of filtered) {
      map.set(o.cashierName, (map.get(o.cashierName) ?? 0) + o.total);
    }
    return [...map.entries()].map(([name, revenue]) => ({ name, revenue }));
  }, [filtered]);

  const exportCsv = () => {
    const rows = [
      ["code", "date", "cashier", "total", "method"],
      ...filtered.map((o) => [o.code, o.createdAt, o.cashierName, String(o.total), o.paymentMethod]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doanh-thu-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title="Doanh thu"
        description="Báo cáo từ đơn hàng thực · export CSV"
        actions={<Button variant="outline" onClick={exportCsv}>Export CSV</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["today", "Hôm nay"],
          ["7d", "7 ngày"],
          ["30d", "30 ngày"],
          ["month", "Tháng này"],
        ] as const).map(([id, label]) => (
          <Button key={id} size="sm" variant={range === id ? "default" : "outline"} onClick={() => setRange(id)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-slate-500">Doanh thu</p><p className="text-xl font-bold">{formatVnd(metrics.revenue)}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Lợi nhuận</p><p className="text-xl font-bold">{formatVnd(metrics.profit)}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Số đơn</p><p className="text-xl font-bold">{metrics.count}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Đơn TB</p><p className="text-xl font-bold">{formatVnd(metrics.aov)}</p></Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Doanh thu theo ngày</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1e6)}tr`} />
                <Tooltip formatter={(v: number) => formatVnd(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98133" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-bold">Số đơn</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-4 p-4">
        <h2 className="mb-3 font-bold">Theo nhân viên</h2>
        <ul className="space-y-2">
          {byCashier.map((r) => (
            <li key={r.name} className="flex justify-between text-sm">
              <span>{r.name}</span>
              <span className="font-bold">{formatVnd(r.revenue)}</span>
            </li>
          ))}
          {!byCashier.length ? <li className="text-slate-500">Chưa có dữ liệu trong khoảng này.</li> : null}
        </ul>
      </Card>
    </AppShell>
  );
}
