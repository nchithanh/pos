import { tr } from "@/lib/i18n/translate";
import type { PaymentMethod } from "@/types";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  qr: "QR",
  split: "Tách bill",
  debt: "Ghi nợ",
};

export function paymentLabel(method: PaymentMethod): string {
  return tr(PAYMENT_LABELS[method] ?? method);
}
