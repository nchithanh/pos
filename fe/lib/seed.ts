import { format as dfFormat, subDays, setHours, setMinutes } from "date-fns";
import { db, reopenDb } from "@/lib/db";
import { DEFAULT_EINVOICE_CONFIG } from "@/lib/einvoice-config";
import {
  getStoredVertical,
  isSeedVertical,
  type SeedVerticalId,
} from "@/lib/vertical";
import type {
  Category,
  Customer,
  Debt,
  DebtPayment,
  Order,
  Product,
  StoreSettings,
  Supplier,
  User,
} from "@/types";

import petSettings from "@/data/pet/settings.json";
import petUsers from "@/data/pet/users.json";
import petCategories from "@/data/pet/categories.json";
import petProducts from "@/data/pet/products.json";
import petSuppliers from "@/data/pet/suppliers.json";
import petCustomers from "@/data/pet/customers.json";
import petDebts from "@/data/pet/debts.json";
import petDebtPayments from "@/data/pet/debt-payments.json";
import petOrders from "@/data/pet/orders.json";
import petDemo from "@/data/pet/demo-accounts.json";
import petManifest from "@/data/pet/manifest.json";

import cafeSettings from "@/data/cafe/settings.json";
import cafeUsers from "@/data/cafe/users.json";
import cafeCategories from "@/data/cafe/categories.json";
import cafeProducts from "@/data/cafe/products.json";
import cafeSuppliers from "@/data/cafe/suppliers.json";
import cafeCustomers from "@/data/cafe/customers.json";
import cafeDebts from "@/data/cafe/debts.json";
import cafeDebtPayments from "@/data/cafe/debt-payments.json";
import cafeOrders from "@/data/cafe/orders.json";
import cafeDemo from "@/data/cafe/demo-accounts.json";
import cafeManifest from "@/data/cafe/manifest.json";

import tsSettings from "@/data/tra-sua/settings.json";
import tsUsers from "@/data/tra-sua/users.json";
import tsCategories from "@/data/tra-sua/categories.json";
import tsProducts from "@/data/tra-sua/products.json";
import tsSuppliers from "@/data/tra-sua/suppliers.json";
import tsCustomers from "@/data/tra-sua/customers.json";
import tsDebts from "@/data/tra-sua/debts.json";
import tsDebtPayments from "@/data/tra-sua/debt-payments.json";
import tsOrders from "@/data/tra-sua/orders.json";
import tsDemo from "@/data/tra-sua/demo-accounts.json";
import tsManifest from "@/data/tra-sua/manifest.json";

import fashionSettings from "@/data/thoi-trang/settings.json";
import fashionUsers from "@/data/thoi-trang/users.json";
import fashionCategories from "@/data/thoi-trang/categories.json";
import fashionProducts from "@/data/thoi-trang/products.json";
import fashionSuppliers from "@/data/thoi-trang/suppliers.json";
import fashionCustomers from "@/data/thoi-trang/customers.json";
import fashionDebts from "@/data/thoi-trang/debts.json";
import fashionDebtPayments from "@/data/thoi-trang/debt-payments.json";
import fashionOrders from "@/data/thoi-trang/orders.json";
import fashionDemo from "@/data/thoi-trang/demo-accounts.json";
import fashionManifest from "@/data/thoi-trang/manifest.json";

import restSettings from "@/data/nha-hang/settings.json";
import restUsers from "@/data/nha-hang/users.json";
import restCategories from "@/data/nha-hang/categories.json";
import restProducts from "@/data/nha-hang/products.json";
import restSuppliers from "@/data/nha-hang/suppliers.json";
import restCustomers from "@/data/nha-hang/customers.json";
import restDebts from "@/data/nha-hang/debts.json";
import restDebtPayments from "@/data/nha-hang/debt-payments.json";
import restOrders from "@/data/nha-hang/orders.json";
import restDemo from "@/data/nha-hang/demo-accounts.json";
import restManifest from "@/data/nha-hang/manifest.json";

