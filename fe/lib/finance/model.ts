export type AccountType = "cash" | "bank" | "ewallet" | "other";

export type TxnKind = "in" | "out" | "transfer";

/** none = không vào lãi lỗ (chuyển khoản, thu/trả nợ, nhập hàng trả ngay). */
export type ProfitClass = "none" | "opex";

export type FinancePackage = "basic" | "advanced" | "pro" | "ai";

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  /** Số dư trước các phiếu trong sổ quỹ */
  openingBalance: number;
  active: boolean;
  minBalance?: number;
}

export interface FinanceTxn {
  id: string;
  at: string;
  kind: TxnKind;
  category: string;
  description: string;
  accountId: string;
  /** Tài khoản nhận khi chuyển tiền */
  counterAccountId?: string;
  amount: number;
  createdBy: string;
  status: "posted";
  method?: string;
  storeName: string;
  party?: string;
  orderId?: string;
  debtId?: string;
  /** sale | debt | purchase | manual | transfer */
  source: "sale" | "debt" | "purchase" | "manual" | "transfer";
  profitClass: ProfitClass;
  attachmentName?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
  active: boolean;
}

export interface AlertRule {
  id: string;
  label: string;
  kind:
    | "low_cash"
    | "overdue_debt"
    | "due_soon"
    | "expense_spike"
    | "negative_cashflow"
    | "revenue_drop"
    | "shift_mismatch";
  enabled: boolean;
  /** Ngưỡng tiền mặt thấp (VND) */
  threshold?: number;
}

export interface Reconciliation {
  id: string;
  shiftId: string;
  employee: string;
  openedAt: string;
  closedAt?: string;
  sales: number;
  expectedCash: number;
  actualCash: number;
  reason?: string;
  status: "open" | "closed";
}

export interface DebtReminder {
  id: string;
  debtId: string;
  partyName: string;
  channel: "zalo" | "sms" | "email";
  at: string;
}

export const INCOME_TYPES = [
  "Khách thanh toán công nợ",
  "Thu bán hàng",
  "Thu khác",
  "Thu hoàn ứng",
  "Thu nhập khác",
] as const;

export const EXPENSE_CATEGORIES = [
  "Nhập hàng",
  "Trả công nợ NCC",
  "Tiền thuê",
  "Điện",
  "Nước",
  "Internet",
  "Lương",
  "Marketing",
  "Vận chuyển",
  "Phí ngân hàng",
  "Chi khác",
] as const;

export const OPEX_CATEGORIES = [
  "Tiền thuê",
  "Điện",
  "Nước",
  "Internet",
  "Lương",
  "Marketing",
  "Vận chuyển",
  "Phí ngân hàng",
  "Chi khác",
] as const;

export function accountForMethod(method: string | undefined): string {
  if (method === "transfer") return "acc_vcb";
  if (method === "qr") return "acc_momo";
  return "acc_cash";
}
