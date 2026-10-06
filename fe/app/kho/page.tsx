"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Package } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchBar } from "@/components/ui/SearchBar";
import { getStockStatus } from "@/data/products";
import { formatVnd } from "@/lib/format";
import { usePosStore } from "@/store/usePosStore";

export default function InventoryPage() {
  const products = usePosStore((s) => s.products);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low" | "out">("all");

  const stats = useMemo(() => {
    const totalQty = products.reduce((s, p) => s + p.stock, 0);
    const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
    const low = products.filter((p) => getStockStatus(p.stock, p.minStock) === "low").length;
    const out = products.filter((p) => getStockStatus(p.stock, p.minStock) === "out").length;
    return { totalQty, totalValue, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const status = getStockStatus(p.stock, p.minStock);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, query, statusFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Kho hàng"
        description="Theo dõi tồn kho và luân chuyển nhập / xuất"
        actions={
          <>
            <Link href="/kho/nhap" className="pos-btn pos-btn-primary">
              <ArrowDownToLine size={16} />
              Nhập kho
            </Link>
            <Link href="/kho/xuat" className="pos-btn pos-btn-outline">
              <ArrowUpFromLine size={16} />
              Xuất kho
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tổng tồn kho" value={`${stats.totalQty}`} icon={Package} tone="green" />
        <StatCard label="Giá trị tồn" value={formatVnd(stats.totalValue)} tone="sky" />
        <StatCard label="Sắp hết" value={String(stats.low)} tone="amber" />
        <StatCard label="Hết hàng" value={String(stats.out)} tone="rose" />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm trong kho..."
          className="flex-1"
          rect
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Tất cả"],
              ["in_stock", "Còn hàng"],
              ["low", "Sắp hết"],
              ["out", "Hết hàng"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                statusFilter === id
                  ? "border-[var(--pos-green)] bg-[var(--pos-green)] text-white"
                  : "border-[var(--pos-border)] bg-white"
              }`}
              onClick={() => setStatusFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((p) => {
          const status = getStockStatus(p.stock, p.minStock);
          return (
            <article key={p.id} className="pos-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.sku}</p>
                </div>
                <StatusBadge status={status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">Tồn kho</p>
                  <p className="font-semibold">
                    {p.stock} {p.unit}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Tối thiểu</p>
                  <p className="font-semibold">{p.minStock}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="pos-card mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-[var(--pos-border)] bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Sản phẩm</th>
              <th className="px-4 py-3 font-semibold">Tồn kho</th>
              <th className="px-4 py-3 font-semibold">Mức tối thiểu</th>
              <th className="px-4 py-3 font-semibold">Giá trị</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[var(--pos-border)] last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.sku}</p>
                </td>
                <td className="px-4 py-3">
                  {p.stock} {p.unit}
                </td>
                <td className="px-4 py-3">{p.minStock}</td>
                <td className="px-4 py-3">{formatVnd(p.stock * p.costPrice)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={getStockStatus(p.stock, p.minStock)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
