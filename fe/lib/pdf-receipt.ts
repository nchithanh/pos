import { jsPDF } from "jspdf";
import type { Order, StoreSettings } from "@/types";
import { paymentLabel } from "@/lib/payment-labels";
import { formatDateTime, formatVnd } from "@/lib/utils";

/** Xuất bill PDF (khổ hẹp giống nhiệt 58/80mm). */
export function downloadReceiptPdf(order: Order, store?: StoreSettings) {
  const widthMm = store?.receiptWidth === 58 ? 58 : 80;
  const doc = new jsPDF({
    unit: "mm",
    format: [widthMm, 280],
    orientation: "portrait",
  });

  const margin = 3;
  let y = 6;
  const maxW = widthMm - margin * 2;
  const center = (text: string, size = 9) => {
    doc.setFontSize(size);
    doc.text(text, widthMm / 2, y, { align: "center", maxWidth: maxW });
    y += size * 0.45 + 1.2;
  };
  const row = (left: string, right?: string) => {
    doc.setFontSize(8);
    doc.text(left, margin, y, { maxWidth: maxW * 0.55 });
    if (right) doc.text(right, widthMm - margin, y, { align: "right" });
    y += 4;
  };
  const hr = () => {
    doc.setDrawColor(150);
    doc.line(margin, y, widthMm - margin, y);
    y += 3;
  };

  center(store?.name ?? "Dolphin POS", 11);
  if (store?.slogan) center(store.slogan, 7);
  if (store?.address) center(store.address, 7);
  if (store?.phone) center(store.phone, 7);
  hr();
  row(`Đơn: ${order.code}`);
  row(`Ngày: ${formatDateTime(order.createdAt)}`);
  row(`Thu ngân: ${order.cashierName}`);
  if (order.customerName) row(`Khách: ${order.customerName}`);
  hr();
  doc.setFontSize(8);
  doc.text("SAN PHAM", margin, y);
  y += 4;
  for (const i of order.items) {
    doc.setFontSize(8);
    doc.text(i.productName, margin, y, { maxWidth: maxW });
    y += 3.5;
    row(`${i.quantity} x ${formatVnd(i.unitPrice)}`, formatVnd(i.lineTotal));
  }
  hr();
  row("Tam tinh", formatVnd(order.subtotal));
  row("Giam gia", formatVnd(order.discount));
  if (order.pointsRedeemed) {
    row(
      `Diem (${order.pointsRedeemed})`,
      `-${formatVnd(order.pointsRedeemed * 1000)}`,
    );
  }
  if (order.tax > 0) row("Thue", formatVnd(order.tax));
  doc.setFont("helvetica", "bold");
  row("TONG CONG", formatVnd(order.total));
  doc.setFont("helvetica", "normal");
  row(`TT: ${paymentLabel(order.paymentMethod)}`);
  if (order.paymentMethod === "cash" && order.cashReceived != null) {
    row("Khach dua", formatVnd(order.cashReceived));
    row("Tien thua", formatVnd(order.changeDue ?? 0));
  }
  hr();
  const footer =
    store?.billFooter ?? "Cam on quy khach!\nHen gap lai lan sau";
  for (const line of footer.split("\n")) {
    center(line, 7);
  }

  doc.save(`${order.code}.pdf`);
}
