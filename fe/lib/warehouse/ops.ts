import { db } from "@/lib/db";
import { createDebt } from "@/lib/services/debts";
import { nextMovementSeq } from "@/lib/services/orders";
import type { PurchaseOrder } from "@/lib/warehouse/types";
import { todayKey, uid } from "@/lib/utils";
import type { MovementType, User } from "@/types";

export async function postStockDelta(input: {
  lines: { productId: string; delta: number; unitCost?: number }[];
  type: MovementType;
  reason: string;
  note?: string;
  user: User;
  supplierId?: string;
}) {
  const lines = input.lines.filter((l) => l.delta !== 0);
  if (!lines.length) throw new Error("Không có số lượng để ghi sổ");

  for (const line of lines) {
    const p = await db.products.get(line.productId);
    if (!p) throw new Error("Không tìm thấy sản phẩm");
    if (p.stock + line.delta < 0) {
      throw new Error(`${p.name} không đủ tồn để xuất`);
    }
  }

  const seq = await nextMovementSeq();
  const prefix = input.type === "in" || input.type === "return" ? "NK" : "XK";
  const code = `${prefix}-${todayKey().replace(/-/g, "").slice(2)}-${String(seq).padStart(2, "0")}`;
  const items: {
    productId: string;
    quantity: number;
    unitCost?: number;
    beforeQty: number;
    afterQty: number;
  }[] = [];

  await db.transaction("rw", [db.movements, db.products, db.meta], async () => {
    for (const line of lines) {
      const p = await db.products.get(line.productId);
      if (!p) continue;
      const beforeQty = p.stock;
      const afterQty = p.stock + line.delta;
      items.push({
        productId: p.id,
        quantity: Math.abs(line.delta),
        unitCost: line.unitCost ?? p.costPrice,
        beforeQty,
        afterQty,
      });
      await db.products.update(p.id, {
        stock: afterQty,
        updatedAt: new Date().toISOString(),
      });
    }
    await db.movements.add({
      id: uid("mov"),
      code,
      type: input.type,
      createdAt: new Date().toISOString(),
      userId: input.user.id,
      userName: input.user.name,
      supplierId: input.supplierId,
      reason: input.reason,
      note: input.note,
      items,
      totalCost: items.reduce(
        (s, i) => s + i.quantity * (i.unitCost ?? 0),
        0,
      ),
    });
  });

  return { code, items };
}

/** Nhập theo số thực nhận (không theo số đặt). Hàng hỏng không cộng tồn bán. */
export async function confirmReceive(po: PurchaseOrder, user: User) {
  const good = po.lines.map((l) => ({
    productId: l.productId,
    delta: Math.max(0, l.received - l.damaged),
    unitCost: l.cost,
  }));
  const result = await postStockDelta({
    lines: good,
    type: "in",
    reason: "Nhập kho",
    note: po.code,
    user,
    supplierId: po.supplierId,
  });
  const amount = po.lines.reduce(
    (s, l) => s + Math.max(0, l.received - l.damaged) * l.cost,
    0,
  );
  if (po.payLater && amount > 0) {
    const due = new Date();
    due.setDate(due.getDate() + 14);
    await createDebt({
      type: "payable",
      partyName: po.supplierName,
      partyId: po.supplierId,
      amount,
      dueDate: due.toISOString().slice(0, 10),
      note: `Nhập ${po.code}`,
    });
  }
  return result;
}

export async function confirmShip(
  lines: { productId: string; qty: number }[],
  ref: string,
  user: User,
) {
  return postStockDelta({
    lines: lines.map((l) => ({ productId: l.productId, delta: -l.qty })),
    type: "out",
    reason: "Xuất kho",
    note: ref,
    user,
  });
}
