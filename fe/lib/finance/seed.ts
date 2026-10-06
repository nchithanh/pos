import type {
  AlertRule,
  FinanceAccount,
  FinanceTxn,
  RecurringExpense,
} from "@/lib/finance/model";

function atDaysAgo(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 20, 0, 0);
  return d.toISOString();
}

/** Số dư hiện tại demo (sau các phiếu seed). */
const TARGET = {
  acc_cash: 12_500_000,
  acc_vcb: 32_800_000,
  acc_mb: 15_400_000,
  acc_momo: 6_800_000,
};

export function seedTransactions(): FinanceTxn[] {
  const store = "Cửa hàng chính";
  return [
    {
      id: "ft_rent",
      at: atDaysAgo(2, 9),
      kind: "out",
      category: "Tiền thuê",
      description: "Tiền thuê mặt bằng tháng này",
      accountId: "acc_vcb",
      amount: 15_000_000,
      createdBy: "Nguyễn Minh Anh",
      status: "posted",
      method: "transfer",
      storeName: store,
      party: "Chủ nhà Q.7",
      source: "manual",
      profitClass: "opex",
    },
    {
      id: "ft_salary",
      at: atDaysAgo(4, 11),
      kind: "out",
      category: "Lương",
      description: "Lương thu ngân",
      accountId: "acc_vcb",
      amount: 6_000_000,
      createdBy: "Nguyễn Minh Anh",
      status: "posted",
      method: "transfer",
      storeName: store,
      party: "Thu ngân",
      source: "manual",
      profitClass: "opex",
    },
    {
      id: "ft_power",
      at: atDaysAgo(1, 13),
      kind: "out",
      category: "Điện",
      description: "Tiền điện",
      accountId: "acc_cash",
      amount: 650_000,
      createdBy: "Thu ngân",
      status: "posted",
      method: "cash",
      storeName: store,
      source: "manual",
      profitClass: "opex",
    },
    {
      id: "ft_net",
      at: atDaysAgo(6, 10),
      kind: "out",
      category: "Internet",
      description: "Internet cửa hàng",
      accountId: "acc_vcb",
      amount: 500_000,
      createdBy: "Nguyễn Minh Anh",
      status: "posted",
      method: "transfer",
      storeName: store,
      source: "manual",
      profitClass: "opex",
    },
    {
      id: "ft_mkt",
      at: atDaysAgo(3, 16),
      kind: "out",
      category: "Marketing",
      description: "Quảng cáo Facebook cửa hàng",
      accountId: "acc_momo",
      amount: 800_000,
      createdBy: "Nguyễn Minh Anh",
      status: "posted",
      method: "qr",
      storeName: store,
      source: "manual",
      profitClass: "opex",
    },
  ];
}

export function seedAccounts(): FinanceAccount[] {
  const txns = seedTransactions();
  const delta = (id: string) =>
    txns.reduce((s, t) => {
      if (t.kind === "transfer") {
        if (t.accountId === id) return s - t.amount;
        if (t.counterAccountId === id) return s + t.amount;
        return s;
      }
      if (t.accountId !== id) return s;
      return s + (t.kind === "in" ? t.amount : -t.amount);
    }, 0);

  const opening = (id: keyof typeof TARGET) => TARGET[id] - delta(id);

  return [
    {
      id: "acc_cash",
      name: "Tiền mặt",
      type: "cash",
      openingBalance: opening("acc_cash"),
      active: true,
      minBalance: 5_000_000,
    },
    {
      id: "acc_vcb",
      name: "Vietcombank",
      type: "bank",
      openingBalance: opening("acc_vcb"),
      active: true,
    },
    {
      id: "acc_mb",
      name: "MB Bank",
      type: "bank",
      openingBalance: opening("acc_mb"),
      active: true,
    },
    {
      id: "acc_momo",
      name: "MoMo",
      type: "ewallet",
      openingBalance: opening("acc_momo"),
      active: true,
    },
  ];
}

export function seedRecurring(): RecurringExpense[] {
  return [
    {
      id: "rx_rent",
      name: "Tiền thuê mặt bằng",
      amount: 15_000_000,
      dayOfMonth: 5,
      category: "Tiền thuê",
      active: true,
    },
    {
      id: "rx_net",
      name: "Internet",
      amount: 500_000,
      dayOfMonth: 10,
      category: "Internet",
      active: true,
    },
    {
      id: "rx_soft",
      name: "Phần mềm",
      amount: 300_000,
      dayOfMonth: 15,
      category: "Chi khác",
      active: true,
    },
  ];
}

export function seedAlerts(): AlertRule[] {
  return [
    {
      id: "al_cash",
      label: "Tiền mặt thấp",
      kind: "low_cash",
      enabled: true,
      threshold: 5_000_000,
    },
    {
      id: "al_overdue",
      label: "Công nợ quá hạn",
      kind: "overdue_debt",
      enabled: true,
    },
    {
      id: "al_due",
      label: "Công nợ sắp đến hạn",
      kind: "due_soon",
      enabled: true,
    },
    {
      id: "al_exp",
      label: "Chi phí tăng bất thường",
      kind: "expense_spike",
      enabled: true,
    },
    {
      id: "al_cf",
      label: "Dòng tiền âm",
      kind: "negative_cashflow",
      enabled: true,
    },
    {
      id: "al_rev",
      label: "Doanh thu giảm",
      kind: "revenue_drop",
      enabled: true,
    },
    {
      id: "al_shift",
      label: "Chênh lệch ca",
      kind: "shift_mismatch",
      enabled: true,
    },
  ];
}
