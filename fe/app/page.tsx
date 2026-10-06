"use client";

import Link from "next/link";
import { useMemo } from "react";
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
import { subDays, format } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db, getStockStatus } from "@/lib/db";
import { formatDateTime, formatVnd, todayKey } from "@/lib/utils";

export default function DashboardPage() {
  const products = useLiveQuery(() => db.products.toArray());
  const orders = useLiveQuery(() =>
    db.orders.orderBy("createdAt").reverse().toArray(),
  );
  const debts = useLiveQuery(() => db.debts.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const settings = useLiveQuery(() => db.settings.get("store"));

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

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, "yyyy-MM-dd");
      const dayOrders = orders.filter((o) => o.createdAt.startsWith(key));
      return {
        label: format(d, "dd/MM"),
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      };
    });

    const soldMap = new Map<string, { name: string; sold: number; revenue: number }>();
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
      .filter((c) => c.group.includes("cát") || c.group.includes("quay lại"))
      .slice(0, 3)
      .map((c) => ({
        name: c.name,
        insight: c.lastPurchaseAt
          ? `Mua lần cuối: ${formatDateTime(c.lastPurchaseAt)}`
          : "Chưa có giao dịch",
      }));

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
  }, [ready, products, orders, debts, customers]);

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
            {[
              { label: "Doanh thu hôm nay", value: formatVnd(stats.todayRevenue), icon: Receipt },
              { label: "Đơn hôm nay", value: String(stats.todayCount), icon: ShoppingBag },
              { label: "Sắp hết / hết", value: String(stats.lowCount), icon: AlertTriangle },
              { label: "Công nợ cần thu", value: formatVnd(stats.receivable), icon: Wallet },
              { label: "Công nợ cần trả", value: formatVnd(stats.payable), icon: Package },
            ].map((s) => (
              <Card key={s.label} className="p-4">
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
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card className="p-4 xl:col-span-2">
              <h2 className="mb-3 font-bold">Doanh thu 7 ngày</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(Number(v) / 1e6)}tr`} />
                    <Tooltip formatter={(v: number) => formatVnd(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98133" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-4">
              <h2 className="mb-3 font-bold">Đơn hàng 7 ngày</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="p-4">
              <h2 className="mb-3 font-bold">Top sản phẩm</h2>
              {stats.top.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có đơn — hãy bán đơn đầu tiên.</p>
              ) : (
                <ul className="space-y-3">
                  {stats.top.map((p, i) => (
                    <li key={p.name} className="flex items-center gap-3 text-sm">
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
              <h2 className="mb-3 font-bold">Đơn gần đây</h2>
              <ul className="space-y-2">
                {stats.recent.map((o) => (
                  <li key={o.id} className="flex items-center justify-between rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <div>
                      <p className="text-sm font-semibold">{o.code}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatVnd(o.total)}</p>
                      <Badge status={o.paymentMethod} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 dark:from-emerald-950 dark:to-slate-900">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                <Sparkles size={16} />
                Dolphin AI
              </div>
              <p className="text-sm font-semibold">
                Gợi ý khách có khả năng quay lại mua cát / thức ăn.
              </p>
              <ul className="mt-3 space-y-2">
                {stats.ai.map((a) => (
                  <li key={a.name} className="rounded-[10px] bg-white/80 p-3 text-sm dark:bg-slate-900/60">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.insight}</p>
                  </li>
                ))}
              </ul>
              <Link href="/khach-hang" className="mt-3 block">
                <Button className="w-full" size="sm">Xem khách hàng</Button>
              </Link>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
