"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { PackageBadge } from "@/components/finance/widgets";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { postStockDelta } from "@/lib/warehouse/ops";
import { useAuthStore } from "@/stores/auth-store";

const REASONS = ["Hàng hỏng", "Hàng mất", "Nhập sai", "Xuất sai", "Khác"];

export default function StocktakePage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const [productId, setProductId] = useState("");
  const [actual, setActual] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const product = products.find((p) => p.id === productId);
  const counted = Number(actual);
  const diff = product && Number.isFinite(counted) ? counted - product.stock : 0;

  const confirm = async () => {
    if (!user || !product || !Number.isFinite(counted)) {
      notify.error("Chọn sản phẩm và số đếm");
      return;
    }
    if (diff === 0) {
      notify.success("Khớp sổ, không cần điều chỉnh");
      return;
    }
    try {
      await postStockDelta({
        lines: [{ productId: product.id, delta: diff }],
        type: "adjust",
        reason: diff < 0 ? "Điều chỉnh giảm" : "Điều chỉnh tăng",
        note: reason,
        user,
      });
      notify.success("Đã điều chỉnh tồn theo kiểm kê");
      setActual("");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Không điều chỉnh được");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Kiểm kê"
        description="Đếm thực tế, so với sổ, rồi mới điều chỉnh tồn."
      />
      <WarehouseNav />
      <Card className="max-w-lg space-y-3 p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold">Phiếu kiểm kê</h2>
          <PackageBadge tier="advanced" />
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Sản phẩm</span>
          <select
            className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Chọn</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · sổ {p.stock}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Số đếm thực tế</span>
          <Input type="number" value={actual} onChange={(e) => setActual(e.target.value)} />
        </label>
        {product && actual !== "" ? (
          <p className="text-sm">
            Sổ {product.stock} · Thực tế {counted} · Lệch {diff}
          </p>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Lý do</span>
          <select
            className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <Button onClick={() => void confirm()}>Xác nhận điều chỉnh</Button>
      </Card>
    </AppShell>
  );
}
