"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { postStockDelta } from "@/lib/warehouse/ops";
import { useAuthStore } from "@/stores/auth-store";

export default function AdjustPage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [dir, setDir] = useState<"up" | "down">("down");
  const [reason, setReason] = useState("Hàng hỏng");
  const product = products.find((p) => p.id === productId);
  const allowed = user?.role === "owner" || user?.role === "manager";

  const submit = async () => {
    if (!allowed) {
      notify.error("Cần quyền quản lý để điều chỉnh tồn");
      return;
    }
    if (!user || !product) return;
    const n = Number(qty) || 0;
    if (n <= 0) {
      notify.error("Số lượng không hợp lệ");
      return;
    }
    const delta = dir === "up" ? n : -n;
    try {
      await postStockDelta({
        lines: [{ productId: product.id, delta }],
        type: "adjust",
        reason: dir === "up" ? "Điều chỉnh tăng" : "Điều chỉnh giảm",
        note: reason,
        user,
      });
      notify.success("Đã ghi điều chỉnh và biến động kho");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Không điều chỉnh được");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Điều chỉnh tồn"
        description="Mỗi lần chỉnh đều ghi người làm, lý do, tồn trước và tồn sau."
      />
      <WarehouseNav />
      <Card className="max-w-lg space-y-3 p-4">
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
                {p.name} · tồn {p.stock}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button variant={dir === "up" ? "default" : "outline"} onClick={() => setDir("up")}>
            Tăng
          </Button>
          <Button variant={dir === "down" ? "default" : "outline"} onClick={() => setDir("down")}>
            Giảm
          </Button>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Số lượng</span>
          <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Lý do</span>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <Button disabled={!allowed} onClick={() => void submit()}>
          Ghi điều chỉnh
        </Button>
      </Card>
    </AppShell>
  );
}
