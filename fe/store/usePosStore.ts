"use client";

import { create } from "zustand";
import { INITIAL_PRODUCTS } from "@/data/products";
import { INITIAL_ORDERS } from "@/data/orders";
import { INITIAL_SUPPLIERS } from "@/data/suppliers";
import { INITIAL_DEBTS } from "@/data/debts";
import { INITIAL_EMPLOYEES } from "@/data/employees";
import { INITIAL_STOCK_INS, INITIAL_STOCK_OUTS } from "@/data/stock";
import type {
  CartItem,
  Debt,
  Employee,
  Order,
  PaymentMethod,
  Product,
  StockInRecord,
  StockOutRecord,
  Supplier,
  Toast,
} from "@/lib/types";

type ProductInput = Omit<Product, "id" | "active" | "imageColor" | "emoji"> & {
  imageColor?: string;
  emoji?: string;
};

interface PosState {
  products: Product[];
  orders: Order[];
  suppliers: Supplier[];
  debts: Debt[];
  employees: Employee[];
  stockIns: StockInRecord[];
  stockOuts: StockOutRecord[];
  cart: CartItem[];
  cartDiscount: number;
  toasts: Toast[];
  lastCheckoutOrder: Order | null;

  addToast: (type: Toast["type"], message: string) => void;
  dismissToast: (id: string) => void;

  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setCartQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCartDiscount: (amount: number) => void;

  checkout: (method: PaymentMethod, cashReceived?: number) => Order | null;
  clearLastCheckout: () => void;

  addProduct: (input: ProductInput) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  stockIn: (payload: {
    supplierId: string;
    items: { productId: string; quantity: number; costPrice: number }[];
    note: string;
  }) => void;
  stockOut: (payload: {
    items: { productId: string; quantity: number }[];
    reason: string;
    note: string;
  }) => void;

  payDebt: (debtId: string, amount: number) => void;

  addEmployee: (input: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  toggleEmployeeStatus: (id: string) => void;
}

let toastSeq = 0;
let orderSeq = 42;
let productSeq = 42;
let stockInSeq = 3;
let stockOutSeq = 2;
let employeeSeq = 5;

function genId(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(2, "0")}`;
}

export const usePosStore = create<PosState>((set, get) => ({
  products: INITIAL_PRODUCTS,
  orders: INITIAL_ORDERS,
  suppliers: INITIAL_SUPPLIERS,
  debts: INITIAL_DEBTS,
  employees: INITIAL_EMPLOYEES,
  stockIns: INITIAL_STOCK_INS,
  stockOuts: INITIAL_STOCK_OUTS,
  cart: [],
  cartDiscount: 0,
  toasts: [],
  lastCheckoutOrder: null,

  addToast: (type, message) => {
    const id = `t-${++toastSeq}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  addToCart: (productId, qty = 1) => {
    const product = get().products.find((p) => p.id === productId);
    if (!product || !product.active) {
      get().addToast("error", "Sản phẩm không khả dụng");
      return;
    }
    if (product.stock <= 0) {
      get().addToast("error", "Sản phẩm đã hết hàng");
      return;
    }
    const existing = get().cart.find((c) => c.productId === productId);
    const nextQty = (existing?.quantity ?? 0) + qty;
    if (nextQty > product.stock) {
      get().addToast("error", `Chỉ còn ${product.stock} ${product.unit}`);
      return;
    }
    set((s) => {
      if (existing) {
        return {
          cart: s.cart.map((c) =>
            c.productId === productId ? { ...c, quantity: nextQty } : c,
          ),
        };
      }
      return { cart: [...s.cart, { productId, quantity: qty }] };
    });
  },

