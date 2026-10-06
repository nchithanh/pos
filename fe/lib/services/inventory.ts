import { db } from "@/lib/db";
import { nextMovementSeq } from "@/lib/services/orders";
import { todayKey, uid } from "@/lib/utils";
import type { InventoryMovement, User } from "@/types";

export async function stockIn(input: {
  supplierId: string;
  items: { productId: string; quantity: number; unitCost: number }[];
  note?: string;
  user: User;
}): Promise<InventoryMovement> {
  if (!input.items.length) throw new Error("Chưa chọn sản phẩm");
  const seq = await nextMovementSeq();
  const totalCost = input.items.reduce(
    (s, i) => s + i.quantity * i.unitCost,
    0,
  );
  const movement: InventoryMovement = {
    id: uid("mov"),
    code: `NK-${todayKey().replace(/-/g, "").slice(2)}-${String(seq).padStart(2, "0")}`,
    type: "in",
    createdAt: new Date().toISOString(),
    userId: input.user.id,
    userName: input.user.name,
    supplierId: input.supplierId,
    note: input.note,
    items: input.items,
    totalCost,
  };

  await db.transaction(
    "rw",
    [db.movements, db.products, db.suppliers, db.debts, db.meta],
    async () => {
      await db.movements.add(movement);
      for (const item of input.items) {
        const p = await db.products.get(item.productId);
        if (!p) continue;
        await db.products.update(p.id, {
          stock: p.stock + item.quantity,
          costPrice: item.unitCost,
          updatedAt: new Date().toISOString(),
        });
      }
      const sup = await db.suppliers.get(input.supplierId);
      if (sup) {
        await db.suppliers.update(sup.id, {
          totalPurchased: sup.totalPurchased + totalCost,
          debt: sup.debt + totalCost,
        });
        await db.debts.add({
          id: uid("debt"),
          type: "payable",
          partyName: sup.name,
          partyId: sup.id,
          amount: totalCost,
          paidAmount: 0,
          dueDate: todayKey(new Date(Date.now() + 14 * 86400000)),
          status: "unpaid",
          note: `Nhập ${movement.code}`,
          createdAt: movement.createdAt,
        });
      }
    },
  );

  return movement;
}

export async function stockOut(input: {
  items: { productId: string; quantity: number }[];
  reason: string;
  note?: string;
  user: User;
}): Promise<InventoryMovement> {
  if (!input.items.length) throw new Error("Chưa chọn sản phẩm");
  for (const item of input.items) {
    const p = await db.products.get(item.productId);
    if (!p || item.quantity > p.stock) {
      throw new Error(`${p?.name ?? "Sản phẩm"} không đủ tồn`);
    }
  }
  const seq = await nextMovementSeq();
  const movement: InventoryMovement = {
    id: uid("mov"),
    code: `XK-${todayKey().replace(/-/g, "").slice(2)}-${String(seq).padStart(2, "0")}`,
    type: "out",
    createdAt: new Date().toISOString(),
    userId: input.user.id,
    userName: input.user.name,
    reason: input.reason,
    note: input.note,
    items: input.items,
    totalCost: 0,
  };

  await db.transaction("rw", [db.movements, db.products, db.meta], async () => {
    await db.movements.add(movement);
    for (const item of input.items) {
      const p = await db.products.get(item.productId);
      if (!p) continue;
      await db.products.update(p.id, {
        stock: p.stock - item.quantity,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return movement;
}

export async function stockAdjust(input: {
  productId: string;
  newStock: number;
  note?: string;
  user: User;
}): Promise<void> {
  const p = await db.products.get(input.productId);
  if (!p) throw new Error("Không tìm thấy sản phẩm");
  const delta = input.newStock - p.stock;
  const seq = await nextMovementSeq();
  await db.transaction("rw", [db.movements, db.products, db.meta], async () => {
    await db.products.update(p.id, {
      stock: input.newStock,
      updatedAt: new Date().toISOString(),
    });
    await db.movements.add({
      id: uid("mov"),
      code: `DC-${todayKey().replace(/-/g, "").slice(2)}-${String(seq).padStart(2, "0")}`,
      type: "adjust",
      createdAt: new Date().toISOString(),
      userId: input.user.id,
      userName: input.user.name,
      reason: "Điều chỉnh tồn",
      note: input.note,
      items: [{ productId: p.id, quantity: Math.abs(delta) }],
      totalCost: 0,
    });
  });
}
