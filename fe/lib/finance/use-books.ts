"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  inBranch,
  isAllBranches,
  PRIMARY_BRANCH_ID,
} from "@/lib/branch";
import { useBranchId } from "@/lib/use-branch";
import { db } from "@/lib/db";
import { useFinanceStore } from "@/stores/finance-store";

export function useBooks() {
  const orders = useLiveQuery(() => db.orders.toArray());
  const debts = useLiveQuery(() => db.debts.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const shifts = useLiveQuery(() => db.shifts.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const financeRaw = useFinanceStore();
  const branchId = useBranchId();
  const finance = useMemo(() => {
    const keepOpening =
      branchId === PRIMARY_BRANCH_ID || isAllBranches(branchId);
    return {
      ...financeRaw,
      txns: financeRaw.txns.filter((t) => inBranch(t.branchId, branchId)),
      accounts: financeRaw.accounts.map((a) =>
        keepOpening ? a : { ...a, openingBalance: 0 },
      ),
    };
  }, [financeRaw, branchId]);
  const loading =
    orders === undefined ||
    debts === undefined ||
    categories === undefined ||
    products === undefined;

  return {
    loading,
    orders: (orders ?? []).filter((o) => inBranch(o.branchId, branchId)),
    debts: (debts ?? []).filter((d) => inBranch(d.branchId, branchId)),
    categories: categories ?? [],
    products: products ?? [],
    users: users ?? [],
    shifts: (shifts ?? []).filter((s) => inBranch(s.branchId, branchId)),
    customers: customers ?? [],
    suppliers: suppliers ?? [],
    finance,
  };
}
