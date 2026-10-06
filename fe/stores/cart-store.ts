"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

interface CartState {
  lines: CartLine[];
  discount: number;
  note: string;
  customerId?: string;
  addProduct: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  setLineNote: (productId: string, note: string) => void;
  setLineDiscount: (productId: string, percent: number) => void;
  removeLine: (productId: string) => void;
  clear: () => void;
  setDiscount: (n: number) => void;
  setNote: (n: string) => void;
  setCustomerId: (id?: string) => void;
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
      note: "",
      customerId: undefined,

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
        set({ lines: [], discount: 0, note: "", customerId: undefined }),

      setDiscount: (n) => set({ discount: Math.max(0, n) }),
      setNote: (n) => set({ note: n }),
      setCustomerId: (id) => set({ customerId: id }),

      loadHeld: (payload) =>
        set({
          lines: payload.lines,
          discount: payload.discount,
          note: payload.note ?? "",
          customerId: payload.customerId,
        }),
    }),
    { name: "dolphin-pos-cart" },
  ),
);
