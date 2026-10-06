import { db } from "@/lib/db";
import { normalizeEInvoiceConfig } from "@/lib/einvoice-config";
import { sepaySimGetToken, sepaySimIssueFlow } from "@/lib/services/sepay-simulator";
import type { EInvoiceMock, Order } from "@/types";

export async function getEInvoiceConfig() {
  const settings = await db.settings.get("store");
  return normalizeEInvoiceConfig(settings?.eInvoice);
}

export async function checkEInvoiceConnection(): Promise<{
  ok: boolean;
  message: string;
  mode: "simulator" | "sandbox";
}> {
  const cfg = await getEInvoiceConfig();
  if (cfg.provider === "none") {
    return { ok: false, message: "Chưa chọn nhà cung cấp", mode: cfg.mode };
  }
  if (cfg.mode === "sandbox") {
    return {
      ok: false,
      message:
        "Sandbox thật cần client_id/secret + API server — đang dùng Simulator",
      mode: "sandbox",
    };
  }
  await sepaySimGetToken();
  return {
    ok: true,
    message: "Simulator: token OK (theo contract SePay docs)",
    mode: "simulator",
  };
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
    | "trackingCode"
    | "trackingUrl"
    | "status"
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

  if (cfg.mode === "sandbox") {
    throw new Error(
      "Sandbox SePay thật chưa cấu hình credential — chuyển mode Simulator trong Cài đặt",
    );
  }

  const { created, tracking } = await sepaySimIssueFlow({
    provider_account_id: cfg.providerAccountId,
    template_code: "2",
    invoice_series: cfg.invoiceSeries,
    seller_store_xid: cfg.sellerStoreXid,
    is_draft: false,
    buyer: {
      name: input.companyName,
      tax_code: input.taxCode,
      address: input.address,
      email: input.email,
      type: input.customerType,
    },
    items: order.items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      amount: i.lineTotal,
    })),
    amount: order.total,
  });

  const seqRow = await db.meta.get("eInvoiceSeq");
  const seq = Number(seqRow?.value ?? "1233") + 1;
  await db.meta.put({ key: "eInvoiceSeq", value: String(seq) });

  const eInvoice: EInvoiceMock = {
    ...input,
    number: tracking.invoice_number ?? String(seq).padStart(8, "0"),
    issuedAt: new Date().toISOString(),
    provider: "sepay",
    invoiceSeries: cfg.invoiceSeries,
    invoiceTemplateLabel: cfg.invoiceTemplateLabel,
    storeLabel: cfg.storeLabel,
    accountLabel: cfg.accountLabel,
    trackingCode: created.tracking_code,
    trackingUrl: created.tracking_url,
    status: tracking.status === "issued" ? "issued" : "processing",
  };

  await db.orders.update(orderId, { eInvoice });
  const updated = await db.orders.get(orderId);
  if (!updated) throw new Error("Cập nhật hóa đơn thất bại");
  return updated;
}