  removeFromCart: (productId) =>
    set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),

  setCartQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const product = get().products.find((p) => p.id === productId);
    if (!product) return;
    if (quantity > product.stock) {
      get().addToast("error", `Chỉ còn ${product.stock} ${product.unit}`);
      return;
    }
    set((s) => ({
      cart: s.cart.map((c) =>
        c.productId === productId ? { ...c, quantity } : c,
      ),
    }));
  },

  clearCart: () => set({ cart: [], cartDiscount: 0 }),

  setCartDiscount: (amount) =>
    set({ cartDiscount: Math.max(0, Math.round(amount)) }),

  checkout: (method, cashReceived) => {
    const { cart, products, cartDiscount } = get();
    if (cart.length === 0) {
      get().addToast("error", "Giỏ hàng trống");
      return null;
    }

    const lines = cart.map((item) => {
      const p = products.find((x) => x.id === item.productId)!;
      return {
        productId: p.id,
        productName: p.name,
        quantity: item.quantity,
        unitPrice: p.sellPrice,
        lineTotal: p.sellPrice * item.quantity,
      };
    });

    for (const line of lines) {
      const p = products.find((x) => x.id === line.productId)!;
      if (line.quantity > p.stock) {
        get().addToast("error", `${p.name} không đủ tồn`);
        return null;
      }
    }

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const discount = Math.min(cartDiscount, subtotal);
    const total = subtotal - discount;

    if (method === "cash" && cashReceived != null && cashReceived < total) {
      get().addToast("error", "Tiền khách đưa chưa đủ");
      return null;
    }

    orderSeq += 1;
    const code = `DH-061026-${String(orderSeq).padStart(3, "0")}`;
    const order: Order = {
      id: `o-${orderSeq}`,
      code,
      createdAt: new Date().toISOString(),
      items: lines,
      subtotal,
      discount,
      total,
      paymentMethod: method,
      cashierName: "Lan Anh",
    };

    set((s) => ({
      products: s.products.map((p) => {
        const line = lines.find((l) => l.productId === p.id);
        if (!line) return p;
        return { ...p, stock: p.stock - line.quantity };
      }),
      orders: [order, ...s.orders],
      cart: [],
      cartDiscount: 0,
      lastCheckoutOrder: order,
    }));

    get().addToast("success", "Thanh toán thành công");
    return order;
  },

  clearLastCheckout: () => set({ lastCheckoutOrder: null }),

  addProduct: (input) => {
    productSeq += 1;
    const product: Product = {
      id: genId("p", productSeq + 100),
      name: input.name,
      sku: input.sku,
      categoryId: input.categoryId,
      sellPrice: input.sellPrice,
      costPrice: input.costPrice,
      stock: input.stock,
      minStock: input.minStock,
      unit: input.unit,
      supplierId: input.supplierId,
      imageColor: input.imageColor ?? "#E8F5E9",
      emoji: input.emoji ?? "🐾",
      active: true,
    };
    set((s) => ({ products: [product, ...s.products] }));
    get().addToast("success", "Đã thêm sản phẩm");
    return product;
  },

  updateProduct: (id, patch) => {
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    get().addToast("success", "Đã cập nhật sản phẩm");
  },

  deleteProduct: (id) => {
    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
      cart: s.cart.filter((c) => c.productId !== id),
    }));
    get().addToast("success", "Đã xóa sản phẩm");
  },

  stockIn: ({ supplierId, items, note }) => {
    if (items.length === 0) {
      get().addToast("error", "Chưa chọn sản phẩm nhập");
      return;
    }
    stockInSeq += 1;
    const total = items.reduce((s, i) => s + i.quantity * i.costPrice, 0);
    const record: StockInRecord = {
      id: `si-${stockInSeq}`,
      code: `NK-061026-${String(stockInSeq).padStart(2, "0")}`,
      supplierId,
      createdAt: new Date().toISOString(),
      items,
      total,
      note,
    };
    set((s) => ({
      stockIns: [record, ...s.stockIns],
      products: s.products.map((p) => {
        const line = items.find((i) => i.productId === p.id);
        if (!line) return p;
        return {
          ...p,
          stock: p.stock + line.quantity,
          costPrice: line.costPrice,
        };
      }),
      suppliers: s.suppliers.map((sup) =>
        sup.id === supplierId
          ? {
              ...sup,
              totalPurchased: sup.totalPurchased + total,
              debt: sup.debt + total,
            }
          : sup,
      ),
    }));
    get().addToast("success", "Nhập kho thành công");
  },

  stockOut: ({ items, reason, note }) => {
    if (items.length === 0) {
      get().addToast("error", "Chưa chọn sản phẩm xuất");
      return;
    }
    for (const item of items) {
      const p = get().products.find((x) => x.id === item.productId);
      if (!p || item.quantity > p.stock) {
        get().addToast("error", `${p?.name ?? "Sản phẩm"} không đủ tồn`);
        return;
      }
    }
    stockOutSeq += 1;
    const record: StockOutRecord = {
      id: `so-${stockOutSeq}`,
      code: `XK-061026-${String(stockOutSeq).padStart(2, "0")}`,
      createdAt: new Date().toISOString(),
      items,
      reason,
      note,
    };
    set((s) => ({
      stockOuts: [record, ...s.stockOuts],
      products: s.products.map((p) => {
        const line = items.find((i) => i.productId === p.id);
        if (!line) return p;
        return { ...p, stock: p.stock - line.quantity };
      }),
    }));
    get().addToast("success", "Xuất kho thành công");
  },

  payDebt: (debtId, amount) => {
    const debt = get().debts.find((d) => d.id === debtId);
    if (!debt) return;
    const remaining = debt.amount - debt.paidAmount;
    const pay = Math.min(Math.max(0, amount), remaining);
    if (pay <= 0) {
      get().addToast("error", "Số tiền không hợp lệ");
      return;
    }
    const paidAmount = debt.paidAmount + pay;
    const status =
      paidAmount >= debt.amount
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : debt.status;

    set((s) => ({
      debts: s.debts.map((d) =>
        d.id === debtId
          ? {
              ...d,
              paidAmount,
              status: status === "paid" ? "paid" : status,
            }
          : d,
      ),
      suppliers:
        debt.type === "payable"
          ? s.suppliers.map((sup) =>
              sup.id === debt.partyId
                ? { ...sup, debt: Math.max(0, sup.debt - pay) }
                : sup,
            )
          : s.suppliers,
    }));
    get().addToast("success", "Đã ghi nhận thanh toán công nợ");
  },

  addEmployee: (input) => {
    employeeSeq += 1;
    const emp: Employee = { ...input, id: `e-${employeeSeq}` };
    set((s) => ({ employees: [...s.employees, emp] }));
    get().addToast("success", "Đã thêm nhân viên");
  },

  updateEmployee: (id, patch) => {
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    get().addToast("success", "Đã cập nhật nhân viên");
  },

  toggleEmployeeStatus: (id) => {
    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === id
          ? {
              ...e,
              status: e.status === "active" ? "inactive" : "active",
            }
          : e,
      ),
    }));
    get().addToast("success", "Đã đổi trạng thái nhân viên");
  },
}));

export function selectCartTotals(state: PosState) {
  const subtotal = state.cart.reduce((sum, item) => {
    const p = state.products.find((x) => x.id === item.productId);
    return sum + (p ? p.sellPrice * item.quantity : 0);
  }, 0);
  const discount = Math.min(state.cartDiscount, subtotal);
  const total = subtotal - discount;
  const count = state.cart.reduce((s, i) => s + i.quantity, 0);
  return { subtotal, discount, total, count };
}
