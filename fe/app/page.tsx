"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DASHBOARD_STATS } from "@/data/dashboard";
import { AI_SUGGESTIONS } from "@/data/customers";
import { getStockStatus } from "@/data/products";
import { formatDateTime, formatVnd } from "@/lib/format";
import { usePosStore } from "@/store/usePosStore";

export default function DashboardPage() {
  const products = usePosStore((s) => s.products);
  const orders = usePosStore((s) => s.orders);
  const debts = usePosStore((s) => s.debts);

  const lowStock = products.filter(
    (p) => getStockStatus(p.stock, p.minStock) !== "in_stock",
  );
  const receivable = debts
    .filter((d) => d.type === "receivable" && d.status !== "paid")
    .reduce((s, d) => s + (d.amount - d.paidAmount), 0);
  const payable = debts
    .filter((d) => d.type === "payable" && d.status !== "paid")
    .reduce((s, d) => s + (d.amount - d.paidAmount), 0);

  const chartData = DASHBOARD_STATS.revenue7Days.map((d) => ({
    ...d,
    label: d.date.slice(8) + "/" + d.date.slice(5, 7),
  }));

  return (
    <AppShell>
      <PageHeader
        title="Tổng quan"
        description="Pet Dolphin Store · hiệu suất bán hàng hôm nay"
        actions={
          <Link href="/ban-hang" className="pos-btn pos-btn-primary">
            <ShoppingBag size={16} />
            Mở bán hàng
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard
          label="Doanh thu hôm nay"
          value={formatVnd(DASHBOARD_STATS.todayRevenue)}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Đơn hôm nay"
          value={String(DASHBOARD_STATS.todayOrders)}
          icon={Receipt}
          tone="sky"
        />
        <StatCard
          label="Sản phẩm sắp hết"
          value={String(lowStock.length)}
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Công nợ cần thu"
          value={formatVnd(receivable)}
          icon={Wallet}
          tone="default"
        />
        <StatCard
          label="Công nợ cần trả"
          value={formatVnd(payable)}
          icon={Package}
          tone="rose"
          hint="Nhà cung cấp"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="pos-card p-4 xl:col-span-2">
          <h2 className="mb-3 text-base font-bold">Doanh thu 7 ngày</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
                />
                <Tooltip
                  formatter={(v: number) => formatVnd(v)}
                  labelFormatter={(l) => `Ngày ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  fill="url(#rev)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pos-card p-4">
          <h2 className="mb-3 text-base font-bold">Đơn hàng 7 ngày</h2>
          <div className="h-56 w-full">
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="pos-card p-4 xl:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Top sản phẩm bán chạy</h2>
          </div>
          <ul className="space-y-3">
            {DASHBOARD_STATS.topProducts.map((p, i) => (
              <li key={p.productId} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pos-green-soft)] text-xs font-bold text-[var(--pos-green-dark)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    Đã bán {p.sold} · {formatVnd(p.revenue)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="pos-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">Đơn hàng gần đây</h2>
            <Link href="/ban-hang" className="text-xs font-semibold text-[var(--pos-green-dark)]">
              Bán tiếp
            </Link>
          </div>
          <ul className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-[10px] bg-slate-50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{o.code}</p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(o.createdAt)} · {o.cashierName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatVnd(o.total)}</p>
                  <StatusBadge status={o.paymentMethod} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="pos-card p-4">
            <h2 className="mb-2 text-base font-bold">Sản phẩm sắp hết</h2>
            <ul className="space-y-2">
              {lowStock.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <StatusBadge status={getStockStatus(p.stock, p.minStock)} />
                </li>
              ))}
            </ul>
            <Link
              href="/kho"
              className="mt-3 inline-block text-xs font-semibold text-[var(--pos-green-dark)]"
            >
              Xem kho →
            </Link>
          </div>

          <div className="rounded-[12px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
            <p className="text-xs font-bold tracking-wide text-[var(--pos-green-dark)]">
              DOLPHIN AI
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              3 khách hàng có khả năng quay lại mua cát trong 5 ngày tới.
            </p>
            <ul className="mt-3 space-y-2">
              {AI_SUGGESTIONS.slice(0, 2).map((s) => (
                <li key={s.customerId} className="rounded-[10px] bg-white px-3 py-2 text-sm">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.insight}</p>
                </li>
              ))}
            </ul>
            <Link href="/khach-hang" className="pos-btn pos-btn-primary mt-3 w-full !min-h-10">
              Xem đề xuất
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
