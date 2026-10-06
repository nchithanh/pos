"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill, WarehouseNav } from "@/components/kho/warehouse-nav";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db, getStockStatus } from "@/lib/db";
import { availableQty, reservedQty, useWarehouseStore } from "@/stores/warehouse-store";
import { formatDateTime, formatVnd } from "@/lib/utils";
import type { Product } from "@/types";

export default function StockPage() {
  const products = useLiveQuery(() => db.products.toArray());
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const movements = useLiveQuery(() => db.movements.toArray()) ?? [];
  const outbounds = useWarehouseStore((s) => s.outbounds);
  const damaged = useWarehouseStore((s) => s.damaged);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [level, setLevel] = useState("all");
  const [filters, setFilters] = useState(false);
  const [picked, setPicked] = useState<Product | null>(null);

  const rows = useMemo(() => {
    return (products ?? [])
      .map((p) => {
        const reserved = reservedQty(outbounds, p.id);
        const dmg = damaged[p.id] ?? 0;
        const available = availableQty(p.stock, dmg, reserved);
        const st = !p.active
          ? "Ngừng kinh doanh"
          : p.stock <= 0
            ? "Hết hàng"
            : getStockStatus(p.stock, p.minStock) === "low"
              ? "Sắp hết"
              : "Còn hàng";
        return { p, reserved, dmg, available, st };
      })
      .filter((r) => {
        const blob = `${r.p.name} ${r.p.sku} ${r.p.barcode ?? ""}`.toLowerCase();
        if (q && !blob.includes(q.toLowerCase())) return false;
        if (cat !== "all" && r.p.categoryId !== cat) return false;
        if (level === "low" && r.st !== "Sắp hết") return false;
        if (level === "out" && r.st !== "Hết hàng") return false;
        return true;
      });
  }, [products, outbounds, damaged, q, cat, level]);

  const history = (picked
    ? movements.filter((m) => m.items.some((i) => i.productId === picked.id))
    : []
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AppShell>
      <PageHeader
        title="Tồn kho"
        description="Tồn khả dụng = tồn hiện tại − hàng giữ chỗ − hàng hỏng."
      />
      <WarehouseNav />
      <div className="mb-3 flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm tên, SKU, barcode"
          aria-label="Tìm sản phẩm"
        />
        <Button variant="outline" className="lg:hidden" onClick={() => setFilters(true)}>
          Bộ lọc
        </Button>
      </div>
      <div className="mb-3 hidden gap-2 lg:flex">
        <FilterSelects cat={cat} setCat={setCat} level={level} setLevel={setLevel} categories={categories} />
      </div>
      {products === undefined ? (
        <p className="text-sm text-slate-500">Đang tải tồn kho…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">Không có sản phẩm khớp bộ lọc.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.p.id}>
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-2 rounded-[10px] border border-slate-200 px-3 py-3 text-left dark:border-slate-700"
                onClick={() => setPicked(r.p)}
              >
                <span>
                  <span className="block font-semibold">{r.p.name}</span>
                  <span className="text-xs text-slate-500">
                    {r.p.sku} · Tồn {r.p.stock} · Giữ {r.reserved} · Khả dụng {r.available}
                  </span>
                </span>
                <StatusPill label={r.st} warn={r.st !== "Còn hàng"} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={filters} onClose={() => setFilters(false)} title="Bộ lọc">
        <div className="space-y-3">
          <FilterSelects cat={cat} setCat={setCat} level={level} setLevel={setLevel} categories={categories} />
          <Button className="w-full" onClick={() => setFilters(false)}>
            Áp dụng
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!picked} onClose={() => setPicked(null)} title="Chi tiết tồn kho" className="max-w-lg">
        {picked ? (
          <StockDetail
            product={picked}
            reserved={reservedQty(outbounds, picked.id)}
            damaged={damaged[picked.id] ?? 0}
            history={history}
          />
        ) : null}
      </Dialog>
    </AppShell>
  );
}

function StockDetail({
  product,
  reserved,
  damaged,
  history,
}: {
  product: Product;
  reserved: number;
  damaged: number;
  history: {
    id: string;
    code: string;
    createdAt: string;
    userName: string;
    reason?: string;
    type: string;
    items: { productId: string; quantity: number; beforeQty?: number; afterQty?: number }[];
  }[];
}) {
  const available = availableQty(product.stock, damaged, reserved);
  return (
    <div className="space-y-3 text-sm">
      <p className="text-lg font-bold">{product.name}</p>
      <p className="text-slate-500">SKU {product.sku}</p>
      <p>Tồn hiện tại: <b>{product.stock}</b> {product.unit}</p>
      <p>Giữ chỗ: <b>{reserved}</b></p>
      <p>Hàng hỏng: <b>{damaged}</b></p>
      <p>Khả dụng: <b>{available}</b></p>
      <p>Tối thiểu: {product.minStock}</p>
      <p>Giá trị tồn: {formatVnd(product.stock * product.costPrice)}</p>
      <p className="text-xs text-slate-400">1 thùng = 12 {product.unit} · đơn vị bán {product.unit}</p>
      <h3 className="pt-2 font-bold">Biến động tồn kho</h3>
      {history.length === 0 ? (
        <p className="text-slate-500">Chưa có phiếu cho sản phẩm này.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-auto">
          {history.slice(0, 12).map((m) => {
            const line = m.items.find((i) => i.productId === product.id);
            const inbound = m.type === "in" || m.type === "return";
            return (
              <li key={m.id} className="rounded-[10px] border border-slate-100 px-3 py-2">
                <p className="font-semibold">
                  {inbound ? "+" : "−"}
                  {line?.quantity ?? 0} · {m.reason ?? m.type} #{m.code}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(m.createdAt)} · {m.userName}
                  {line?.beforeQty != null
                    ? ` · ${line.beforeQty} → ${line.afterQty}`
                    : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterSelects({
  cat,
  setCat,
  level,
  setLevel,
  categories,
}: {
  cat: string;
  setCat: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  categories: { id: string; name: string }[];
}) {
  return (
    <>
      <select
        className="min-h-11 rounded-[10px] border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        value={cat}
        aria-label="Danh mục"
        onChange={(e) => setCat(e.target.value)}
      >
        <option value="all">Mọi danh mục</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className="min-h-11 rounded-[10px] border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        value={level}
        aria-label="Mức tồn"
        onChange={(e) => setLevel(e.target.value)}
      >
        <option value="all">Mọi mức tồn</option>
        <option value="low">Sắp hết</option>
        <option value="out">Hết hàng</option>
      </select>
    </>
  );
}
