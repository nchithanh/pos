"use client";

import { tr } from "@/lib/i18n/translate";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { formatMoneyInput, parseMoneyInput } from "@/lib/money-input";
import { stockIn } from "@/lib/services/inventory";
import { cn, formatDateTime, formatVnd, todayKey } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { PaymentMethod, Product } from "@/types";

type Line = {
  key: string;
  productId: string;
  quantity: string;
  unitCostRaw: string;
  expiryDate: string;
};

export default function StockInPage() {
  const router = useRouter();
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [payNow, setPayNow] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("transfer");
  const [debtDue, setDebtDue] = useState(
    todayKey(new Date(Date.now() + 14 * 86400000)),
  );
  const [busy, setBusy] = useState(false);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  useEffect(() => {
    if (!supplierId && suppliers[0]) setSupplierId(suppliers[0].id);
  }, [supplierId, suppliers]);

  const totalQty = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const total = lines.reduce(
    (s, l) =>
      s + (Number(l.quantity) || 0) * parseMoneyInput(l.unitCostRaw),
    0,
  );

  const addProduct = (p: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === p.id
            ? { ...l, quantity: String((Number(l.quantity) || 0) + 1) }
            : l,
        );
      }
      return [
        ...prev,
        {
          key: `${p.id}_${Date.now()}`,
          productId: p.id,
          quantity: "1",
          unitCostRaw: formatMoneyInput(p.costPrice),
          expiryDate: "",
        },
      ];
    });
  };

  const submit = async () => {
    if (!user) return;
    if (!supplierId) {
      toast.error(tr("Chọn nhà cung cấp"));
      return;
    }
    if (!lines.length) {
      toast.error(tr("Thêm ít nhất một sản phẩm"));
      return;
    }
    setBusy(true);
    try {
      const mov = await stockIn({
        supplierId,
        note,
        user,
        payNow,
        payMethod,
        debtDueDate: debtDue,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity) || 0,
          unitCost: parseMoneyInput(l.unitCostRaw),
          expiryDate: l.expiryDate || undefined,
        })),
      });
      toast.success(`Đã nhập kho ${mov.code}`);
      router.push("/kho");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("Lỗi nhập kho"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={tr("Phiếu nhập kho")}
        description={tr("Nhập hàng từ nhà cung cấp · có thể ghi nợ")}
        actions={
          <Link href="/kho">
            <Button variant="outline">{tr("Quay lại")}</Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-500">
              {tr("Nhà cung cấp")}
            </span>
            <select
              className="h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
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
          <div className="text-sm">
            <p className="mb-1 font-medium text-slate-500">{tr("Ngày tạo")}</p>
            <p className="flex h-11 items-center font-semibold">
              {formatDateTime(new Date().toISOString())}
            </p>
          </div>
          <div className="text-sm">
            <p className="mb-1 font-medium text-slate-500">{tr("Nhân viên")}</p>
            <p className="flex h-11 items-center font-semibold">
              {user?.name ?? "—"}
            </p>
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <ProductPicker products={products} onPick={addProduct} />

          {!lines.length ? (
            <p className="rounded-[10px] bg-slate-50 px-3 py-6 text-center text-sm text-slate-500 dark:bg-slate-800">
              Quét barcode hoặc chọn sản phẩm để thêm dòng.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b text-slate-500">
                    <tr>
                      {[
                        "SKU",
                        tr("Tên hàng"),
                        tr("ĐVT"),
                        tr("Tồn"),
                        tr("Số lượng"),
                        tr("Đơn giá nhập"),
                        "HSD",
                        tr("Thành tiền"),
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
                      const lineTotal =
                        (Number(line.quantity) || 0) *
                        parseMoneyInput(line.unitCostRaw);
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
                            <Input
                              className="w-32"
                              inputMode="numeric"
                              value={line.unitCostRaw}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((l) =>
                                    l.key === line.key
                                      ? {
                                          ...l,
                                          unitCostRaw: formatMoneyInput(
                                            parseMoneyInput(e.target.value),
                                          ),
                                        }
                                      : l,
                                  ),
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              className="w-36"
                              type="date"
                              value={line.expiryDate}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((l) =>
                                    l.key === line.key
                                      ? { ...l, expiryDate: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2 font-semibold">
                            {formatVnd(lineTotal)}
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={tr("Xóa dòng")}
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
                            {p?.sku} · tồn {p?.stock}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={tr("Xóa")}
                          onClick={() =>
                            setLines((prev) =>
                              prev.filter((l) => l.key !== line.key),
                            )
                          }
                        >
                          <Trash2 size={16} className="text-rose-500" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="text-xs">
                          <span className="text-slate-500">{tr("Số lượng")}</span>
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
                        <label className="text-xs">
                          <span className="text-slate-500">{tr("Đơn giá")}</span>
                          <Input
                            value={line.unitCostRaw}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? {
                                        ...l,
                                        unitCostRaw: formatMoneyInput(
                                          parseMoneyInput(e.target.value),
                                        ),
                                      }
                                    : l,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="col-span-2 text-xs">
                          <span className="text-slate-500">{tr("HSD (tuỳ chọn)")}</span>
                          <Input
                            type="date"
                            value={line.expiryDate}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((l) =>
                                  l.key === line.key
                                    ? { ...l, expiryDate: e.target.value }
                                    : l,
                                ),
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Input
            placeholder={tr("Ghi chú phiếu")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">
                {lines.length} mặt hàng · {totalQty} đơn vị
              </p>
              <p className="text-2xl font-bold">{formatVnd(total)}</p>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-500">
              Thanh toán NCC
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  payNow
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200",
                )}
                onClick={() => setPayNow(true)}
              >
                Thanh toán ngay
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  !payNow
                    ? "border-amber-500 bg-amber-50 text-amber-800"
                    : "border-slate-200",
                )}
                onClick={() => setPayNow(false)}
              >
                {tr("Ghi nợ NCC")}
              </button>
            </div>
            {payNow ? (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["cash", tr("Tiền mặt")],
                    ["transfer", tr("Chuyển khoản")],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      payMethod === id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200",
                    )}
                    onClick={() => setPayMethod(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <label className="block max-w-xs text-sm">
                <span className="mb-1 block text-slate-500">
                  Hạn thanh toán nợ
                </span>
                <Input
                  type="date"
                  value={debtDue}
                  onChange={(e) => setDebtDue(e.target.value)}
                />
              </label>
            )}
          </fieldset>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/kho")}
            >
              {tr("Hủy")}
            </Button>
            <Button className="flex-1" onClick={submit} disabled={busy}>
              {busy ? tr("Đang lưu…") : tr("Xác nhận nhập kho")}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
