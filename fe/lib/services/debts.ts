import { db } from "@/lib/db";
import { formatDate, formatVnd, todayKey, uid } from "@/lib/utils";
import type {
  Debt,
  DebtStatus,
  DebtType,
  PaymentMethod,
  User,
} from "@/types";

export type DebtDueFilter = "all" | "due_today" | "overdue" | "upcoming";

export function debtRemain(d: Debt): number {
  return Math.max(0, d.amount - d.paidAmount);
}

export function isDebtSettled(d: Debt): boolean {
  return d.status === "paid" || debtRemain(d) <= 0;
}

/** Quá hạn theo ngày (không chỉ dựa status seed). */
export function isDebtOverdue(d: Debt, today = todayKey()): boolean {
  if (isDebtSettled(d)) return false;
  return d.dueDate < today;
}

export function isDebtDueToday(d: Debt, today = todayKey()): boolean {
  if (isDebtSettled(d)) return false;
  return d.dueDate === today;
}

export function matchesDueFilter(
  d: Debt,
  filter: DebtDueFilter,
  today = todayKey(),
): boolean {
  if (filter === "all") return true;
  if (filter === "overdue") return isDebtOverdue(d, today);
  if (filter === "due_today") return isDebtDueToday(d, today);
  // upcoming = chưa đến hạn (sau hôm nay) và còn nợ
  if (isDebtSettled(d)) return false;
  return d.dueDate > today;
}

export function overdueDays(d: Debt, today = todayKey()): number {
  if (!isDebtOverdue(d, today)) return 0;
  const a = new Date(`${d.dueDate}T00:00:00`);
  const b = new Date(`${today}T00:00:00`);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function displayDebtStatus(d: Debt, today = todayKey()): DebtStatus {
  if (isDebtSettled(d)) return "paid";
  if (isDebtOverdue(d, today)) return "overdue";
  if (d.paidAmount > 0) return "partial";
  return "unpaid";
}

export async function createDebt(input: {
  type: DebtType;
  partyName: string;
  partyId?: string;
  partyPhone?: string;
  amount: number;
  dueDate: string;
  note: string;
  orderId?: string;
}): Promise<Debt> {
  const amount = Math.round(input.amount);
  if (!input.partyName.trim()) throw new Error("Nhập tên đối tác");
  if (amount <= 0) throw new Error("Số tiền không hợp lệ");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
    throw new Error("Hạn thanh toán không hợp lệ");
  }

  const debt: Debt = {
    id: uid("debt"),
    type: input.type,
    partyName: input.partyName.trim(),
    partyId: input.partyId?.trim() || uid("party"),
    partyPhone: input.partyPhone?.trim() || undefined,
    amount,
    paidAmount: 0,
    dueDate: input.dueDate,
    status: input.dueDate < todayKey() ? "overdue" : "unpaid",
    note: input.note.trim() || "Phiếu ghi nợ thủ công",
    createdAt: new Date().toISOString(),
    orderId: input.orderId,
  };

  await db.transaction("rw", [db.debts, db.customers, db.suppliers], async () => {
    await db.debts.add(debt);
    if (debt.type === "receivable") {
      const cus = await db.customers.get(debt.partyId);
      if (cus) {
        await db.customers.update(cus.id, { debt: cus.debt + amount });
      }
    } else {
      const sup = await db.suppliers.get(debt.partyId);
      if (sup) {
        await db.suppliers.update(sup.id, { debt: sup.debt + amount });
      }
    }
  });

  return debt;
}

