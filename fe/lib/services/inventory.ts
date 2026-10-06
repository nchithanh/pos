import { db } from "@/lib/db";
import { useFinanceStore } from "@/stores/finance-store";
import { nextMovementSeq } from "@/lib/services/orders";
import { todayKey, uid } from "@/lib/utils";
import type { InventoryMovement, PaymentMethod, User } from "@/types";

export type StockInItem = {
  productId: string;
  quantity: number;
  unitCost: number;
  expiryDate?: string;
};

export async function stockIn(input: {
  supplierId: string;
  items: StockInItem[];
  note?: string;
  user: User;
  /** true = thanh toán ngay (không ghi nợ); false = ghi nợ NCC */
  payNow?: boolean;
  payMethod?: PaymentMethod;
  debtDueDate?: string;
}): Promise<InventoryMovement> {
  if (!input.items.length) throw new Error("Chưa chọn sản phẩm");
  const items = input.items.filter((i) => i.quantity > 0);
  if (!items.length) throw new Error("Số lượng không hợp lệ");

  const seq = await nextMovementSeq();
  const totalCost = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const payNow = input.payNow ?? false;
  const movement: InventoryMovement = {
    id: uid("mov"),
    code: `NK-${todayKey().replace(/-/g, "").slice(2)}-${String(seq).padStart(2, "0")}`,
    type: "in",
    createdAt: new Date().toISOString(),
    userId: input.user.id,
    userName: input.user.name,
    supplierId: input.supplierId,
    note: input.note,
    reason: payNow
      ? `Thanh toán ngay (${input.payMethod ?? "cash"})`
      : "Ghi nợ NCC",
    items: items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitCost: i.unitCost,
      expiryDate: i.expiryDate,
    })),
    totalCost,
  };

  await db.transaction(
    "rw",
    [db.movements, db.products, db.suppliers, db.debts, db.meta],
    async () => {
      await db.movements.add(movement);
      for (const item of items) {
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
          debt: payNow ? sup.debt : sup.debt + totalCost,
        });
        if (!payNow && totalCost > 0) {
          await db.debts.add({
            id: uid("debt"),
            type: "payable",
            partyName: sup.name,
            partyId: sup.id,
            partyPhone: sup.phone,
            amount: totalCost,
            paidAmount: 0,
            dueDate:
              input.debtDueDate ||
              todayKey(new Date(Date.now() + 14 * 86400000)),
            status: "unpaid",
            note: `Nhập ${movement.code}`,
            createdAt: movement.createdAt,
          });
        }
      }
    },
  );

  if (payNow && totalCost > 0) {
    const sup = await db.suppliers.get(input.supplierId);
    useFinanceStore.getState().applyPurchasePayment({
      amount: totalCost,
      method: input.payMethod ?? "cash",
      code: movement.code,
      supplierName: sup?.name ?? "Nhà cung cấp",
      userName: input.user.name,
    });
  }

  return movement;
}

export async function stockOut(input: {
  items: { productId: string; quantity: number }[];
  reason: string;
  note?: string;
  user: User;
}): Promise<InventoryMovement> {
  if (!input.items.length) throw new Error("Chưa chọn sản phẩm");
  const items = input.items.filter((i) => i.quantity > 0);
  if (!items.length) throw new Error("Số lượng không hợp lệ");

  for (const item of items) {
    const p = await db.products.get(item.productId);
    if (!p || item.quantity > p.stock) {
      throw new Error(`${p?.name ?? "Sản phẩm"} không đủ tồn`);
    }
  }
  const seq = await nextMovementSeq();
  const totalCost = await (async () => {
    let sum = 0;
    for (const item of items) {
      const p = await db.products.get(item.productId);
      if (p) sum += item.quantity * p.costPrice;
    }
    return sum;
  })();

  const movement: InventoryMovement = {
    id: uid("mov"),
    code: `XK-${todayKey().replace(/-/g, "").slice(2)}-${String(seq).padStart(2, "0")}`,
    type: "out",
    createdAt: new Date().toISOString(),
    userId: input.user.id,
    userName: input.user.name,
    reason: input.reason,
    note: input.note,
    items,
    totalCost,
  };

  await db.transaction("rw", [db.movements, db.products, db.meta], async () => {
    await db.movements.add(movement);
    for (const item of items) {
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
  reason: string;
  note?: string;
  user: User;
}): Promise<void> {
  const p = await db.products.get(input.productId);
  if (!p) throw new Error("Không tìm thấy sản phẩm");
  if (!input.reason.trim()) throw new Error("Chọn lý do điều chỉnh");
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
      reason: input.reason.trim(),
      note: input.note,
      items: [{ productId: p.id, quantity: Math.abs(delta) }],
      totalCost: 0,
    });
  });
}

export function buildInventoryCsv(
  products: {
    sku: string;
    barcode?: string;
    name: string;
    unit: string;
    stock: number;
    minStock: number;
    costPrice: number;
    sellPrice: number;
  }[],
): string {
  const header = [
    "SKU",
    "Barcode",
    "Tên",
    "Đơn vị",
    "Tồn",
    "Tối thiểu",
    "Giá vốn",
    "Giá bán",
    "Giá trị tồn",
  ];
  const rows = products.map((p) =>
    [
      p.sku,
      p.barcode ?? "",
      p.name,
      p.unit,
      String(p.stock),
      String(p.minStock),
      String(p.costPrice),
      String(p.sellPrice),
      String(p.stock * p.costPrice),
    ]
      .map((c) => `"${String(c).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadInventoryCsv(
  products: Parameters<typeof buildInventoryCsv>[0],
) {
  const csv = "\uFEFF" + buildInventoryCsv(products);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ton-kho-${todayKey()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
