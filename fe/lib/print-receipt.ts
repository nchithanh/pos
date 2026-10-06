import type { Order, StoreSettings } from "@/types";
import { paymentLabel } from "@/lib/payment-labels";
import { formatDateTime, formatVnd } from "@/lib/utils";

export function buildReceiptHtml(order: Order, store?: StoreSettings): string {
  const widthPx = store?.receiptWidth === 58 ? 220 : 300;
  const lines = order.items
    .map((i) => {
      const unit = `${i.quantity} x ${formatVnd(i.unitPrice)}`;
      return `
      <div class="line">
        <div class="name">${escapeHtml(i.productName)}</div>
        <div class="row">
          <span>${escapeHtml(unit)}</span>
          <span>${formatVnd(i.lineTotal)}</span>
        </div>
      </div>`;
    })
    .join("");

  const cashBlock =
    order.paymentMethod === "cash" && order.cashReceived != null
      ? `<div class="row"><span>Khách đưa</span><span>${formatVnd(order.cashReceived)}</span></div>
         <div class="row"><span>Tiền thừa</span><span>${formatVnd(order.changeDue ?? 0)}</span></div>`
      : "";

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"/><title>Bill ${escapeHtml(order.code)}</title>
  <style>
    @page { size: ${widthPx}px auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      font-family: ui-monospace, "Courier New", monospace;
      width: ${widthPx}px;
      margin: 0 auto;
      padding: 8px 0;
      font-size: 12px;
      color: #111;
      line-height: 1.35;
    }
    .center { text-align: center; }
    .store { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
    .muted { color: #444; }
    .hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    .line { margin-bottom: 6px; }
    .name { font-weight: 600; }
    .total { font-weight: 700; font-size: 14px; margin-top: 4px; }
    .foot { margin-top: 10px; }
  </style></head><body>
  <div class="center">
    <p class="store">${escapeHtml(store?.name ?? "Dolphin POS")}</p>
    <p class="muted">${escapeHtml(store?.slogan ?? "")}</p>
    <p class="muted">${escapeHtml(store?.address ?? "")}</p>
    <p class="muted">${escapeHtml(store?.phone ?? "")}</p>
  </div>
  <hr class="hr"/>
  <div>Đơn hàng: ${escapeHtml(order.code)}</div>
  <div>Ngày: ${formatDateTime(order.createdAt)}</div>
  <div>Thu ngân: ${escapeHtml(order.cashierName)}</div>
  ${order.customerName ? `<div>Khách: ${escapeHtml(order.customerName)}</div>` : ""}
  <hr class="hr"/>
  <div style="font-weight:700;margin-bottom:6px">SẢN PHẨM</div>
  ${lines}
  <hr class="hr"/>
  <div class="row"><span>Tạm tính</span><span>${formatVnd(order.subtotal)}</span></div>
  <div class="row"><span>Giảm giá</span><span>${formatVnd(order.discount)}</span></div>
  ${order.tax > 0 ? `<div class="row"><span>Thuế</span><span>${formatVnd(order.tax)}</span></div>` : ""}
  <div class="row total"><span>TỔNG CỘNG</span><span>${formatVnd(order.total)}</span></div>
  <div style="margin-top:6px">Thanh toán: ${escapeHtml(paymentLabel(order.paymentMethod))}</div>
  ${cashBlock}
  <hr class="hr"/>
  <div class="center foot muted">${escapeHtml(store?.billFooter ?? "Cảm ơn quý khách!\\nHẹn gặp lại lần sau").replaceAll("\\n", "<br/>").replaceAll("\n", "<br/>")}</div>
  <script>window.onload=function(){window.focus();window.print();}</script>
  </body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Open a print-only window with the receipt (thermal-friendly width). */
export function printReceipt(order: Order, store?: StoreSettings) {
  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) return;
  w.document.write(buildReceiptHtml(order, store));
  w.document.close();
}

/** Print the in-page receipt node marked with data-receipt-print. */
export function printReceiptNode() {
  window.print();
}
