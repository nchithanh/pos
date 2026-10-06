import type { ReactNode } from "react";

/** Seed IDs — dùng cho static export GitHub Pages */
const SUPPLIER_IDS = ["sup-01", "sup-02", "sup-03", "sup-04", "sup-05"];

export function generateStaticParams() {
  return SUPPLIER_IDS.map((id) => ({ id }));
}

export default function SupplierDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
