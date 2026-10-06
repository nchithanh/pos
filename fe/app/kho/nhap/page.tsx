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
import { stockIn } from "@/lib/services/inventory";
import { formatVnd } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type Line = { productId: string; quantity: string; unitCost: string };

export default function StockInPage() {
  const router = useRouter();
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || !products.length || !suppliers.length) return;
    setSupplierId(suppliers[0].id);
    setLines([
      {
        productId: products[0].id,
        quantity: "1",
        unitCost: String(products[0].costPrice),
      },
    ]);
    setReady(true);
  }, [products, suppliers, ready]);

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0),
    0,
  );

  return (
    <AppShell>
      <PageHeader
        title="Nhập kho"
        actions={
          <Link href="/kho">
            <Button variant="outline">Quay lại</Button>
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="space-y-3 p-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Nhà cung cấp</span>
            <select
              className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {lines.map((line, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-3">
              <select
                className="h-11 rounded-[10px] border px-3 dark:bg-slate-900"
                value={line.productId}
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === idx
                        ? {
                            productId: e.target.value,
                            quantity: l.quantity,
                            unitCost: String(p?.costPrice ?? 0),
                          }
                        : l,
                    ),
                  );
                }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                value={line.quantity}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === idx ? { ...l, quantity: e.target.value } : l,
                    ),
                  )
                }
              />
              <Input
                type="number"
                value={line.unitCost}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === idx ? { ...l, unitCost: e.target.value } : l,
                    ),
                  )
                }
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setLines((p) => [
                ...p,
                {
                  productId: products[0]?.id ?? "",
                  quantity: "1",
                  unitCost: String(products[0]?.costPrice ?? 0),
                },
              ])
            }
          >
            Thêm dòng
          </Button>
          <Input
            placeholder="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Tổng tiền nhập</p>
          <p className="text-2xl font-bold">{formatVnd(total)}</p>
          <Button
            className="mt-4 w-full"
            onClick={async () => {
              if (!user) return;
              try {
                await stockIn({
                  supplierId,
                  note,
                  user,
                  items: lines
                    .map((l) => ({
                      productId: l.productId,
                      quantity: Number(l.quantity) || 0,
                      unitCost: Number(l.unitCost) || 0,
                    }))
                    .filter((l) => l.quantity > 0),
                });
                toast.success("Nhập kho thành công");
                router.push("/kho");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Lỗi");
              }
            }}
          >
            Xác nhận nhập kho
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
