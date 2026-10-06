"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
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
import { subDays, format, differenceInDays, parseISO } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { db, getStockStatus } from "@/lib/db";
import { cn, formatDateTime, formatVnd, todayKey } from "@/lib/utils";

type ChartRange = 7 | 30;

function ChartTooltip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-emerald-600">
        {money ? formatVnd(v) : `${v} đơn`}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const products = useLiveQuery(() => db.products.toArray());
  const orders = useLiveQuery(() =>
    db.orders.orderBy("createdAt").reverse().toArray(),
  );
  const debts = useLiveQuery(() => db.debts.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const settings = useLiveQuery(() => db.settings.get("store"));
  const [range, setRange] = useState<ChartRange>(7);
  const [highlight, setHighlight] = useState<
    "revenue" | "orders" | "low" | "recv" | "pay" | null
  >(null);

  const ready = products && orders && debts && customers;

  const stats = useMemo(() => {
    if (!ready) return null;
    const today = todayKey();
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
    const todayRevenue = todayOrders
      .filter((o) => o.status !== "void")
      .reduce((s, o) => s + o.total, 0);
    const low = products.filter(
      (p) => getStockStatus(p.stock, p.minStock) !== "in_stock",
    );
    const receivable = debts
      .filter((d) => d.type === "receivable" && d.status !== "paid")
      .reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const payable = debts
      .filter((d) => d.type === "payable" && d.status !== "paid")
      .reduce((s, d) => s + (d.amount - d.paidAmount), 0);

    const days = Array.from({ length: range }, (_, i) => {
      const d = subDays(new Date(), range - 1 - i);
      const key = format(d, "yyyy-MM-dd");
      const dayOrders = orders.filter(
        (o) => o.createdAt.startsWith(key) && o.status !== "void",
      );
      return {
        label: format(d, range === 30 ? "dd/MM" : "dd/MM"),
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      };
    });

    const soldMap = new Map<
      string,
      { name: string; sold: number; revenue: number }
    >();
    for (const o of orders) {
      for (const item of o.items) {
        const cur = soldMap.get(item.productId) ?? {
          name: item.productName,
          sold: 0,
          revenue: 0,
        };
        cur.sold += item.quantity;
        cur.revenue += item.lineTotal;
        soldMap.set(item.productId, cur);
      }
    }
    const top = [...soldMap.values()]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const ai = customers
      .map((c) => {
        const daysAgo = c.lastPurchaseAt
          ? differenceInDays(new Date("2026-10-06"), parseISO(c.lastPurchaseAt))
          : 999;
        return { ...c, daysAgo };
      })
      .filter((c) => c.daysAgo >= 20)
      .sort((a, b) => b.daysAgo - a.daysAgo)
      .slice(0, 3);

    return {
      todayRevenue,
      todayCount: todayOrders.length,
      lowCount: low.length,
      low,
      receivable,
      payable,
      days,
      top,
      recent: orders.slice(0, 5),
      ai,
    };
  }, [ready, products, orders, debts, customers, range]);

  const kpi = stats
    ? [
        {
          id: "revenue" as const,
          label: "Doanh thu hôm nay",
          value: formatVnd(stats.todayRevenue),
          icon: Receipt,
          href: "/doanh-thu",
        },
        {
          id: "orders" as const,
          label: "Đơn hôm nay",
          value: String(stats.todayCount),
          icon: ShoppingBag,
          href: "/don-hang",
        },
        {
          id: "low" as const,
          label: "Sắp hết / hết",
          value: String(stats.lowCount),
          icon: AlertTriangle,
          href: "/kho",
        },
        {
          id: "recv" as const,
          label: "Công nợ cần thu",
          value: formatVnd(stats.receivable),
          icon: Wallet,
          href: "/cong-no",
        },
        {
          id: "pay" as const,
          label: "Công nợ cần trả",
          value: formatVnd(stats.payable),
          icon: Package,
          href: "/cong-no",
        },
      ]
    : [];

  return (
    <AppShell>
      <PageHeader
        title="Tổng quan"
        description={`${settings?.name ?? "Cửa hàng"} · dữ liệu real-time từ IndexedDB`}
        actions={
          <Link href="/ban-hang">
            <Button>
              <ShoppingBag size={16} />
              Mở bán hàng
            </Button>
          </Link>
        }
      />

      {!stats ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            {kpi.map((s) => (
              <Link key={s.label} href={s.href} className="block">
                <Card
                  className={cn(
                    "h-full p-4 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-sm",
                    highlight === s.id && "ring-2 ring-emerald-500",
                  )}
                  onMouseEnter={() => setHighlight(s.id)}
                  onMouseLeave={() => setHighlight(null)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-slate-500">{s.label}</p>
                      <p className="mt-1 text-xl font-bold">{s.value}</p>
                    </div>
                    <div className="rounded-[10px] bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950">
                      <s.icon size={18} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <h2 className="font-bold">Biểu đồ</h2>
            <div className="flex gap-1 rounded-full border p-0.5">
              {([7, 30] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRange(n)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    range === n
                      ? "bg-emerald-500 text-white"
                      : "text-slate-500",
                  )}
                >
                  {n} ngày
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 grid gap-4 xl:grid-cols-3">
            <Card className="p-4 xl:col-span-2">
              <h3 className="mb-3 text-sm font-bold text-slate-500">
                Doanh thu {range} ngày
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={range === 30 ? 4 : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        `${Math.round(Number(v) / 1e6)}tr`
                      }
                    />
                    <Tooltip content={<ChartTooltip money />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      fill="#10B98133"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-500">
                Đơn hàng {range} ngày
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval={range === 30 ? 4 : 0}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="orders"
                      fill="#3B82F6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="p-4">
              <h2 className="mb-3 font-bold">Top sản phẩm</h2>
              {stats.top.length === 0 ? (
                <EmptyState
                  title="Chưa có doanh số"
                  description="Bán đơn đầu để xem top SP."
                  action={
                    <Link href="/ban-hang">
                      <Button size="sm">Mở bán hàng</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {stats.top.map((p, i) => (
                    <li
                      key={p.name}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.sold} · {formatVnd(p.revenue)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold">Đơn gần đây</h2>
                <Link
                  href="/don-hang"
                  className="text-xs font-semibold text-emerald-600"
                >
                  Xem tất cả
                </Link>
              </div>
              {stats.recent.length === 0 ? (
                <EmptyState title="Chưa có đơn" />
              ) : (
                <ul className="space-y-2">
                  {stats.recent.map((o) => (
                    <li key={o.id}>
                      <Link
                        href="/don-hang"
                        className="flex items-center justify-between rounded-[10px] bg-slate-50 px-3 py-2 transition hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40"
                      >
                        <div>
                          <p className="text-sm font-semibold">{o.code}</p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(o.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {formatVnd(o.total)}
                          </p>
                          <Badge status={o.paymentMethod} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 dark:from-emerald-950 dark:to-slate-900">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles size={16} />
                Dolphin AI
              </div>
              <p className="text-sm font-semibold">
                Khách lâu chưa mua — nhắc quay lại.
              </p>
              {stats.ai.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                  Chưa có gợi ý — khi khách &gt; 20 ngày không mua sẽ hiện ở đây.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {stats.ai.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-[10px] bg-white/80 p-3 text-sm dark:bg-slate-900/60"
                    >
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-xs text-slate-500">
                        Cách {a.daysAgo} ngày · {a.points} điểm
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Link
                          href={`/ban-hang?customer=${a.id}`}
                          className="flex-1"
                        >
                          <Button size="sm" className="w-full">
                            Tạo đơn
                          </Button>
                        </Link>
                        <a href={`tel:${a.phone}`} className="flex-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            Gọi
                          </Button>
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/khach-hang" className="mt-3 block">
                <Button className="w-full" size="sm" variant="secondary">
                  Xem khách hàng
                </Button>
              </Link>
            </Card>
          </div>

          {stats.lowCount > 0 ? (
            <Card className="mt-4 border-amber-300 bg-amber-50/80 p-4 dark:bg-amber-950/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
                  <AlertTriangle size={18} />
                  {stats.lowCount} SKU sắp hết / hết hàng
                </div>
                <Link href="/kho">
                  <Button size="sm" variant="outline">
                    Mở kho
                  </Button>
                </Link>
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {stats.low.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium dark:bg-slate-900"
                  >
                    {p.name} · {p.stock} {p.unit}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
