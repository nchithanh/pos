"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVnd } from "@/lib/format";
import { usePosStore } from "@/store/usePosStore";

export default function SuppliersPage() {
  const suppliers = usePosStore((s) => s.suppliers);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.includes(q),
    );
  }, [suppliers, query]);

  return (
    <AppShell>
      <PageHeader
        title="Nhà cung cấp"
        description={`${suppliers.length} đối tác đang hợp tác`}
      />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Tìm nhà cung cấp..."
        className="mb-4"
        rect
      />

      {filtered.length === 0 ? (
        <div className="pos-card">
          <EmptyState title="Không tìm thấy nhà cung cấp" icon={Truck} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/nha-cung-cap/${s.id}`}
              className="pos-card block p-4 transition hover:border-[var(--pos-green)]"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[var(--pos-green-soft)] text-[var(--pos-green-dark)]">
                  <Truck size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold">{s.name}</h2>
                  <p className="text-xs text-slate-500">
                    {s.contactPerson} · {s.phone}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[10px] bg-slate-50 p-2">
                  <dt className="text-[11px] text-slate-500">Sản phẩm</dt>
                  <dd className="text-sm font-bold">{s.productCount}</dd>
                </div>
                <div className="rounded-[10px] bg-slate-50 p-2">
                  <dt className="text-[11px] text-slate-500">Tổng mua</dt>
                  <dd className="truncate text-sm font-bold">
                    {formatVnd(s.totalPurchased)}
                  </dd>
                </div>
                <div className="rounded-[10px] bg-amber-50 p-2">
                  <dt className="text-[11px] text-amber-700">Công nợ</dt>
                  <dd className="truncate text-sm font-bold text-amber-800">
                    {formatVnd(s.debt)}
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
