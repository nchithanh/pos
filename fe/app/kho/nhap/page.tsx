"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatVnd } from "@/lib/format";
import { usePosStore } from "@/store/usePosStore";

type Line = { productId: string; quantity: string; costPrice: string };

export default function StockInPage() {
  const router = useRouter();
  const products = usePosStore((s) => s.products);
  const suppliers = usePosStore((s) => s.suppliers);
  const stockIn = usePosStore((s) => s.stockIn);
  const stockIns = usePosStore((s) => s.stockIns);

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { productId: products[0]?.id ?? "", quantity: "1", costPrice: String(products[0]?.costPrice ?? 0) },
  ]);

  const total = useMemo(
    () =>
      lines.reduce(
        (s, l) => s + (Number(l.quantity) || 0) * (Number(l.costPrice) || 0),
        0,
      ),
    [lines],
  );

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        if (patch.productId) {
          const p = products.find((x) => x.id === patch.productId);
          if (p) next.costPrice = String(p.costPrice);
        }
        return next;
      }),
    );
  };

  const submit = () => {
    const items = lines
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity) || 0,
        costPrice: Number(l.costPrice) || 0,
      }))
      .filter((l) => l.productId && l.quantity > 0);
    if (!supplierId || items.length === 0) return;
    stockIn({ supplierId, items, note });
    router.push("/kho");
  };

  return (
    <AppShell>
      <PageHeader
        title="Nhập kho"
        description="Chọn nhà cung cấp → sản phẩm → số lượng → xác nhận"
        actions={
          <Link href="/kho" className="pos-btn pos-btn-outline">
            <ArrowLeft size={16} />
            Quay lại kho
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="pos-card space-y-4 p-4">
          <label className="block">
            <span className="pos-label">Nhà cung cấp</span>
            <select
              className="pos-input pos-input-rect"
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

          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-[10px] border border-[var(--pos-border)] p-3 sm:grid-cols-[1.5fr_0.7fr_1fr_auto]"
              >
                <select
                  className="pos-input pos-input-rect"
                  value={line.productId}
                  onChange={(e) => updateLine(index, { productId: e.target.value })}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="pos-input pos-input-rect"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  placeholder="SL"
                />
                <input
                  type="number"
                  className="pos-input pos-input-rect"
                  min={0}
                  value={line.costPrice}
                  onChange={(e) => updateLine(index, { costPrice: e.target.value })}
                  placeholder="Giá nhập"
                />
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-[10px] text-rose-600 hover:bg-rose-50"
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Xóa dòng"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="pos-btn pos-btn-outline"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  productId: products[0]?.id ?? "",
                  quantity: "1",
                  costPrice: String(products[0]?.costPrice ?? 0),
                },
              ])
            }
          >
            <Plus size={16} />
            Thêm dòng
          </button>

          <label className="block">
            <span className="pos-label">Ghi chú</span>
            <textarea
              className="pos-input pos-input-rect min-h-24 py-3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Nhập bổ sung cuối tuần"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="pos-card p-4">
            <p className="text-sm text-slate-500">Tổng tiền nhập</p>
            <p className="mt-1 text-2xl font-bold">{formatVnd(total)}</p>
            <button type="button" className="pos-btn pos-btn-primary mt-4 w-full" onClick={submit}>
              Xác nhận nhập kho
            </button>
          </div>

          <div className="pos-card p-4">
            <h2 className="mb-3 text-base font-bold">Phiếu nhập gần đây</h2>
            <ul className="space-y-2">
              {stockIns.slice(0, 5).map((r) => (
                <li key={r.id} className="rounded-[10px] bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold">{r.code}</p>
                  <p className="text-xs text-slate-500">{formatVnd(r.total)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
