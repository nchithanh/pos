import { tr } from "@/lib/i18n/translate";
import { db } from "@/lib/db";
import { readWriteBranchId } from "@/lib/branch";
import { useFinanceStore } from "@/stores/finance-store";
import { orderCode, todayKey, uid } from "@/lib/utils";
import type {
  CartLine,
  Customer,
  Order,
  PaymentMethod,
  PaymentSplit,
  Product,
  User,
} from "@/types";

export async function nextOrderSeq(): Promise<number> {
  const row = await db.meta.get("orderSeq");
  const current = Number(row?.value ?? "0") + 1;
  await db.meta.put({ key: "orderSeq", value: String(current) });
  return current;
}

export async function nextMovementSeq(): Promise<number> {
  const row = await db.meta.get("movementSeq");
  const current = Number(row?.value ?? "0") + 1;
  await db.meta.put({ key: "movementSeq", value: String(current) });
  return current;
}

export function calcLineTotal(
  sellPrice: number,
  qty: number,
  discountPercent = 0,
): number {
  const raw = sellPrice * qty;
  return Math.round(raw * (1 - Math.min(100, Math.max(0, discountPercent)) / 100));
}

/** 1 điểm = 1.000 VND khi đổi điểm */
export const POINT_VALUE_VND = 1000;

