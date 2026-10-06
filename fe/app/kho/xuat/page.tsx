"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { stockOut } from "@/lib/services/inventory";
import { useAuthStore } from "@/stores/auth-store";

const REASONS = [
  "Hàng lỗi / đổi trả NCC",
  "Hết hạn sử dụng",
  "Sử dụng nội bộ / trưng bày",
  "Điều chỉnh kiểm kê",
  "Khác",
];

export default function StockOutPage() {
  const router = useRouter();
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");

  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id);
  }, [products, productId]);

  return (
    <AppShell>
      <PageHeader
        title="Xuất kho"
        actions={
          <Link href="/kho">
            <Button variant="outline">Quay lại</Button>
          </Link>
        }
      />
      <Card className="mx-auto max-w-xl space-y-3 p-4">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Lý do</span>
          <select
            className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Sản phẩm</span>
          <select
            className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (tồn {p.stock})
              </option>
            ))}
          </select>
        </label>
        <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        <Input placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button
          className="w-full"
          onClick={async () => {
            if (!user) return;
            try {
              await stockOut({
                user,
                reason,
                note,
                items: [{ productId, quantity: Number(qty) || 0 }],
              });
              toast.success("Xuất kho thành công");
              router.push("/kho");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Lỗi");
            }
          }}
        >
          Xác nhận xuất kho
        </Button>
      </Card>
    </AppShell>
  );
}
