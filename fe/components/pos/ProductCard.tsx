"use client";

import { Minus, MoreHorizontal, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatVnd } from "@/lib/format";
import { getStockStatus } from "@/data/products";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ProductCard({
  product,
  onAdd,
  onOpenMenu,
  selected,
  onToggleSelect,
  showStock = true,
  mode = "pos",
}: {
  product: Product;
  onAdd?: () => void;
  onOpenMenu?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  showStock?: boolean;
  mode?: "pos" | "manage";
}) {
  const status = getStockStatus(product.stock, product.minStock);
  const disabled = product.stock <= 0;

  return (
    <article className="pos-card relative flex flex-col p-3 sm:p-4">
      {mode === "manage" ? (
        <>
          <label className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="h-4 w-4 accent-[var(--pos-green)]"
            />
          </label>
          <button
            type="button"
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            onClick={onOpenMenu}
            aria-label="Tùy chọn"
          >
            <MoreHorizontal size={16} />
          </button>
        </>
      ) : null}

      <div className="flex flex-1 flex-col items-center pt-2 text-center">
        <div
          className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-3xl sm:h-24 sm:w-24"
          style={{ background: product.imageColor }}
        >
          {product.emoji}
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-slate-900">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-slate-400">{product.sku}</p>
        <p className="mt-2 text-base font-bold text-slate-900">
          {formatVnd(product.sellPrice)}
        </p>
        {showStock ? (
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="text-xs text-slate-500">
              {product.stock} {product.unit}
            </span>
          </div>
        ) : null}
      </div>

      {mode === "pos" ? (
        <button
          type="button"
          className="pos-btn pos-btn-primary mt-3 w-full !min-h-11"
          onClick={onAdd}
          disabled={disabled}
        >
          <Plus size={16} />
          {disabled ? "Hết hàng" : "Thêm"}
        </button>
      ) : null}
    </article>
  );
}

export function AddProductCard({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-[var(--pos-green)] bg-[var(--pos-green-muted)]/40 p-4 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pos-green)] text-white">
        <Plus size={28} />
      </div>
      <p className="text-sm font-semibold text-[var(--pos-green-dark)]">{label}</p>
    </button>
  );
}

export function QtyControl({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--pos-border)] bg-white">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center text-slate-600"
        onClick={onDecrease}
        aria-label="Giảm"
      >
        <Minus size={14} />
      </button>
      <span className="min-w-8 text-center text-sm font-bold">{value}</span>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center text-slate-600"
        onClick={onIncrease}
        aria-label="Tăng"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
