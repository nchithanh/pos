"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { db, getStockStatus } from "@/lib/db";
import { stockAdjust } from "@/lib/services/inventory";
import { formatVnd } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function InventoryPage() {
  const products = useLiveQuery(() => db.products.toArray());
  const movements = useLiveQuery(() => db.movements.orderBy("createdAt").reverse().limit(20).toArray());
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState("0");

  const stats = useMemo(() => {
    const list = products ?? [];
    return {
      qty: list.reduce((s, p) => s + p.stock, 0),
      value: list.reduce((s, p) => s + p.stock * p.costPrice, 0),
      low: list.filter((p) => getStockStatus(p.stock, p.minStock) === "low").length,
      out: list.filter((p) => getStockStatus(p.stock, p.minStock) === "out").length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    return (products ?? []).filter((p) => {
      const st = getStockStatus(p.stock, p.minStock);
      if (filter === "low" && st !== "low") return false;
      if (filter === "out" && st !== "out") return false;
      const query = q.trim().toLowerCase();
      if (!query) return true;
      return p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    });
  }, [products, q, filter]);

  return (
    <AppShell>
      <PageHeader
        title="Kho hàng"
        description="Tồn kho real-time · phiếu nhập/xuất/điều chỉnh"
        actions={
          <>
            <Link href="/kho/nhap"><Button><ArrowDownToLine size={16} /> Nhập</Button></Link>
            <Link href="/kho/xuat"><Button variant="outline"><ArrowUpFromLine size={16} /> Xuất</Button></Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Tổng tồn", String(stats.qty)],
          ["Giá trị", formatVnd(stats.value)],
          ["Sắp hết", String(stats.low)],
          ["Hết hàng", String(stats.out)],
        ].map(([l, v]) => (
          <Card key={l} className="p-4">
            <p className="text-sm text-slate-500">{l}</p>
            <p className="mt-1 text-xl font-bold">{v}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input className="flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong kho…" />
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f === "all" ? "Tất cả" : f === "low" ? "Sắp hết" : "Hết"}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((p) => (
          <Card key={p.id} className="p-3">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-slate-400">{p.stock} / min {p.minStock}</p>
              </div>
              <Badge status={getStockStatus(p.stock, p.minStock)} />
            </div>
            <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => { setAdjustId(p.id); setNewStock(String(p.stock)); }}>
              Điều chỉnh
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-slate-50 dark:bg-slate-800">
            <tr>
              {["Sản phẩm", "Tồn", "Tối thiểu", "Giá trị", "TT", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.stock} {p.unit}</td>
                <td className="px-4 py-3">{p.minStock}</td>
                <td className="px-4 py-3">{formatVnd(p.stock * p.costPrice)}</td>
                <td className="px-4 py-3"><Badge status={getStockStatus(p.stock, p.minStock)} /></td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => { setAdjustId(p.id); setNewStock(String(p.stock)); }}>Điều chỉnh</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="mb-3 font-bold">Lịch sử gần đây</h2>
        <ul className="space-y-2 text-sm">
          {(movements ?? []).map((m) => (
            <li key={m.id} className="flex justify-between rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800">
              <span className="font-medium">{m.code} · {m.type}</span>
              <span className="text-slate-500">{m.userName}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={!!adjustId} onClose={() => setAdjustId(null)} title="Điều chỉnh tồn">
        <Input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} />
        <Button
          className="mt-4 w-full"
          onClick={async () => {
            if (!user || !adjustId) return;
            try {
              await stockAdjust({ productId: adjustId, newStock: Number(newStock) || 0, user });
              toast.success("Đã điều chỉnh");
              setAdjustId(null);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Lỗi");
            }
          }}
        >
          Lưu
        </Button>
      </Dialog>
    </AppShell>
  );
}
