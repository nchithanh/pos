"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ProductPicker } from "@/components/kho/ProductPicker";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { stockOut } from "@/lib/services/inventory";
import { formatDateTime, formatVnd } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Product } from "@/types";

const REASONS = [
  "Trả hàng NCC",
  "Hư hỏng / hết hạn",
  "Sử dụng nội bộ",
  "Điều chỉnh kiểm kê",
  "Khác",
];

type Line = { key: string; productId: string; quantity: string };

export default function StockOutPage() {
  const router = useRouter();
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const totalQty = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const totalCost = lines.reduce((s, l) => {
    const p = productMap.get(l.productId);
    return s + (Number(l.quantity) || 0) * (p?.costPrice ?? 0);
  }, 0);

  const addProduct = (p: Product) => {
    if (p.stock <= 0) {
      toast.error(`${p.name} đã hết tồn`);
      return;
    }
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        const nextQty = (Number(existing.quantity) || 0) + 1;
        if (nextQty > p.stock) {
          toast.error(`Tồn chỉ còn ${p.stock}`);
          return prev;
        }
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: String(nextQty) } : l,
        );
      }
      return [
        ...prev,
        {
          key: `${p.id}_${Date.now()}`,
          productId: p.id,
          quantity: "1",
        },
      ];
    });
  };

  const submit = async () => {
    if (!user) return;
    if (!lines.length) {
      toast.error("Thêm ít nhất một sản phẩm");
      return;
    }
    setBusy(true);
    try {
      const mov = await stockOut({
        user,
        reason,
        note,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity) || 0,
        })),
      });
      toast.success(`Đã xuất kho ${mov.code}`);
      router.push("/kho");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xuất kho");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Phiếu xuất kho"
        description="Xuất nhiều mặt hàng trong một phiếu"
        actions={
          <Link href="/kho">
            <Button variant="outline">Quay lại</Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-500">
              Lý do xuất
            </span>
            <select
              className="h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            <p className="mb-1 font-medium text-slate-500">Ngày tạo</p>
            <p className="flex h-11 items-center font-semibold">
              {formatDateTime(new Date().toISOString())}
            </p>
          </div>
          <div className="text-sm">
            <p className="mb-1 font-medium text-slate-500">Nhân viên</p>
            <p className="flex h-11 items-center font-semibold">
              {user?.name ?? "—"}
            </p>
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <ProductPicker products={products} onPick={addProduct} />

          {!lines.length ? (
            <p className="rounded-[10px] bg-slate-50 px-3 py-6 text-center text-sm text-slate-500 dark:bg-slate-800">
              Quét barcode hoặc chọn sản phẩm để thêm dòng xuất.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b text-slate-500">
                    <tr>
                      {[
                        "SKU",
                        "Tên hàng",
                        "ĐVT",
                        "Tồn hiện tại",
                        "Số lượng xuất",
                        "Giá vốn",
                        "Thành tiền",
                        "",
                      ].map((h) => (
                        <th key={h || "x"} className="px-2 py-2 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const p = productMap.get(line.productId);
                      const qty = Number(line.quantity) || 0;
                      const lineTotal = qty * (p?.costPrice ?? 0);
                      return (
                        <tr key={line.key} className="border-b last:border-0">
                          <td className="px-2 py-2 font-mono text-xs">
                            {p?.sku}
                          </td>
                          <td className="px-2 py-2 font-medium">{p?.name}</td>
                          <td className="px-2 py-2">{p?.unit}</td>
                          <td className="px-2 py-2 text-slate-500">
                            {p?.stock}
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              className="w-24"
                              type="number"
                              min={1}
                              max={p?.stock}
                              value={line.quantity}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((l) =>
                                    l.key === line.key
                                      ? { ...l, quantity: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            {formatVnd(p?.costPrice ?? 0)}
                          </td>
                          <td className="px-2 py-2 font-semibold">
                            {formatVnd(lineTotal)}
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Xóa dòng"
                              onClick={() =>
                                setLines((prev) =>
                                  prev.filter((l) => l.key !== line.key),
                                )
                              }
                            >
                              <Trash2 size={16} className="text-rose-500" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 md:hidden">
                {lines.map((line) => {
                  const p = productMap.get(line.productId);
                  return (
                    <div
                      key={line.key}
                      className="rounded-[10px] border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-semibold">{p?.name}</p>
                          <p className="text-xs text-slate-400">
                            Tồn {p?.stock} · {formatVnd(p?.costPrice ?? 0)}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Xóa"
                          onClick={() =>
                            setLines((prev) =>
                              prev.filter((l) => l.key !== line.key),
                            )
                          }
                        >
                          <Trash2 size={16} className="text-rose-500" />
                        </button>
                      </div>
                      <label className="mt-2 block text-xs">
                        <span className="text-slate-500">Số lượng xuất</span>
                        <Input
                          type="number"
                          value={line.quantity}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l) =>
                                l.key === line.key
                                  ? { ...l, quantity: e.target.value }
                                  : l,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Input
            placeholder="Ghi chú phiếu"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Card>

        <Card className="space-y-3 p-4">
          <div>
            <p className="text-sm text-slate-500">
              {lines.length} mặt hàng · {totalQty} đơn vị
            </p>
            <p className="text-2xl font-bold">
              Giá vốn xuất ~ {formatVnd(totalCost)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/kho")}
            >
              Hủy
            </Button>
            <Button className="flex-1" onClick={submit} disabled={busy}>
              {busy ? "Đang lưu…" : "Xác nhận xuất kho"}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
