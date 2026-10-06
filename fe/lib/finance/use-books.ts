"use client";

import { useLiveQuery } from "dexie-react-hooks";
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
  const finance = useFinanceStore();
  const loading =
    orders === undefined ||
    debts === undefined ||
    categories === undefined ||
    products === undefined;

  return {
    loading,
    orders: orders ?? [],
    debts: debts ?? [],
    categories: categories ?? [],
    products: products ?? [],
    users: users ?? [],
    shifts: shifts ?? [],
    customers: customers ?? [],
    suppliers: suppliers ?? [],
    finance,
  };
}
