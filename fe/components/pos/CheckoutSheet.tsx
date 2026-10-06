"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Printer, Plus, X } from "lucide-react";
import { formatVnd } from "@/lib/format";
import { useShallow } from "zustand/react/shallow";
import { usePosStore, selectCartTotals } from "@/store/usePosStore";
import type { PaymentMethod } from "@/lib/types";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  qr: "QR Code",
};

export function CheckoutSheet({
  open,
  method,
  onClose,
}: {
  open: boolean;
  method: PaymentMethod;
  onClose: () => void;
}) {
  const totals = usePosStore(useShallow(selectCartTotals));
  const checkout = usePosStore((s) => s.checkout);
  const lastCheckoutOrder = usePosStore((s) => s.lastCheckoutOrder);
  const clearLastCheckout = usePosStore((s) => s.clearLastCheckout);
  const addToast = usePosStore((s) => s.addToast);
  const [cash, setCash] = useState("");
  const [done, setDone] = useState(false);

  const cashNum = Number(cash) || 0;
  const change = useMemo(
    () => Math.max(0, cashNum - totals.total),
    [cashNum, totals.total],
  );

  if (!open) return null;

  const successOrder = done ? lastCheckoutOrder : null;

  const handlePay = () => {
    const order = checkout(method, method === "cash" ? cashNum : undefined);
    if (order) setDone(true);
  };

  const handleClose = () => {
    setDone(false);
    setCash("");
    clearLastCheckout();
    onClose();
  };

  return (
    <>
      <button
        type="button"
        className="pos-sheet-backdrop"
        aria-label="Đóng"
        onClick={handleClose}
      />
      <div className="pos-sheet p-4 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:rounded-[16px] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {successOrder ? "Thanh toán thành công" : "Xác nhận thanh toán"}
          </h2>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            onClick={handleClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {successOrder ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--pos-green-soft)] text-[var(--pos-green-dark)]">
              <CheckCircle2 size={36} />
            </div>
            <p className="text-2xl font-bold">{formatVnd(successOrder.total)}</p>
            <p className="mt-2 text-sm text-slate-500">Mã đơn {successOrder.code}</p>
            <p className="text-sm text-slate-500">
              {METHOD_LABEL[successOrder.paymentMethod]}
            </p>
            <div className="mt-6 grid w-full grid-cols-2 gap-2">
              <button
                type="button"
                className="pos-btn pos-btn-outline"
                onClick={() => addToast("info", "Đã gửi lệnh in hóa đơn (mock)")}
              >
                <Printer size={16} />
                In hóa đơn
              </button>
              <button
                type="button"
                className="pos-btn pos-btn-primary"
                onClick={handleClose}
              >
                <Plus size={16} />
                Đơn mới
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto">
            <div className="rounded-[10px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Tổng tiền</p>
              <p className="text-2xl font-bold">{formatVnd(totals.total)}</p>
              <p className="mt-1 text-sm text-slate-500">
                Phương thức: {METHOD_LABEL[method]}
              </p>
            </div>

            {method === "cash" ? (
              <div className="space-y-2">
                <label className="block">
                  <span className="pos-label">Tiền khách đưa</span>
                  <input
                    type="number"
                    className="pos-input pos-input-rect"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    placeholder="Nhập số tiền"
                    autoFocus
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {[totals.total, 500_000, 1_000_000, 2_000_000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="rounded-full border border-[var(--pos-border)] px-3 py-1.5 text-xs font-semibold"
                      onClick={() => setCash(String(v))}
                    >
                      {formatVnd(v)}
                    </button>
                  ))}
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Tiền thừa: {formatVnd(change)}
                </p>
              </div>
            ) : (
              <p className="rounded-[10px] bg-[var(--pos-green-muted)] p-3 text-sm text-[var(--pos-green-dark)]">
                {method === "qr"
                  ? "Khách quét QR trên máy tính tiền / app ngân hàng rồi xác nhận."
                  : "Xác nhận khi tiền đã vào tài khoản cửa hàng."}
              </p>
            )}

            <button
              type="button"
              className="pos-btn pos-btn-primary w-full"
              onClick={handlePay}
            >
              Xác nhận thanh toán
            </button>
          </div>
        )}
      </div>
    </>
  );
}
