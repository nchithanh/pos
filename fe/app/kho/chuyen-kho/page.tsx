"use client";

import { tr } from "@/lib/i18n/translate";

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
import { useWarehouseStore } from "@/stores/warehouse-store";
import { uid } from "@/lib/utils";

export default function TransferPage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const transfers = useWarehouseStore((s) => s.transfers);
  const addTransfer = useWarehouseStore((s) => s.addTransfer);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("20");
  const product = products.find((p) => p.id === productId);

  const complete = async () => {
    if (!user || !product) return;
    const n = Number(qty) || 0;
    if (n <= 0 || n > product.stock) {
      notify.error(tr("Số lượng vượt tồn kho nguồn"));
      return;
    }
    try {
      await postStockDelta({
        lines: [{ productId: product.id, delta: -n }],
        type: "out",
        reason: tr("Chuyển kho"),
        note: tr("Kho tổng → Kho cửa hàng"),
        user,
      });
      await postStockDelta({
        lines: [{ productId: product.id, delta: n }],
        type: "in",
        reason: tr("Nhận chuyển kho"),
        note: tr("Kho tổng → Kho cửa hàng"),
        user,
      });
      addTransfer({
        id: uid("tf"),
        code: `CK${Date.now().toString().slice(-4)}`,
        from: tr("Kho tổng"),
        to: tr("Kho cửa hàng"),
        productId: product.id,
        name: product.name,
        qty: n,
        status: "received",
        createdAt: new Date().toISOString(),
        createdBy: user.name,
      });
      notify.success(tr("Đã nhận chuyển kho. Không tính doanh thu hay chi phí."));
    } catch (e) {
      notify.error(e instanceof Error ? e.message : tr("Không chuyển được"));
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={tr("Chuyển kho")}
        description={tr("Hàng rời kho nguồn và vào kho đích. Không phải bán hàng.")}
      />
      <WarehouseNav />
      <Card className="mb-4 max-w-lg space-y-3 p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold">{tr("Kho tổng → Kho cửa hàng")}</h2>
          <PackageBadge tier="advanced" />
        </div>
        <p className="text-xs text-slate-500">
          Bản demo một sổ tồn: phiếu trừ rồi cộng lại cùng sản phẩm để thể hiện hai bước, số tồn cuối không đổi nếu cùng một kho sổ.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">{tr("Sản phẩm")}</span>
          <select
            className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">{tr("Chọn")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">{tr("Số lượng")}</span>
          <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
        <Button onClick={() => void complete()}>{tr("Xác nhận đã nhận")}</Button>
      </Card>
      <ul className="space-y-2 text-sm">
        {transfers.map((t) => (
          <li key={t.id} className="rounded-[10px] border border-slate-200 px-3 py-2">
            {t.code} · {t.name} · {t.qty} · {t.from} → {t.to} · Đã nhận
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
