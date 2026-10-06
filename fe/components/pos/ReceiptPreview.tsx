"use client";

import type { Order, StoreSettings } from "@/types";
import { paymentLabel } from "@/lib/payment-labels";
import { cn, formatDateTime, formatVnd } from "@/lib/utils";

export function ReceiptPreview({
  order,
  store,
  className,
}: {
  order: Order;
  store?: StoreSettings;
  className?: string;
}) {
  const widthClass =
    store?.receiptWidth === 58 ? "max-w-[220px]" : "max-w-[300px]";

  return (
    <div
      data-receipt-print
      className={cn(
        "mx-auto w-full rounded-[10px] border border-dashed border-slate-300 bg-white px-3 py-4 font-mono text-[12px] leading-snug text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100",
        widthClass,
        className,
      )}
    >
      <div className="text-center">
        <p className="text-[15px] font-bold tracking-wide">
          {(store?.name ?? "Dolphin POS").toUpperCase()}
        </p>
        {store?.slogan ? (
          <p className="mt-0.5 text-slate-500">{store.slogan}</p>
        ) : null}
        {store?.address ? (
          <p className="mt-1 text-slate-500">{store.address}</p>
        ) : null}
        {store?.phone ? (
          <p className="text-slate-500">{store.phone}</p>
        ) : null}
      </div>

      <div className="my-3 border-t border-dashed border-slate-300 dark:border-slate-600" />

      <div className="space-y-0.5">
        <p>Đơn hàng: {order.code}</p>
        <p>Ngày: {formatDateTime(order.createdAt)}</p>
        <p>Thu ngân: {order.cashierName}</p>
        <p>Khách: {order.customerName ?? "Khách lẻ"}</p>
      </div>

      <div className="my-3 border-t border-dashed border-slate-300 dark:border-slate-600" />

      <p className="mb-2 font-bold">SẢN PHẨM</p>
      <ul className="space-y-2">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.sku}`}>
            <p className="font-semibold">{item.productName}</p>
            <div className="flex justify-between gap-2 text-slate-600 dark:text-slate-300">
              <span>
                {item.quantity} x {formatVnd(item.unitPrice)}
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatVnd(item.lineTotal)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="my-3 border-t border-dashed border-slate-300 dark:border-slate-600" />

      <div className="space-y-1">
        <div className="flex justify-between gap-2">
          <span>Tạm tính</span>
          <span>{formatVnd(order.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Giảm giá</span>
          <span>{formatVnd(order.discount)}</span>
        </div>
        {order.tax > 0 ? (
          <div className="flex justify-between gap-2">
            <span>Thuế</span>
            <span>{formatVnd(order.tax)}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-2 text-[14px] font-bold">
          <span>TỔNG CỘNG</span>
          <span>{formatVnd(order.total)}</span>
        </div>
      </div>

      <div className="mt-3 space-y-0.5">
        <p>Thanh toán: {paymentLabel(order.paymentMethod)}</p>
        {order.paymentMethod === "cash" && order.cashReceived != null ? (
          <>
            <div className="flex justify-between gap-2">
              <span>Khách đưa</span>
              <span>{formatVnd(order.cashReceived)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Tiền thừa</span>
              <span>{formatVnd(order.changeDue ?? 0)}</span>
            </div>
          </>
        ) : null}
      </div>

      <div className="my-3 border-t border-dashed border-slate-300 dark:border-slate-600" />

      <div className="text-center text-slate-500">
        {(store?.billFooter ?? "Cảm ơn quý khách!\nHẹn gặp lại lần sau")
          .split("\n")
          .map((line) => (
            <p key={line}>{line}</p>
          ))}
      </div>
    </div>
  );
}
