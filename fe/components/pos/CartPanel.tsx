"use client";

import { Trash2 } from "lucide-react";
import { formatVnd } from "@/lib/format";
import { QtyControl } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useShallow } from "zustand/react/shallow";
import { usePosStore, selectCartTotals } from "@/store/usePosStore";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/format";

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Tiền mặt" },
  { id: "transfer", label: "Chuyển khoản" },
  { id: "qr", label: "QR" },
];

export function CartPanel({
  paymentMethod,
  onPaymentMethodChange,
  onCheckout,
  compact,
}: {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onCheckout: () => void;
  compact?: boolean;
}) {
  const cart = usePosStore((s) => s.cart);
  const products = usePosStore((s) => s.products);
  const cartDiscount = usePosStore((s) => s.cartDiscount);
  const setCartQty = usePosStore((s) => s.setCartQty);
  const removeFromCart = usePosStore((s) => s.removeFromCart);
  const clearCart = usePosStore((s) => s.clearCart);
  const setCartDiscount = usePosStore((s) => s.setCartDiscount);
  const totals = usePosStore(useShallow(selectCartTotals));

  return (
    <div className={cn("flex h-full flex-col", compact && "min-h-0")}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          Giỏ hàng ({totals.count})
        </h2>
        {cart.length > 0 ? (
          <button
            type="button"
            className="text-xs font-semibold text-rose-600"
            onClick={clearCart}
          >
            Xóa hết
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {cart.length === 0 ? (
          <EmptyState
            title="Giỏ hàng trống"
            description="Chạm Thêm trên sản phẩm để bắt đầu bán."
          />
        ) : (
          cart.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return null;
            return (
              <div
                key={item.productId}
                className="flex items-center gap-3 rounded-[10px] border border-[var(--pos-border)] bg-white p-3"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                  style={{ background: product.imageColor }}
                >
                  {product.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatVnd(product.sellPrice)}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QtyControl
                      value={item.quantity}
                      onDecrease={() =>
                        setCartQty(item.productId, item.quantity - 1)
                      }
                      onIncrease={() =>
                        setCartQty(item.productId, item.quantity + 1)
                      }
                    />
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => removeFromCart(item.productId)}
                      aria-label="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold">
                  {formatVnd(product.sellPrice * item.quantity)}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 space-y-3 border-t border-[var(--pos-border)] pt-3">
        <label className="block">
          <span className="pos-label">Giảm giá (đ)</span>
          <input
            type="number"
            className="pos-input pos-input-rect"
            min={0}
            value={cartDiscount || ""}
            onChange={(e) => setCartDiscount(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </label>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Tạm tính</span>
            <span>{formatVnd(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Giảm giá</span>
            <span>-{formatVnd(totals.discount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Tổng cộng</span>
            <span>{formatVnd(totals.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPaymentMethodChange(m.id)}
              className={cn(
                "rounded-[10px] border px-2 py-2.5 text-xs font-semibold",
                paymentMethod === m.id
                  ? "border-[var(--pos-green)] bg-[var(--pos-green-soft)] text-[var(--pos-green-dark)]"
                  : "border-[var(--pos-border)] bg-white text-slate-600",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pos-btn pos-btn-primary w-full"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          Thanh toán · {formatVnd(totals.total)}
        </button>
      </div>
    </div>
  );
}
