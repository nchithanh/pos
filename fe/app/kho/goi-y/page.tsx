"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { PackageBadge } from "@/components/finance/widgets";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { db, getStockStatus } from "@/lib/db";

export default function InsightPage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const low = products.filter(
    (p) => p.active && getStockStatus(p.stock, p.minStock) !== "in_stock",
  );
  const focus = products.find((p) => /tofu|cát đậu/i.test(p.name)) ?? low[0];

  return (
    <AppShell>
      <PageHeader
        title="Gợi ý tồn kho"
        description="Nhận định mô phỏng từ tồn hiện tại. Không gọi mô hình dự báo bên ngoài."
      />
      <WarehouseNav />
      <div className="mb-3 flex gap-2">
        <PackageBadge tier="pro" />
        <PackageBadge tier="ai" />
      </div>
      <div className="space-y-3">
        <Card className="p-4 text-sm">
          <p className="font-semibold">3 lô hàng sẽ hết hạn trong 30 ngày.</p>
          <p className="mt-1 text-slate-500">
            Pate Me-O · LOT-20260801 · hạn 28/10/2026 · còn hạn
          </p>
          <Link href="/kho/ton" className="mt-2 inline-flex min-h-11 items-center font-semibold text-emerald-700">
            Xem lô
          </Link>
        </Card>
        {focus ? (
          <Card className="p-4 text-sm">
            <p>
              {focus.name} đang tồn {focus.stock} {focus.unit}, mức tối thiểu {focus.minStock}.
            </p>
            <p className="mt-2">
              Với nhịp bán gần đây, tồn có thể chỉ đủ vài ngày. Đề xuất nhập thêm khoảng 30 {focus.unit}.
            </p>
          </Card>
        ) : null}
        <Card className="p-4 text-sm">
          <p className="font-semibold">{low.length} sản phẩm có nguy cơ hết hàng.</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            {low.slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.name} · tồn {p.stock}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