import grocerySettings from "@/data/tap-hoa/settings.json";
import groceryUsers from "@/data/tap-hoa/users.json";
import groceryCategories from "@/data/tap-hoa/categories.json";
import groceryProducts from "@/data/tap-hoa/products.json";
import grocerySuppliers from "@/data/tap-hoa/suppliers.json";
import groceryCustomers from "@/data/tap-hoa/customers.json";
import groceryDebts from "@/data/tap-hoa/debts.json";
import groceryDebtPayments from "@/data/tap-hoa/debt-payments.json";
import groceryOrders from "@/data/tap-hoa/orders.json";
import groceryDemo from "@/data/tap-hoa/demo-accounts.json";
import groceryManifest from "@/data/tap-hoa/manifest.json";

import phoneSettings from "@/data/dien-thoai/settings.json";
import phoneUsers from "@/data/dien-thoai/users.json";
import phoneCategories from "@/data/dien-thoai/categories.json";
import phoneProducts from "@/data/dien-thoai/products.json";
import phoneSuppliers from "@/data/dien-thoai/suppliers.json";
import phoneCustomers from "@/data/dien-thoai/customers.json";
import phoneDebts from "@/data/dien-thoai/debts.json";
import phoneDebtPayments from "@/data/dien-thoai/debt-payments.json";
import phoneOrders from "@/data/dien-thoai/orders.json";
import phoneDemo from "@/data/dien-thoai/demo-accounts.json";
import phoneManifest from "@/data/dien-thoai/manifest.json";

type OrderTemplate = {
  seq: number;
  daysAgo: number;
  hour: number;
  minute?: number;
  paymentMethod: Order["paymentMethod"];
  items: { productId: string; quantity: number }[];
  discount?: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  cashierId?: string;
  cashierName?: string;
  eInvoice?: {
    number: string;
    customerType: "individual" | "business";
    companyName: string;
    taxCode: string;
    address: string;
    email: string;
  };
};

