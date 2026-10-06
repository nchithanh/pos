import { db } from "@/lib/db";
import { normalizeEInvoiceConfig } from "@/lib/einvoice-config";
import type { EInvoiceMock, Order } from "@/types";

export async function getEInvoiceConfig() {
  const settings = await db.settings.get("store");
  return normalizeEInvoiceConfig(settings?.eInvoice);
}

export async function issueMockEInvoice(
  orderId: string,
  input: Omit<
    EInvoiceMock,
    | "number"
    | "issuedAt"
    | "provider"
    | "invoiceSeries"
    | "invoiceTemplateLabel"
    | "storeLabel"
    | "accountLabel"
  >,
): Promise<Order> {
  const order = await db.orders.get(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (order.eInvoice) throw new Error("Đơn này đã có hóa đơn demo");

  const cfg = await getEInvoiceConfig();
  if (cfg.provider === "none" || !cfg.connected) {
    throw new Error(
      "Chưa kết nối hóa đơn điện tử — mở Cài đặt → Hóa đơn điện tử",
    );
  }

  const seqRow = await db.meta.get("eInvoiceSeq");
  const seq = Number(seqRow?.value ?? "1233") + 1;
  await db.meta.put({ key: "eInvoiceSeq", value: String(seq) });

  const eInvoice: EInvoiceMock = {
    ...input,
    number: String(seq).padStart(8, "0"),
    issuedAt: new Date().toISOString(),
    provider: "sepay",
    invoiceSeries: cfg.invoiceSeries,
    invoiceTemplateLabel: cfg.invoiceTemplateLabel,
    storeLabel: cfg.storeLabel,
    accountLabel: cfg.accountLabel,
  };

  await db.orders.update(orderId, { eInvoice });
  const updated = await db.orders.get(orderId);
  if (!updated) throw new Error("Cập nhật hóa đơn thất bại");
  return updated;
}
