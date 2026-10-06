import type { ReactNode } from "react";
import { INITIAL_SUPPLIERS } from "@/data/suppliers";

export function generateStaticParams() {
  return INITIAL_SUPPLIERS.map((s) => ({ id: s.id }));
}

export default function SupplierDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
