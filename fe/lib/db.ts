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
import {
  dbNameForVertical,
  getStoredVertical,
  type VerticalOption,
} from "@/lib/vertical";

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

  constructor(name: string) {
    super(name);
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

function createDb(vertical: VerticalOption["id"] | "pet") {
  return new DolphinPosDB(dbNameForVertical(vertical));
}

/** Live-bound instance — gọi `reopenDb` khi đổi lĩnh vực. */
export let db: DolphinPosDB = createDb(getStoredVertical() ?? "pet");

export function reopenDb(vertical: VerticalOption["id"]): DolphinPosDB {
  const name = dbNameForVertical(vertical);
  if (db.name === name) {
    if (!db.isOpen()) void db.open();
    return db;
  }
  if (db.isOpen()) db.close();
  db = createDb(vertical);
  return db;
}

export function getStockStatus(
  stock: number,
  minStock: number,
): "in_stock" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  return "in_stock";
}
