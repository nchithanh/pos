import Dexie, { type EntityTable } from "dexie";
import type {
  Category,
  Customer,
  Debt,
  DebtPayment,
  HeldCart,
  InventoryMovement,
  Meta,
  Order,
  Product,
  Shift,
  StoreSettings,
  Supplier,
  User,
} from "@/types";

export class DolphinPosDB extends Dexie {
  settings!: EntityTable<StoreSettings, "id">;
  users!: EntityTable<User, "id">;
  shifts!: EntityTable<Shift, "id">;
  categories!: EntityTable<Category, "id">;
  products!: EntityTable<Product, "id">;
  customers!: EntityTable<Customer, "id">;
  suppliers!: EntityTable<Supplier, "id">;
  orders!: EntityTable<Order, "id">;
  heldCarts!: EntityTable<HeldCart, "id">;
  movements!: EntityTable<InventoryMovement, "id">;
  debts!: EntityTable<Debt, "id">;
  debtPayments!: EntityTable<DebtPayment, "id">;
  meta!: EntityTable<Meta, "key">;

  constructor() {
    super("dolphin_pos_v1");
    this.version(1).stores({
      settings: "id",
      users: "id, email, role, status",
      shifts: "id, userId, status, openedAt",
      categories: "id, sort",
      products: "id, sku, barcode, categoryId, supplierId, active, name",
      customers: "id, phone, name",
      suppliers: "id, name",
      orders: "id, code, createdAt, cashierId, customerId, status",
      heldCarts: "id, createdAt",
      movements: "id, code, type, createdAt, supplierId",
      debts: "id, type, partyId, status, dueDate",
      debtPayments: "id, debtId, createdAt",
      meta: "key",
    });
  }
}

export const db = new DolphinPosDB();

export function getStockStatus(
  stock: number,
  minStock: number,
): "in_stock" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  return "in_stock";
}
