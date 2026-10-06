import type { Order, StoreSettings } from "@/types";
import { formatDateTime, formatVnd } from "@/lib/utils";

export function buildReceiptHtml(order: Order, store?: StoreSettings): string {
  const width = store?.receiptWidth === 58 ? "220px" : "300px";
  const lines = order.items
    .map(
      (i) => `
      <tr>
        <td>${i.productName} x${i.quantity}</td>
        <td style="text-align:right">${formatVnd(i.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${order.code}</title>
  <style>
    body{font-family:ui-monospace,monospace;width:${width};margin:0 auto;padding:12px;font-size:12px}
    h1{font-size:14px;margin:0 0 4px;text-align:center}
    .muted{color:#555;text-align:center;margin-bottom:8px}
    table{width:100%;border-collapse:collapse}
    td{padding:3px 0;vertical-align:top}
    .total{font-weight:700;font-size:14px;margin-top:8px}
    hr{border:none;border-top:1px dashed #999;margin:8px 0}
  </style></head><body>
  <h1>${store?.name ?? "Dolphin POS"}</h1>
  <div class="muted">${store?.address ?? ""}<br/>${store?.phone ?? ""}</div>
  <div>Mã: ${order.code}<br/>${formatDateTime(order.createdAt)}<br/>NV: ${order.cashierName}</div>
  <hr/><table>${lines}</table><hr/>
  <div>Tạm tính: ${formatVnd(order.subtotal)}</div>
  <div>Giảm giá: ${formatVnd(order.discount)}</div>
  <div class="total">Tổng: ${formatVnd(order.total)}</div>
  <div>TT: ${order.paymentMethod}${order.changeDue != null ? ` · Thừa ${formatVnd(order.changeDue)}` : ""}</div>
  <hr/><div class="muted">Cảm ơn quý khách!</div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}</script>
  </body></html>`;
}

export function printReceipt(order: Order, store?: StoreSettings) {
  const w = window.open("", "_blank", "width=400,height=700");
  if (!w) return;
  w.document.write(buildReceiptHtml(order, store));
  w.document.close();
}
