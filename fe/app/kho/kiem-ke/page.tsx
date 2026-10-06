"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { FilterChip, fieldClass } from "@/components/kho/ui";
import { PackageBadge } from "@/components/finance/widgets";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { postStockDelta } from "@/lib/warehouse/ops";
import { useAuthStore } from "@/stores/auth-store";
import type { Product } from "@/types";

const REASONS = ["Hàng hỏng", "Hàng mất", "Nhập sai", "Xuất sai", "Khác"];

type Line = { productId: string; actual: string };

export default function StocktakePage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [productId, setProductId] = useState("");
  const [actual, setActual] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [scan, setScan] = useState("");
  const [review, setReview] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product");
    if (product) setProductId(product);
    if (params.get("mode") === "batch") setMode("batch");
  }, []);

  const product = products.find((p) => p.id === productId);
  const counted = Number(actual);
  const diff = product && actual !== "" && Number.isFinite(counted) ? counted - product.stock : null;

  const addProduct = (id: string) => {
    if (!id) return;
    setLines((cur) => (cur.some((l) => l.productId === id) ? cur : [...cur, { productId: id, actual: "" }]));
  };

  const scanAdd = () => {
    const key = scan.trim().toLowerCase();
    const found = products.find(
      (p) => p.barcode?.toLowerCase() === key || p.sku.toLowerCase() === key,
    );
    if (!found) {
      notify.error("Không thấy sản phẩm với mã này");
      return;
    }
    addProduct(found.id);
    setScan("");
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const next = [...lines];
    for (const raw of text.split(/\r?\n/)) {
      const [sku, qty] = raw.split(/[,;\t]/).map((s) => s.trim());
      if (!sku || sku.toLowerCase() === "sku") continue;
      const found = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase() || p.barcode === sku);
      if (!found) continue;
      const row = next.find((l) => l.productId === found.id);
      if (row) row.actual = qty ?? "";
      else next.push({ productId: found.id, actual: qty ?? "" });
    }
    setLines(next);
    notify.success("Đã đọc file");
  };

  const batchRows = lines.map((line) => {
    const item = products.find((p) => p.id === line.productId);
    const actualQty = Number(line.actual);
    const delta =
      item && line.actual !== "" && Number.isFinite(actualQty) ? actualQty - item.stock : null;
    return { line, item, actualQty, delta };
  });

  const submitLines = async (rows: { item: Product; delta: number }[]) => {
    if (!user) return;
    const changed = rows.filter((r) => r.delta !== 0);
    if (!changed.length) {
      notify.success("Khớp sổ, không cần điều chỉnh");
      setReview(false);
      return;
    }
    try {
      await postStockDelta({
        lines: changed.map((r) => ({ productId: r.item.id, delta: r.delta })),
        type: "adjust",
        reason: "Kiểm kê",
        note: `${reason}${note ? ` · ${note}` : ""}`,
        user,
      });
      notify.success("Đã điều chỉnh tồn theo kiểm kê");
      setActual("");
      setLines([]);
      setReview(false);
      setNote("");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Không điều chỉnh được");
    }
  };

  const confirmSingle = async () => {
    if (!product || diff == null) {
      notify.error("Chọn sản phẩm và số đếm");
      return;
    }
    await submitLines([{ item: product, delta: diff }]);
  };

  const confirmBatch = async () => {
    const ready = batchRows.filter((r) => r.item && r.delta != null) as {
      item: Product;
      delta: number;
    }[];
    if (!ready.length) {
      notify.error("Nhập số đếm cho ít nhất một sản phẩm");
      return;
    }
    await submitLines(ready);
  };

  return (
    <AppShell>
      <PageHeader
        title="Kiểm kê"
        description="Đếm thực tế, so với sổ, rồi mới điều chỉnh tồn."
      />
      <WarehouseNav />
      <div className="mb-4 flex gap-2">
        <FilterChip active={mode === "single"} onClick={() => { setMode("single"); setReview(false); }}>
          Một sản phẩm
        </FilterChip>
        <FilterChip active={mode === "batch"} onClick={() => { setMode("batch"); setReview(false); }}>
          Nhiều sản phẩm
        </FilterChip>
      </div>

      {mode === "single" ? (
        <Card className="max-w-lg space-y-3 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium">Phiếu kiểm kê</h2>
            <PackageBadge tier="advanced" />
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Sản phẩm</span>
            <select className={`${fieldClass} w-full`} value={productId} onChange={(e) => setProductId(e.target.value)}>
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
          {product && diff != null ? (
            <Compare stock={product.stock} actual={counted} diff={diff} />
          ) : null}
          <ReasonFields reason={reason} setReason={setReason} note={note} setNote={setNote} />
          <Button onClick={() => setReview(true)} disabled={!product || diff == null}>
            Xem tóm tắt
          </Button>
        </Card>
      ) : (
        <Card className="space-y-3 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium">Kiểm kê nhiều sản phẩm</h2>
            <PackageBadge tier="advanced" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className={fieldClass}
              aria-label="Thêm sản phẩm"
              value=""
              onChange={(e) => addProduct(e.target.value)}
            >
              <option value="">Thêm sản phẩm</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              placeholder="Quét barcode hoặc SKU"
              aria-label="Quét barcode"
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  scanAdd();
                }
              }}
            />
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700">
              Nhập Excel
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importCsv(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="overflow-auto rounded-[10px] border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="px-3 py-3 font-medium">Sản phẩm</th>
                  <th className="px-3 py-3 font-medium">Tồn sổ</th>
                  <th className="px-3 py-3 font-medium">Số đếm</th>
                  <th className="px-3 py-3 font-medium">Lệch</th>
                  <th className="px-3 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {batchRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      Thêm sản phẩm, quét mã, hoặc nhập file CSV (cột SKU, số đếm).
                    </td>
                  </tr>
                ) : (
                  batchRows.map((row) => (
                    <tr key={row.line.productId} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-semibold">{row.item?.name}</td>
                      <td className="px-3 py-2">{row.item?.stock}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          value={row.line.actual}
                          aria-label={`Số đếm ${row.item?.name ?? ""}`}
                          onChange={(e) =>
                            setLines((cur) =>
                              cur.map((l) =>
                                l.productId === row.line.productId ? { ...l, actual: e.target.value } : l,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className={`px-3 py-2 font-semibold ${diffClass(row.delta)}`}>
                        {row.delta == null ? "—" : row.delta > 0 ? `+${row.delta}` : row.delta}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-sm font-semibold text-rose-600 hover:underline"
                          onClick={() =>
                            setLines((cur) => cur.filter((l) => l.productId !== row.line.productId))
                          }
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ReasonFields reason={reason} setReason={setReason} note={note} setNote={setNote} />
          <Button onClick={() => setReview(true)} disabled={batchRows.every((r) => r.delta == null)}>
            Xem tóm tắt
          </Button>
        </Card>
      )}

      {review ? (
        <Card className="mt-4 max-w-lg space-y-3 p-4 shadow-sm">
          <h2 className="text-base font-medium">Xác nhận kiểm kê</h2>
          <p className="text-sm text-slate-500">
            Lý do: {reason}
            {note ? ` · ${note}` : ""}
          </p>
          <ul className="space-y-2 text-sm">
            {mode === "single" && product && diff != null ? (
              <li className="flex justify-between gap-3">
                <span>{product.name}</span>
                <span className={diffClass(diff)}>
                  Sổ {product.stock} → {counted} ({diff > 0 ? `+${diff}` : diff})
                </span>
              </li>
            ) : (
              batchRows
                .filter((r) => r.item && r.delta != null)
                .map((r) => (
                  <li key={r.line.productId} className="flex justify-between gap-3">
                    <span>{r.item?.name}</span>
                    <span className={diffClass(r.delta)}>
                      Sổ {r.item?.stock} → {r.actualQty} ({(r.delta ?? 0) > 0 ? `+${r.delta}` : r.delta})
                    </span>
                  </li>
                ))
            )}
          </ul>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReview(false)}>
              Quay lại
            </Button>
            <Button onClick={() => void (mode === "single" ? confirmSingle() : confirmBatch())}>
              Ghi sổ
            </Button>
          </div>
        </Card>
      ) : null}
    </AppShell>
  );
}

function Compare({ stock, actual, diff }: { stock: number; actual: number; diff: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <p className="rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800">Sổ <b>{stock}</b></p>
      <p className="rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800">Đếm <b>{actual}</b></p>
      <p className={`rounded-[10px] px-3 py-2 ${diff === 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
        Lệch <b className={diffClass(diff)}>{diff > 0 ? `+${diff}` : diff}</b>
      </p>
    </div>
  );
}

function ReasonFields({
  reason,
  setReason,
  note,
  setNote,
}: {
  reason: string;
  setReason: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
}) {
  return (
    <>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-500">Lý do</span>
        <select className={`${fieldClass} w-full`} value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-500">Ghi chú</span>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
    </>
  );
}

function diffClass(diff: number | null) {
  if (diff == null || diff === 0) return "text-emerald-700";
  return "text-rose-600";
}
