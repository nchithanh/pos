"use client";

import { tr } from "@/lib/i18n/translate";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "@/lib/db";
import {
  inBranch,
  PRIMARY_BRANCH_ID,
  readBranchId,
  readWriteBranchId,
} from "@/lib/branch";
import { uid } from "@/lib/utils";
import type { Shift, User } from "@/types";

interface AuthState {
  user: User | null;
  shift: Shift | null;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  loginWithPin: (pin: string) => Promise<User>;
  loginWithPassword: (email: string, password: string) => Promise<User>;
  logout: () => void;
  openShift: (openingCash: number, note?: string) => Promise<Shift>;
  closeShift: (closingCash: number, note?: string) => Promise<void>;
  refreshShift: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      shift: null,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      loginWithPin: async (pin) => {
        const user = await db.users
          .filter((u) => u.pin === pin && u.status === "active")
          .first();
        if (!user) throw new Error(tr("Mã PIN không đúng"));
        const active = readBranchId();
        const open = await db.shifts
          .filter(
            (s) =>
              s.userId === user.id &&
              s.status === "open" &&
              inBranch(s.branchId, active),
          )
          .first();
        set({ user, shift: open ?? null });
        return user;
      },

      loginWithPassword: async (email, password) => {
        const user = await db.users
          .filter(
            (u) =>
              u.email.toLowerCase() === email.trim().toLowerCase() &&
              u.password === password &&
              u.status === "active",
          )
          .first();
        if (!user) throw new Error(tr("Email hoặc mật khẩu không đúng"));
        const active = readBranchId();
        const open = await db.shifts
          .filter(
            (s) =>
              s.userId === user.id &&
              s.status === "open" &&
              inBranch(s.branchId, active),
          )
          .first();
        set({ user, shift: open ?? null });
        return user;
      },

      logout: () => set({ user: null, shift: null }),

      openShift: async (openingCash, note) => {
        const user = get().user;
        if (!user) throw new Error(tr("Chưa đăng nhập"));
        const active = readBranchId();
        const existing = await db.shifts
          .filter(
            (s) =>
              s.userId === user.id &&
              s.status === "open" &&
              inBranch(s.branchId, active),
          )
          .first();
        if (existing) {
          set({ shift: existing });
          return existing;
        }
        const shift: Shift = {
          id: uid("shift"),
          userId: user.id,
          userName: user.name,
          openedAt: new Date().toISOString(),
          openingCash,
          note,
          status: "open",
          branchId: readWriteBranchId() || PRIMARY_BRANCH_ID,
        };
        await db.shifts.add(shift);
        set({ shift });
        return shift;
      },

      closeShift: async (closingCash, note) => {
        const shift = get().shift;
        if (!shift) throw new Error(tr("Chưa mở ca"));
        await db.shifts.update(shift.id, {
          status: "closed",
          closedAt: new Date().toISOString(),
          closingCash,
          note: note ?? shift.note,
        });
        set({ shift: null });
      },

      refreshShift: async () => {
        const user = get().user;
        if (!user) return;
        const active = readBranchId();
        const open = await db.shifts
          .filter(
            (s) =>
              s.userId === user.id &&
              s.status === "open" &&
              inBranch(s.branchId, active),
          )
          .first();
        set({ shift: open ?? null });
      },
    }),
    {
      name: "dolphin-pos-auth",
      partialize: (s) => ({ user: s.user, shift: s.shift }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