export async function payDebt(input: {
  debtId: string;
  amount: number;
  method: PaymentMethod;
  user: User;
  note?: string;
}): Promise<void> {
  const debt = await db.debts.get(input.debtId);
  if (!debt) throw new Error("Không tìm thấy công nợ");
  const remain = debtRemain(debt);
  const pay = Math.min(Math.max(0, input.amount), remain);
  if (pay <= 0) throw new Error("Số tiền không hợp lệ");

  const paidAmount = debt.paidAmount + pay;
  let status: DebtStatus =
    paidAmount >= debt.amount
      ? "paid"
      : paidAmount > 0
        ? "partial"
        : debt.status;
  if (status !== "paid" && isDebtOverdue({ ...debt, paidAmount, status })) {
    status = "overdue";
  }

  await db.transaction(
    "rw",
    [db.debts, db.debtPayments, db.suppliers, db.customers],
    async () => {
      await db.debts.update(debt.id, { paidAmount, status });
      await db.debtPayments.add({
        id: uid("dpay"),
        debtId: debt.id,
        amount: pay,
        method: input.method,
        createdAt: new Date().toISOString(),
        userId: input.user.id,
        note: input.note,
      });
      if (debt.type === "payable") {
        const sup = await db.suppliers.get(debt.partyId);
        if (sup) {
          await db.suppliers.update(sup.id, {
            debt: Math.max(0, sup.debt - pay),
          });
        }
      } else {
        const cus = await db.customers.get(debt.partyId);
        if (cus) {
          await db.customers.update(cus.id, {
            debt: Math.max(0, cus.debt - pay),
          });
        }
      }
    },
  );
}

export function buildDebtsCsv(debts: Debt[]): string {
  const header = [
    "Loại",
    "Đối tác",
    "SĐT",
    "Hạn",
    "Nội dung",
    "Tổng nợ",
    "Đã trả",
    "Còn lại",
    "Trạng thái",
    "Mã đơn",
  ];
  const rows = debts.map((d) => {
    const status = displayDebtStatus(d);
    return [
      d.type === "receivable" ? "Phải thu" : "Phải trả",
      d.partyName,
      d.partyPhone ?? "",
      d.dueDate,
      d.note,
      String(d.amount),
      String(d.paidAmount),
      String(debtRemain(d)),
      status,
      d.orderId ?? "",
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function downloadDebtsCsv(debts: Debt[], filename?: string) {
  const csv = "\uFEFF" + buildDebtsCsv(debts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ?? `cong-no-${todayKey()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function debtStatusLabel(status: DebtStatus, days?: number): string {
  if (status === "overdue" && days && days > 0) {
    return `Quá hạn (${days} ngày)`;
  }
  const map: Record<DebtStatus, string> = {
    unpaid: "Chưa thanh toán",
    partial: "Thanh toán một phần",
    paid: "Đã thanh toán",
    overdue: "Quá hạn",
  };
  return map[status];
}

/** Biên lai thu/trả nợ đơn giản (print window). */
export function printDebtReceipt(input: {
  debt: Debt;
  paidNow: number;
  method: PaymentMethod;
  cashierName: string;
  storeName?: string;
}) {
  const remainAfter = Math.max(0, debtRemain(input.debt) - input.paidNow);
  const methodLabel =
    input.method === "cash"
      ? "Tiền mặt"
      : input.method === "transfer"
        ? "Chuyển khoản"
        : input.method === "qr"
          ? "QR"
          : input.method;
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"/><title>Biên lai công nợ</title>
  <style>
    body{font-family:ui-monospace,monospace;width:300px;margin:0 auto;padding:12px;font-size:12px}
    h1{font-size:14px;text-align:center;margin:0 0 8px}
    .row{display:flex;justify-content:space-between;gap:8px;margin:3px 0}
    hr{border:none;border-top:1px dashed #999;margin:8px 0}
    .muted{color:#555;text-align:center}
  </style></head><body>
  <h1>${input.storeName ?? "Dolphin POS"}</h1>
  <p class="muted">Biên lai ${input.debt.type === "receivable" ? "thu nợ" : "trả nợ"}</p>
  <hr/>
  <div>Đối tác: ${input.debt.partyName}</div>
  <div>Nội dung: ${input.debt.note}</div>
  <div>Thu ngân: ${input.cashierName}</div>
  <div>Thời gian: ${formatDate(new Date().toISOString(), "dd/MM/yyyy HH:mm")}</div>
  <hr/>
  <div class="row"><span>Tổng nợ</span><span>${formatVnd(input.debt.amount)}</span></div>
  <div class="row"><span>Lần này</span><span>${formatVnd(input.paidNow)}</span></div>
  <div class="row"><span>Hình thức</span><span>${methodLabel}</span></div>
  <div class="row"><span>Còn lại</span><span>${formatVnd(remainAfter)}</span></div>
  <hr/><p class="muted">Cảm ơn quý khách!</p>
  <script>onload=()=>{print()}</script>
  </body></html>`;
  const w = window.open("", "_blank", "width=400,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
