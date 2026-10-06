"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

export type OrderDiscountMode = "amount" | "percent";

interface CartState {
  lines: CartLine[];
  /** Giảm giá đơn lưu dạng số tiền (VND) sau khi quy đổi */
  discount: number;
  discountMode: OrderDiscountMode;
  /** Giá trị nhập trên UI (% hoặc VND tùy mode) — chỉ để khôi phục form */
  discountInput: number;
  note: string;
  customerId?: string;
  /** Điểm khách muốn đổi khi thanh toán */
  pointsToRedeem: number;
  addProduct: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  setLineNote: (productId: string, note: string) => void;
  setLineDiscount: (productId: string, percent: number) => void;
  removeLine: (productId: string) => void;
  clear: () => void;
  setOrderDiscount: (
    mode: OrderDiscountMode,
    input: number,
    subtotal: number,
  ) => void;
  setDiscount: (n: number) => void;
  setNote: (n: string) => void;
  setCustomerId: (id?: string) => void;
  setPointsToRedeem: (n: number) => void;
  loadHeld: (payload: {
    lines: CartLine[];
    discount: number;
    note?: string;
    customerId?: string;
  }) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      discount: 0,
      discountMode: "amount",
      discountInput: 0,
      note: "",
      customerId: undefined,
      pointsToRedeem: 0,

      addProduct: (productId, qty = 1) => {
        const lines = [...get().lines];
        const idx = lines.findIndex((l) => l.productId === productId);
        if (idx >= 0) {
          lines[idx] = {
            ...lines[idx],
            quantity: lines[idx].quantity + qty,
          };
        } else {
          lines.push({ productId, quantity: qty });
        }
        set({ lines });
      },

      setQty: (productId, qty) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((l) => l.productId !== productId) });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.productId === productId ? { ...l, quantity: qty } : l,
          ),
        });
      },

      setLineNote: (productId, note) =>
        set({
          lines: get().lines.map((l) =>
            l.productId === productId ? { ...l, note } : l,
          ),
        }),

      setLineDiscount: (productId, percent) =>
        set({
          lines: get().lines.map((l) =>
            l.productId === productId
              ? { ...l, discountPercent: Math.max(0, Math.min(100, percent)) }
              : l,
          ),
        }),

      removeLine: (productId) =>
        set({ lines: get().lines.filter((l) => l.productId !== productId) }),

      clear: () =>
        set({
          lines: [],
          discount: 0,
          discountMode: "amount",
          discountInput: 0,
          note: "",
          customerId: undefined,
          pointsToRedeem: 0,
        }),

      setOrderDiscount: (mode, input, subtotal) => {
        const raw = Math.max(0, input);
        const amount =
          mode === "percent"
            ? Math.round((subtotal * Math.min(100, raw)) / 100)
            : Math.min(raw, subtotal);
        set({
          discountMode: mode,
          discountInput: raw,
          discount: amount,
        });
      },

      setDiscount: (n) =>
        set({
          discount: Math.max(0, n),
          discountMode: "amount",
          discountInput: Math.max(0, n),
        }),
      setNote: (n) => set({ note: n }),
      setCustomerId: (id) => set({ customerId: id, pointsToRedeem: 0 }),
      setPointsToRedeem: (n) => set({ pointsToRedeem: Math.max(0, Math.floor(n)) }),

      loadHeld: (payload) =>
        set({
          lines: payload.lines,
          discount: payload.discount,
          discountMode: "amount",
          discountInput: payload.discount,
          note: payload.note ?? "",
          customerId: payload.customerId,
          pointsToRedeem: 0,
        }),
    }),
    {
      name: "dolphin-pos-cart",
      partialize: (s) => ({
        lines: s.lines,
        discount: s.discount,
        discountMode: s.discountMode,
        discountInput: s.discountInput,
        note: s.note,
        customerId: s.customerId,
        pointsToRedeem: s.pointsToRedeem,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        return {
          ...current,
          ...p,
          discountMode: p.discountMode ?? "amount",
          discountInput: p.discountInput ?? p.discount ?? 0,
          discount: p.discount ?? 0,
          lines: p.lines ?? [],
          pointsToRedeem: p.pointsToRedeem ?? 0,
        };
      },
    },
  ),
);
