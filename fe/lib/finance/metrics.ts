import { format } from "date-fns";
import type { FinanceTxn } from "@/lib/finance/model";
import { OPEX_CATEGORIES } from "@/lib/finance/model";
import { inWindow, pctChange, type DateWindow } from "@/lib/finance/range";
import { accountBalance } from "@/stores/finance-store";
import type { FinanceAccount } from "@/lib/finance/model";
import type { Category, Debt, Order, Product } from "@/types";

export function orderCogs(order: Order) {
  return order.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
}

export function collectedOf(order: Order) {
  if (order.status === "void" || order.status === "debt") {
    const paid = (order.payments ?? [])
      .filter((p) => p.method !== "debt")
      .reduce((s, p) => s + p.amount, 0);
    return paid;
  }
  return order.total;
}

function sumOrders(orders: Order[], start: Date, end: Date) {
  const rows = orders.filter(
    (o) => o.status !== "void" && inWindow(o.createdAt, start, end),
  );
  const revenue = rows.reduce((s, o) => s + o.total, 0);
  const cogs = rows.reduce((s, o) => s + orderCogs(o), 0);
  const discounts = rows.reduce((s, o) => s + o.discount, 0);
  const collected = rows.reduce((s, o) => s + collectedOf(o), 0);
  return { rows, revenue, cogs, discounts, collected, count: rows.length };
}

export function periodSnapshot(
  orders: Order[],
  txns: FinanceTxn[],
  window: DateWindow,
) {
  const cur = sumOrders(orders, window.start, window.end);
  const prev = sumOrders(orders, window.prevStart, window.prevEnd);
  const opex = (start: Date, end: Date) =>
    txns
      .filter(
        (t) =>
          t.kind === "out" &&
          t.profitClass === "opex" &&
          inWindow(t.at, start, end),
      )
      .reduce((s, t) => s + t.amount, 0);
  const cashOut = (start: Date, end: Date) =>
    txns
      .filter(
        (t) =>
          t.kind === "out" &&
          t.source !== "sale" &&
          inWindow(t.at, start, end),
      )
      .reduce((s, t) => s + t.amount, 0);
  const debtIn = (start: Date, end: Date) =>
    txns
      .filter(
        (t) =>
          t.kind === "in" &&
          t.source === "debt" &&
          inWindow(t.at, start, end),
      )
      .reduce((s, t) => s + t.amount, 0);

  const revenue = cur.revenue;
  const collected = cur.collected + debtIn(window.start, window.end);
  const spent = cashOut(window.start, window.end);
  const curOpex = opex(window.start, window.end);
  const prevOpex = opex(window.prevStart, window.prevEnd);
  const gross = revenue - cur.cogs;
  const prevGross = prev.revenue - prev.cogs;
  const profit = gross - curOpex;
  const prevProfit = prevGross - prevOpex;
  const prevCollected =
    prev.collected + debtIn(window.prevStart, window.prevEnd);
  const prevSpent = cashOut(window.prevStart, window.prevEnd);
  const margin = revenue ? (gross / revenue) * 100 : 0;
  const prevMargin = prev.revenue ? (prevGross / prev.revenue) * 100 : 0;
  const net = collected - spent;
  const prevNet = prevCollected - prevSpent;

  return {
    revenue,
    collected,
    spent,
    profit,
    orders: cur.count,
    aov: cur.count ? Math.round(revenue / cur.count) : 0,
    discounts: cur.discounts,
    cogs: cur.cogs,
    opex: curOpex,
    gross,
    margin,
    net,
    delta: {
      revenue: pctChange(revenue, prev.revenue),
      collected: pctChange(collected, prevCollected),
      spent: pctChange(spent, prevSpent),
      profit: pctChange(profit, prevProfit),
      opex: pctChange(curOpex, prevOpex),
      gross: pctChange(gross, prevGross),
      margin: pctChange(margin, prevMargin),
      net: pctChange(net, prevNet),
    },
  };
}

export function cashflowSeries(orders: Order[], txns: FinanceTxn[], days = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const rows: {
    label: string;
    iso: string;
    inflow: number;
    outflow: number;
    net: number;
  }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = format(d, "yyyy-MM-dd");
    const inflowOrders = orders
      .filter((o) => o.status !== "void" && o.createdAt.startsWith(key))
      .reduce((s, o) => s + collectedOf(o), 0);
    const inflowDebt = txns
      .filter(
        (t) =>
          t.kind === "in" &&
          t.source !== "sale" &&
          t.at.startsWith(key),
      )
      .reduce((s, t) => s + t.amount, 0);
    const outflow = txns
      .filter((t) => t.kind === "out" && t.at.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    const inflow = inflowOrders + inflowDebt;
    rows.push({
      label: format(d, "dd/MM"),
      iso: key,
      inflow,
      outflow,
      net: inflow - outflow,
    });
  }
  return rows;
}

