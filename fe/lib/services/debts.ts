import { db } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { DebtStatus, PaymentMethod, User } from "@/types";

export async function payDebt(input: {
  debtId: string;
  amount: number;
  method: PaymentMethod;
  user: User;
  note?: string;
}): Promise<void> {
  const debt = await db.debts.get(input.debtId);
  if (!debt) throw new Error("Không tìm thấy công nợ");
  const remain = debt.amount - debt.paidAmount;
  const pay = Math.min(Math.max(0, input.amount), remain);
  if (pay <= 0) throw new Error("Số tiền không hợp lệ");

  const paidAmount = debt.paidAmount + pay;
  let status: DebtStatus =
    paidAmount >= debt.amount ? "paid" : paidAmount > 0 ? "partial" : debt.status;

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
