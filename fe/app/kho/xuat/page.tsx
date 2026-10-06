"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { STOCK_OUT_REASONS } from "@/data/stock";
import { usePosStore } from "@/store/usePosStore";

type Line = { productId: string; quantity: string };

export default function StockOutPage() {
  const router = useRouter();
  const products = usePosStore((s) => s.products);
  const stockOut = usePosStore((s) => s.stockOut);
  const stockOuts = usePosStore((s) => s.stockOuts);

  const [reason, setReason] = useState(STOCK_OUT_REASONS[0]);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { productId: products[0]?.id ?? "", quantity: "1" },
  ]);

  const submit = () => {
    const items = lines
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity) || 0,
      }))
      .filter((l) => l.productId && l.quantity > 0);
    if (items.length === 0) return;
    stockOut({ items, reason, note });
    router.push("/kho");
  };

  return (
    <AppShell>
      <PageHeader
        title="Xuất kho"
        description="Chọn sản phẩm · số lượng · lý do · xác nhận"
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
            <span className="pos-label">Lý do xuất</span>
            <select
              className="pos-input pos-input-rect"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {STOCK_OUT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            {lines.map((line, index) => {
              const p = products.find((x) => x.id === line.productId);
              return (
                <div
                  key={index}
                  className="grid gap-2 rounded-[10px] border border-[var(--pos-border)] p-3 sm:grid-cols-[1.6fr_0.8fr_auto]"
                >
                  <select
                    className="pos-input pos-input-rect"
                    value={line.productId}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === index ? { ...l, productId: e.target.value } : l,
                        ),
                      )
                    }
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (tồn {prod.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="pos-input pos-input-rect"
                    min={1}
                    max={p?.stock}
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === index ? { ...l, quantity: e.target.value } : l,
                        ),
                      )
                    }
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
              );
            })}
          </div>

          <button
            type="button"
            className="pos-btn pos-btn-outline"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                { productId: products[0]?.id ?? "", quantity: "1" },
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
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="pos-card p-4">
            <p className="text-sm text-slate-500">
              Sau khi xác nhận, tồn kho sẽ trừ ngay trên prototype.
            </p>
            <button type="button" className="pos-btn pos-btn-primary mt-4 w-full" onClick={submit}>
              Xác nhận xuất kho
            </button>
          </div>
          <div className="pos-card p-4">
            <h2 className="mb-3 text-base font-bold">Phiếu xuất gần đây</h2>
            <ul className="space-y-2">
              {stockOuts.slice(0, 5).map((r) => (
                <li key={r.id} className="rounded-[10px] bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold">{r.code}</p>
                  <p className="text-xs text-slate-500">{r.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
