"use client";

import { tr } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { inBranch } from "@/lib/branch";
import { useBranchId } from "@/lib/use-branch";
import { formatDateTime } from "@/lib/utils";
import type { InventoryMovement } from "@/types";

const TYPE_LABEL: Record<string, string> = {
  in: "Nhập kho",
  out: "Xuất kho",
  adjust: "Điều chỉnh",
  sale: "Xuất bán hàng",
  return: "Trả hàng",
};

export default function MovementPage() {
  const branchId = useBranchId();
  const movements = useLiveQuery(
    () => db.movements.filter((m) => inBranch(m.branchId, branchId)).toArray(),
    [branchId],
  );
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [filters, setFilters] = useState(false);
  const [picked, setPicked] = useState<InventoryMovement | null>(null);
  const nameOf = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  const rows = useMemo(() => {
    return (movements ?? [])
      .filter((m) => {
        if (type !== "all" && m.type !== type) return false;
        const blob = `${m.code} ${m.note ?? ""} ${m.reason ?? ""} ${m.userName} ${m.items.map((i) => nameOf(i.productId)).join(" ")}`.toLowerCase();
        return !q || blob.includes(q.toLowerCase());
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [movements, q, type, products]);

  return (
    <AppShell>
      <PageHeader
        title={tr("Lịch sử kho")}
        description={tr("Mỗi biến động ghi thời điểm, người làm, tồn trước và tồn sau.")}
      />
      <WarehouseNav />
      <div className="mb-3 flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("Tìm sản phẩm, SKU, chứng từ")}
          aria-label={tr("Tìm biến động")}
        />
        <Button variant="outline" className="md:hidden" onClick={() => setFilters(true)}>
          {tr("Bộ lọc")}
        </Button>
        <select
          className="hidden min-h-11 rounded-[10px] border border-slate-200 px-3 text-sm md:block dark:border-slate-700 dark:bg-slate-900"
          value={type}
          aria-label={tr("Loại biến động")}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">{tr("Mọi loại")}</option>
          {Object.entries(TYPE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {movements === undefined ? (
        <p className="text-sm text-slate-500">{tr("Đang tải lịch sử…")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">{tr("Chưa có biến động khớp bộ lọc.")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="w-full rounded-[10px] border border-slate-200 px-3 py-3 text-left text-sm dark:border-slate-700"
                onClick={() => setPicked(m)}
              >
                <span className="font-semibold">
                  {TYPE_LABEL[m.type] ?? m.type} · {m.code}
                </span>
                <span className="block text-xs text-slate-500">
                  {formatDateTime(m.createdAt)} · {m.userName}
                  {m.note ? ` · ${m.note}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={filters} onClose={() => setFilters(false)} title={tr("Bộ lọc")}>
        <select
          className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">{tr("Mọi loại")}</option>
          {Object.entries(TYPE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <Button className="mt-3 w-full" onClick={() => setFilters(false)}>
          {tr("Áp dụng")}
        </Button>
      </Dialog>
      <Dialog open={!!picked} onClose={() => setPicked(null)} title={tr("Chi tiết biến động")}>
        {picked ? (
          <div className="space-y-2 text-sm">
            <p className="font-bold">{picked.code}</p>
            <p>{TYPE_LABEL[picked.type]} · {picked.reason}</p>
            <p className="text-slate-500">
              {formatDateTime(picked.createdAt)} · {picked.userName}
            </p>
            {picked.note ? <p>Chứng từ: {picked.note}</p> : null}
            <ul className="space-y-1">
              {picked.items.map((i) => (
                <li key={i.productId}>
                  {nameOf(i.productId)} · {picked.type === "in" || picked.type === "return" ? "+" : "−"}
                  {i.quantity}
                  {i.beforeQty != null ? ` · ${i.beforeQty} → ${i.afterQty}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