export async function checkoutOrder(input: {
  lines: CartLine[];
  cartDiscount: number;
  /** Điểm khách muốn đổi (cần customerId) */
  pointsToRedeem?: number;
  paymentMethod: PaymentMethod;
  payments?: PaymentSplit[];
  cashReceived?: number;
  customerId?: string;
  note?: string;
  user: User;
  shiftId?: string;
}): Promise<Order> {
  if (input.lines.length === 0) throw new Error(tr("Giỏ hàng trống"));

  const products = await db.products.bulkGet(input.lines.map((l) => l.productId));
  const productMap = new Map(
    products.filter(Boolean).map((p) => [p!.id, p as Product]),
  );

  const items = input.lines.map((line) => {
    const p = productMap.get(line.productId);
    if (!p) throw new Error(tr("Sản phẩm không tồn tại"));
    if (line.quantity > p.stock) throw new Error(`${p.name} không đủ tồn`);
    const lineTotal = calcLineTotal(
      p.sellPrice,
      line.quantity,
      line.discountPercent ?? 0,
    );
    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      quantity: line.quantity,
      unitPrice: p.sellPrice,
      costPrice: p.costPrice,
      discountPercent: line.discountPercent ?? 0,
      note: line.note,
      lineTotal,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const cartDiscount = Math.min(Math.max(0, input.cartDiscount), subtotal);

  let customer: Customer | undefined;
  if (input.customerId) {
    customer = await db.customers.get(input.customerId);
  }

  let pointsToRedeem = Math.max(0, Math.floor(input.pointsToRedeem ?? 0));
  if (pointsToRedeem > 0) {
    if (!customer) throw new Error(tr("Chọn khách để dùng điểm"));
    if (pointsToRedeem > customer.points) {
      throw new Error(`Khách chỉ còn ${customer.points} điểm`);
    }
  }
  const afterCart = subtotal - cartDiscount;
  const maxPointsByMoney = Math.floor(afterCart / POINT_VALUE_VND);
  pointsToRedeem = Math.min(pointsToRedeem, maxPointsByMoney);
  const pointsDiscount = pointsToRedeem * POINT_VALUE_VND;
  const discount = cartDiscount + pointsDiscount;

  const settings = await db.settings.get("store");
  const tax = Math.round(
    (subtotal - discount) * ((settings?.taxRate ?? 0) / 100),
  );
  const total = subtotal - discount + tax;

  let payments = input.payments ?? [];
  if (input.paymentMethod === "split") {
    if (!payments.length) {
      const half = Math.floor(total / 2);
      payments = [
        { method: "cash", amount: half },
        { method: "transfer", amount: total - half },
      ];
    }
    const paySum = payments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(paySum - total) > 1) {
      throw new Error(tr("Tổng thanh toán tách không khớp"));
    }
  } else {
    payments = [
      {
        method: input.paymentMethod === "debt" ? "debt" : input.paymentMethod,
        amount: total,
      },
    ];
  }
  if (input.paymentMethod === "cash") {
    const cash = input.cashReceived ?? 0;
    if (cash < total) throw new Error(tr("Tiền khách đưa chưa đủ"));
  }
  if (input.paymentMethod === "debt" && !input.customerId) {
    throw new Error(tr("Chọn khách hàng để ghi nợ"));
  }

  const seq = await nextOrderSeq();

  const order: Order = {
    id: uid("ord"),
    code: orderCode(seq),
    createdAt: new Date().toISOString(),
    cashierId: input.user.id,
    cashierName: input.user.name,
    shiftId: input.shiftId,
    customerId: customer?.id,
    customerName: customer?.name,
    customerPhone: customer?.phone,
    customerEmail: customer?.email,
    items,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod: input.paymentMethod,
    payments,
    cashReceived: input.cashReceived,
    changeDue:
      input.paymentMethod === "cash" && input.cashReceived != null
        ? input.cashReceived - total
        : undefined,
    pointsRedeemed: pointsToRedeem || undefined,
    note: input.note,
    status: input.paymentMethod === "debt" ? "debt" : "paid",
    branchId: readWriteBranchId(),
  };

  await db.transaction(
    "rw",
    [db.orders, db.products, db.customers, db.debts, db.movements, db.meta],
    async () => {
      await db.orders.add(order);

      const movementItems: {
        productId: string;
        quantity: number;
        unitCost: number;
        beforeQty: number;
        afterQty: number;
      }[] = [];
      for (const item of items) {
        const p = await db.products.get(item.productId);
        if (!p) continue;
        const beforeQty = p.stock;
        const afterQty = Math.max(0, p.stock - item.quantity);
        movementItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.costPrice,
          beforeQty,
          afterQty,
        });
        await db.products.update(item.productId, {
          stock: afterQty,
          updatedAt: new Date().toISOString(),
        });
      }

      const movSeq = await nextMovementSeq();
      await db.movements.add({
        id: uid("mov"),
        code: `XK-${todayKey().replace(/-/g, "").slice(2)}-${String(movSeq).padStart(2, "0")}`,
        type: "sale",
        createdAt: order.createdAt,
        userId: input.user.id,
        userName: input.user.name,
        reason: tr("Xuất bán hàng"),
        note: order.code,
        items: movementItems,
        totalCost: items.reduce((s, i) => s + i.costPrice * i.quantity, 0),
        branchId: readWriteBranchId(),
      });

      if (customer) {
        const earned =
          order.status === "paid" ? Math.floor(order.total / 10000) : 0;
        await db.customers.update(customer.id, {
          totalSpent:
            customer.totalSpent + (order.status === "paid" ? order.total : 0),
          visitCount: customer.visitCount + 1,
          lastPurchaseAt: order.createdAt,
          points: Math.max(0, customer.points - pointsToRedeem + earned),
          debt:
            order.status === "debt"
              ? customer.debt + order.total
              : customer.debt,
        });
      }

      if (order.status === "debt" && customer) {
        await db.debts.add({
          id: uid("debt"),
          type: "receivable",
          partyName: customer.name,
          partyId: customer.id,
          amount: order.total,
          paidAmount: 0,
          dueDate: todayKey(new Date(Date.now() + 7 * 86400000)),
          status: "unpaid",
          note: `Đơn ${order.code}`,
          createdAt: order.createdAt,
          orderId: order.id,
          branchId: readWriteBranchId(),
        });
      }
    },
  );

  useFinanceStore.getState().applySale(order);
  return order;
}