type VerticalPack = {
  settings: Omit<StoreSettings, "updatedAt" | "eInvoice"> & {
    eInvoice?: StoreSettings["eInvoice"];
  };
  users: User[];
  categories: Category[];
  products: Array<
    Omit<Product, "createdAt" | "updatedAt" | "active"> & {
      barcode?: string;
    }
  >;
  suppliers: Supplier[];
  customers: Customer[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  orders: OrderTemplate[];
  demoAccounts: {
    label: string;
    email: string;
    pin: string;
    password: string;
  }[];
  manifest: {
    vertical: string;
    label: string;
    emoji: string;
    description: string;
    orderSeq: number;
    movementSeq: number;
  };
};

const PACKS: Record<SeedVerticalId, VerticalPack> = {
  pet: {
    settings: petSettings as VerticalPack["settings"],
    users: petUsers as User[],
    categories: petCategories as Category[],
    products: petProducts as VerticalPack["products"],
    suppliers: petSuppliers as Supplier[],
    customers: petCustomers as Customer[],
    debts: petDebts as Debt[],
    debtPayments: petDebtPayments as DebtPayment[],
    orders: petOrders as OrderTemplate[],
    demoAccounts: petDemo,
    manifest: petManifest,
  },
  cafe: {
    settings: cafeSettings as VerticalPack["settings"],
    users: cafeUsers as User[],
    categories: cafeCategories as Category[],
    products: cafeProducts as VerticalPack["products"],
    suppliers: cafeSuppliers as Supplier[],
    customers: cafeCustomers as Customer[],
    debts: cafeDebts as Debt[],
    debtPayments: cafeDebtPayments as DebtPayment[],
    orders: cafeOrders as OrderTemplate[],
    demoAccounts: cafeDemo,
    manifest: cafeManifest,
  },
  "tra-sua": {
    settings: tsSettings as VerticalPack["settings"],
    users: tsUsers as User[],
    categories: tsCategories as Category[],
    products: tsProducts as VerticalPack["products"],
    suppliers: tsSuppliers as Supplier[],
    customers: tsCustomers as Customer[],
    debts: tsDebts as Debt[],
    debtPayments: tsDebtPayments as DebtPayment[],
    orders: tsOrders as OrderTemplate[],
    demoAccounts: tsDemo,
    manifest: tsManifest,
  },
  "thoi-trang": {
    settings: fashionSettings as VerticalPack["settings"],
    users: fashionUsers as User[],
    categories: fashionCategories as Category[],
    products: fashionProducts as VerticalPack["products"],
    suppliers: fashionSuppliers as Supplier[],
    customers: fashionCustomers as Customer[],
    debts: fashionDebts as Debt[],
    debtPayments: fashionDebtPayments as DebtPayment[],
    orders: fashionOrders as OrderTemplate[],
    demoAccounts: fashionDemo,
    manifest: fashionManifest,
  },
  "nha-hang": {
    settings: restSettings as VerticalPack["settings"],
    users: restUsers as User[],
    categories: restCategories as Category[],
    products: restProducts as VerticalPack["products"],
    suppliers: restSuppliers as Supplier[],
    customers: restCustomers as Customer[],
    debts: restDebts as Debt[],
    debtPayments: restDebtPayments as DebtPayment[],
    orders: restOrders as OrderTemplate[],
    demoAccounts: restDemo,
    manifest: restManifest,
  },
  "tap-hoa": {
    settings: grocerySettings as VerticalPack["settings"],
    users: groceryUsers as User[],
    categories: groceryCategories as Category[],
    products: groceryProducts as VerticalPack["products"],
    suppliers: grocerySuppliers as Supplier[],
    customers: groceryCustomers as Customer[],
    debts: groceryDebts as Debt[],
    debtPayments: groceryDebtPayments as DebtPayment[],
    orders: groceryOrders as OrderTemplate[],
    demoAccounts: groceryDemo,
    manifest: groceryManifest,
  },
  "dien-thoai": {
    settings: phoneSettings as VerticalPack["settings"],
    users: phoneUsers as User[],
    categories: phoneCategories as Category[],
    products: phoneProducts as VerticalPack["products"],
    suppliers: phoneSuppliers as Supplier[],
    customers: phoneCustomers as Customer[],
    debts: phoneDebts as Debt[],
    debtPayments: phoneDebtPayments as DebtPayment[],
    orders: phoneOrders as OrderTemplate[],
    demoAccounts: phoneDemo,
    manifest: phoneManifest,
  },
};

function atDaysAgo(days: number, hour: number, minute = 0): string {
  const d = setMinutes(setHours(subDays(new Date(), days), hour), minute);
  return d.toISOString();
}

function demoOrderCode(seq: number, daysAgo: number): string {
  const d = subDays(new Date(), daysAgo);
  return `DH-${dfFormat(d, "ddMMyy")}-${String(seq).padStart(3, "0")}`;
}

function buildOrders(
  templates: OrderTemplate[],
  productMap: Map<string, VerticalPack["products"][number]>,
): Order[] {
  return templates.map((t) => {
    const items = t.items.map((line) => {
      const p = productMap.get(line.productId);
      if (!p) throw new Error(`Seed order missing product ${line.productId}`);
      const lineTotal = p.sellPrice * line.quantity;
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantity: line.quantity,
        unitPrice: p.sellPrice,
        costPrice: p.costPrice,
        discountPercent: 0,
        lineTotal,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const discount = t.discount ?? 0;
    const total = subtotal - discount;
    const createdAt = atDaysAgo(t.daysAgo, t.hour, t.minute ?? t.seq % 50);
    const paymentMethod = t.paymentMethod;
    return {
      id: `o-seed-${t.seq}`,
      code: demoOrderCode(t.seq, t.daysAgo),
      createdAt,
      cashierId: t.cashierId ?? "u_cashier",
      cashierName: t.cashierName ?? "Thu ngân",
      customerId: t.customerId,
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      customerEmail: t.customerEmail,
      items,
      subtotal,
      discount,
      tax: 0,
      total,
      paymentMethod,
      payments: [
        {
          method: paymentMethod === "split" ? "cash" : paymentMethod,
          amount: total,
        },
      ],
      cashReceived: paymentMethod === "cash" ? total + 20000 : undefined,
      changeDue: paymentMethod === "cash" ? 20000 : undefined,
      status: "paid" as const,
      eInvoice: t.eInvoice
        ? {
            ...t.eInvoice,
            issuedAt: createdAt,
          }
        : undefined,
    };
  });
}

function getPack(vertical?: SeedVerticalId | null): VerticalPack {
  const v = vertical ?? getStoredVertical();
  if (!isSeedVertical(v)) {
    throw new Error("Chưa chọn lĩnh vực — mở /chon-linh-vuc");
  }
  return PACKS[v];
}

export function getDemoAccounts(vertical?: SeedVerticalId | null) {
  try {
    return getPack(vertical).demoAccounts;
  } catch {
    return PACKS.pet.demoAccounts;
  }
}

/** @deprecated dùng getDemoAccounts() theo vertical */
export const DEMO_ACCOUNTS = PACKS.pet.demoAccounts;

async function migrateMissingUsers(pack: VerticalPack): Promise<void> {
  for (const user of pack.users) {
    const existing = await db.users.get(user.id);
    if (!existing) await db.users.add(user);
  }
}

async function migrateStoreSettingsIfNeeded(pack: VerticalPack): Promise<void> {
  const row = await db.settings.get("store");
  if (!row) return;
  const needs =
    !row.eInvoice ||
    row.email === undefined ||
    row.legalName === undefined ||
    row.taxCode === undefined ||
    row.billFooter === undefined;
  if (!needs) return;
  await db.settings.put({
    ...row,
    email: row.email ?? pack.settings.email,
    legalName: row.legalName ?? pack.settings.legalName,
    taxCode: row.taxCode ?? pack.settings.taxCode,
    billFooter: row.billFooter ?? pack.settings.billFooter,
    eInvoice: row.eInvoice ?? {
      ...DEFAULT_EINVOICE_CONFIG,
      accountLabel: pack.settings.legalName ?? DEFAULT_EINVOICE_CONFIG.accountLabel,
    },
    updatedAt: new Date().toISOString(),
  });
}

export async function ensureSeeded(
  vertical?: SeedVerticalId | null,
): Promise<void> {
  const v = vertical ?? getStoredVertical();
  if (!isSeedVertical(v)) return;

  reopenDb(v);
  const pack = PACKS[v];

  const seeded = await db.meta.get("seeded");
  if (seeded?.value === "1") {
    const orderCount = await db.orders.count();
    if (orderCount === 0) {
      const productMap = new Map(pack.products.map((p) => [p.id, p]));
      await db.orders.bulkPut(buildOrders(pack.orders, productMap));
      await db.meta.put({
        key: "orderSeq",
        value: String(pack.manifest.orderSeq),
      });
    }
    await migrateStoreSettingsIfNeeded(pack);
    await migrateMissingUsers(pack);
    return;
  }

  const now = new Date().toISOString();
  const products: Product[] = pack.products.map((p) => ({
    ...p,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));
  const productMap = new Map(pack.products.map((p) => [p.id, p]));
  const orders = buildOrders(pack.orders, productMap);

  const settings: StoreSettings = {
    ...pack.settings,
    vertical: v,
    eInvoice: {
      ...DEFAULT_EINVOICE_CONFIG,
      accountLabel:
        pack.settings.legalName ?? DEFAULT_EINVOICE_CONFIG.accountLabel,
    },
    updatedAt: now,
  };

  await db.transaction(
    "rw",
    [
      db.settings,
      db.users,
      db.categories,
      db.products,
      db.suppliers,
      db.customers,
      db.debts,
      db.debtPayments,
      db.orders,
      db.meta,
    ],
    async () => {
      await db.settings.put(settings);
      await db.users.bulkPut(pack.users);
      await db.categories.bulkPut(pack.categories);
      await db.products.bulkPut(products);
      await db.suppliers.bulkPut(pack.suppliers);
      await db.customers.bulkPut(pack.customers);
      await db.debts.bulkPut(pack.debts);
      await db.debtPayments.bulkPut(pack.debtPayments);
      await db.orders.bulkPut(orders);
      await db.meta.put({ key: "seeded", value: "1" });
      await db.meta.put({ key: "vertical", value: v });
      await db.meta.put({ key: "ordersSeeded", value: "1" });
      await db.meta.put({
        key: "orderSeq",
        value: String(pack.manifest.orderSeq),
      });
      await db.meta.put({
        key: "movementSeq",
        value: String(pack.manifest.movementSeq),
      });
    },
  );
}

export async function resetDatabase(): Promise<void> {
  const v = getStoredVertical();
  if (!isSeedVertical(v)) throw new Error("Chưa chọn lĩnh vực");
  await db.delete();
  reopenDb(v);
  await ensureSeeded(v);
}