export function expenseBreakdown(txns: FinanceTxn[], start: Date, end: Date) {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.kind !== "out" || t.profitClass !== "opex") continue;
    if (!inWindow(t.at, start, end)) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function revenueByProduct(orders: Order[], start: Date, end: Date) {
  const map = new Map<string, { name: string; revenue: number; qty: number }>();
  for (const o of orders) {
    if (o.status === "void" || !inWindow(o.createdAt, start, end)) continue;
    for (const line of o.items) {
      const cur = map.get(line.productId) ?? {
        name: line.productName,
        revenue: 0,
        qty: 0,
      };
      cur.revenue += line.lineTotal;
      cur.qty += line.quantity;
      map.set(line.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function revenueByCategory(
  orders: Order[],
  products: Product[],
  categories: Category[],
  start: Date,
  end: Date,
) {
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const prodCat = new Map(products.map((p) => [p.id, p.categoryId]));
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "void" || !inWindow(o.createdAt, start, end)) continue;
    for (const line of o.items) {
      const name = catName.get(prodCat.get(line.productId) ?? "") ?? "Khác";
      map.set(name, (map.get(name) ?? 0) + line.lineTotal);
    }
  }
  return [...map.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function revenueByStaff(orders: Order[], start: Date, end: Date) {
  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    if (o.status === "void" || !inWindow(o.createdAt, start, end)) continue;
    const cur = map.get(o.cashierName) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.total;
    cur.orders += 1;
    map.set(o.cashierName, cur);
  }
  return [...map.entries()].map(([name, v]) => ({ name, ...v }));
}

export function revenueByMethod(orders: Order[], start: Date, end: Date) {
  const labels: Record<string, string> = {
    cash: "Tiền mặt",
    transfer: "Chuyển khoản",
    qr: "QR / ví",
    debt: "Ghi nợ",
    split: "Tách",
  };
  const map = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "void" || !inWindow(o.createdAt, start, end)) continue;
    const key = labels[o.paymentMethod] ?? o.paymentMethod;
    map.set(key, (map.get(key) ?? 0) + o.total);
  }
  return [...map.entries()].map(([name, revenue]) => ({ name, revenue }));
}

export function debtRemain(d: Debt) {
  return Math.max(0, d.amount - d.paidAmount);
}

export type AgeBucket = "current" | "d30" | "d60" | "d60p" | "paid";

export function debtAgeBucket(d: Debt, now = new Date()): AgeBucket {
  if (debtRemain(d) <= 0 || d.status === "paid") return "paid";
  const due = new Date(d.dueDate);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const days = Math.floor((start.getTime() - due.getTime()) / 86400000);
  if (days <= 0) return "current";
  if (days <= 30) return "d30";
  if (days <= 60) return "d60";
  return "d60p";
}

export function agingSums(debts: Debt[]) {
  const buckets = { current: 0, d30: 0, d60: 0, d60p: 0 };
  for (const d of debts) {
    const bucket = debtAgeBucket(d);
    if (bucket === "paid") continue;
    buckets[bucket] += debtRemain(d);
  }
  return buckets;
}

export function debtUiStatus(d: Debt, now = new Date()) {
  if (d.status === "paid" || debtRemain(d) <= 0) return "Đã thanh toán";
  if (d.status === "partial") return "Đã thanh toán một phần";
  const due = new Date(d.dueDate);
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  if (due < startToday || d.status === "overdue") return "Quá hạn";
  const soon = new Date(startToday);
  soon.setDate(soon.getDate() + 7);
  if (due <= soon) return "Sắp đến hạn";
  return "Chưa đến hạn";
}

export function balancesOf(accounts: FinanceAccount[], txns: FinanceTxn[]) {
  return accounts
    .filter((a) => a.active)
    .map((a) => ({
      ...a,
      balance: accountBalance(accounts, txns, a.id),
    }));
}

export function isOpexCategory(name: string) {
  return (OPEX_CATEGORIES as readonly string[]).includes(name);
}
