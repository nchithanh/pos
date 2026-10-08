"use client";

import { tr } from "@/lib/i18n/translate";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  accountForMethod,
  type AlertRule,
  type DebtReminder,
  type FinanceAccount,
  type FinanceTxn,
  type Reconciliation,
  type RecurringExpense,
} from "@/lib/finance/model";
import {
  seedAccounts,
  seedAlerts,
  seedRecurring,
  seedTransactions,
} from "@/lib/finance/seed";
import { uid } from "@/lib/utils";
import { readWriteBranchId } from "@/lib/branch";
import type { Order } from "@/types";

interface FinanceState {
  verticalId: string;
  accounts: FinanceAccount[];
  txns: FinanceTxn[];
  recurring: RecurringExpense[];
  alerts: AlertRule[];
  reconciliations: Reconciliation[];
  reminders: DebtReminder[];
  postedSaleIds: string[];
  ensureVertical: (verticalId: string) => void;
  addAccount: (input: {
    name: string;
    type: FinanceAccount["type"];
    openingBalance: number;
  }) => void;
  addTxn: (txn: Omit<FinanceTxn, "id" | "status" | "storeName"> & {
    storeName?: string;
  }) => FinanceTxn;
  addRecurring: (input: Omit<RecurringExpense, "id" | "active">) => void;
  updateAlert: (id: string, patch: Partial<AlertRule>) => void;
  addReminder: (input: Omit<DebtReminder, "id" | "at">) => void;
  closeReconciliation: (input: Omit<Reconciliation, "id" | "status">) => void;
  applySale: (order: Order) => void;
  applyDebtCash: (input: {
    debtId: string;
    type: "receivable" | "payable";
    amount: number;
    method: string;
    partyName: string;
    userName: string;
  }) => void;
  applyPurchasePayment: (input: {
    amount: number;
    method: string;
    code: string;
    supplierName: string;
    userName: string;
  }) => void;
}

function blank(verticalId: string): Pick<
  FinanceState,
  | "verticalId"
  | "accounts"
  | "txns"
  | "recurring"
  | "alerts"
  | "reconciliations"
  | "reminders"
  | "postedSaleIds"
> {
  return {
    verticalId,
    accounts: seedAccounts(),
    txns: seedTransactions(),
    recurring: seedRecurring(),
    alerts: seedAlerts(),
    reconciliations: [],
    reminders: [],
    postedSaleIds: [],
  };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...blank("pet"),

      ensureVertical: (verticalId) => {
        if (get().verticalId === verticalId) return;
        set(blank(verticalId));
      },

      addAccount: (input) => {
        const row: FinanceAccount = {
          id: uid("acc"),
          name: input.name.trim(),
          type: input.type,
          openingBalance: input.openingBalance,
          active: true,
        };
        set({ accounts: [...get().accounts, row] });
      },

      addTxn: (txn) => {
        const row: FinanceTxn = {
          ...txn,
          id: uid("ft"),
          status: "posted",
          storeName: txn.storeName ?? tr("Cửa hàng chính"),
          branchId: txn.branchId ?? readWriteBranchId(),
        };
        set({ txns: [row, ...get().txns] });
        return row;
      },

      addRecurring: (input) => {
        set({
          recurring: [
            ...get().recurring,
            { ...input, id: uid("rx"), active: true },
          ],
        });
      },

      updateAlert: (id, patch) => {
        set({
          alerts: get().alerts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        });
      },

      addReminder: (input) => {
        set({
          reminders: [
            {
              ...input,
              id: uid("rm"),
              at: new Date().toISOString(),
            },
            ...get().reminders,
          ],
        });
      },

      closeReconciliation: (input) => {
        set({
          reconciliations: [
            {
              ...input,
              id: uid("rc"),
              status: "closed",
              closedAt: input.closedAt ?? new Date().toISOString(),
            },
            ...get().reconciliations,
          ],
        });
      },

      applySale: (order) => {
        if (order.status === "void") return;
        if (get().postedSaleIds.includes(order.id)) return;
        const payments =
          order.payments?.filter((p) => p.method !== "debt" && p.amount > 0) ??
          [];
        const rows: FinanceTxn[] = payments.map((p) => ({
          id: uid("ft"),
          at: order.createdAt,
          kind: "in",
          category: tr("Thu bán hàng"),
          description: `Bán hàng #${order.code}`,
          accountId: accountForMethod(p.method),
          amount: p.amount,
          createdBy: order.cashierName,
          status: "posted",
          method: p.method,
          storeName: tr("Cửa hàng chính"),
          party: order.customerName,
          orderId: order.id,
          source: "sale",
          profitClass: "none",
          branchId: readWriteBranchId(),
        }));
        set({
          txns: [...rows, ...get().txns],
          postedSaleIds: [...get().postedSaleIds, order.id],
        });
      },

      applyDebtCash: (input) => {
        const inbound = input.type === "receivable";
        get().addTxn({
          at: new Date().toISOString(),
          kind: inbound ? "in" : "out",
          category: inbound ? tr("Khách thanh toán công nợ") : tr("Trả công nợ NCC"),
          description: inbound
            ? tr("Khách hàng thanh toán công nợ")
            : tr("Thanh toán công nợ nhà cung cấp"),
          accountId: accountForMethod(input.method),
          amount: input.amount,
          createdBy: input.userName,
          method: input.method,
          party: input.partyName,
          debtId: input.debtId,
          source: "debt",
          profitClass: "none",
        });
      },

      applyPurchasePayment: (input) => {
        get().addTxn({
          at: new Date().toISOString(),
          kind: "out",
          category: tr("Nhập hàng"),
          description: `Nhập hàng ${input.code}`,
          accountId: accountForMethod(input.method),
          amount: input.amount,
          createdBy: input.userName,
          method: input.method,
          party: input.supplierName,
          source: "purchase",
          profitClass: "none",
        });
      },
    }),
    { name: "dolphin-pos-finance" },
  ),
);

export function accountBalance(
  accounts: FinanceAccount[],
  txns: FinanceTxn[],
  accountId: string,
) {
  const acc = accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  return txns.reduce((sum, t) => {
    if (t.status !== "posted") return sum;
    if (t.kind === "transfer") {
      if (t.accountId === accountId) return sum - t.amount;
      if (t.counterAccountId === accountId) return sum + t.amount;
      return sum;
    }
    if (t.accountId !== accountId) return sum;
    return sum + (t.kind === "in" ? t.amount : -t.amount);
  }, acc.openingBalance);
}
