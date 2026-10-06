import type { EInvoiceConfig } from "@/types";

/** Năm hiện tại → prefix ký hiệu SePay kiểu C26 */
export function currentInvoiceYearPrefix(d = new Date()): string {
  return `C${String(d.getFullYear()).slice(-2)}`;
}

export const EINVOICE_TEMPLATES = [
  { id: "tpl_sale", label: "Hóa đơn bán hàng" },
  { id: "tpl_service", label: "Hóa đơn dịch vụ" },
] as const;

/** Ký hiệu lấy từ “tài khoản” demo — không cho admin tự gõ tự do. */
export function getInvoiceSeriesOptions(d = new Date()) {
  const prefix = currentInvoiceYearPrefix(d);
  return [
    { value: `${prefix}TSE`, label: `${prefix}TSE` },
    { value: `${prefix}TAA`, label: `${prefix}TAA` },
    { value: `${prefix}TAB`, label: `${prefix}TAB` },
  ];
}

export const EINVOICE_STORES = [
  { xid: "store_pmh", label: "Cửa hàng Phú Mỹ Hưng" },
  { xid: "store_q1", label: "Cửa hàng Quận 1" },
  { xid: "store_td", label: "Cửa hàng Thủ Đức" },
] as const;

export const DEFAULT_EINVOICE_CONFIG: EInvoiceConfig = {
  provider: "sepay",
  mode: "simulator",
  connected: true,
  providerAccountId: "acc_demo_petdolphin",
  accountLabel: "CÔNG TY TNHH PET DOLPHIN",
  invoiceTemplateId: "tpl_sale",
  invoiceTemplateLabel: "Hóa đơn bán hàng",
  invoiceSeries: getInvoiceSeriesOptions()[0]!.value,
  sellerStoreXid: "store_pmh",
  storeLabel: "Cửa hàng Phú Mỹ Hưng",
  lastCheckedAt: "2026-10-06T08:00:00.000Z",
};

export function normalizeEInvoiceConfig(
  raw?: Partial<EInvoiceConfig> | null,
): EInvoiceConfig {
  const seriesOpts = getInvoiceSeriesOptions();
  const seriesValues = new Set(seriesOpts.map((s) => s.value));
  const base = { ...DEFAULT_EINVOICE_CONFIG, ...raw };
  if (!seriesValues.has(base.invoiceSeries)) {
    base.invoiceSeries = seriesOpts[0]!.value;
  }
  if (base.mode !== "simulator" && base.mode !== "sandbox") {
    base.mode = "simulator";
  }
  const tpl = EINVOICE_TEMPLATES.find((t) => t.id === base.invoiceTemplateId);
  if (tpl) base.invoiceTemplateLabel = tpl.label;
  const store = EINVOICE_STORES.find((s) => s.xid === base.sellerStoreXid);
  if (store) base.storeLabel = store.label;
  return base;
}
