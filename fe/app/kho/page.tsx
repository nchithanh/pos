"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { db, getStockStatus } from "@/lib/db";
import {
  downloadInventoryCsv,
  stockAdjust,
} from "@/lib/services/inventory";
import { cn, formatDateTime, formatVnd } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const ADJUST_REASONS = [
  "Kiểm kê định kỳ",
  "Thất thoát",
  "Đổi trả / hoàn hàng",
  "Sai sót nhập liệu",
  "Khác",
];

const MOVE_LABEL: Record<string, string> = {
  in: "Nhập",
  out: "Xuất",
  adjust: "Điều chỉnh",
  sale: "Bán",
  return: "Trả",
};

export default function InventoryPage() {
  const products = useLiveQuery(() => db.products.toArray());
  const movements = useLiveQuery(() =>
    db.movements.orderBy("createdAt").reverse().limit(40).toArray(),
  );
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [tab, setTab] = useState<"stock" | "ledger">("stock");

  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState("0");
  const [adjustReason, setAdjustReason] = useState(ADJUST_REASONS[0]);
  const [adjustNote, setAdjustNote] = useState("");

  const [stocktakeOpen, setStocktakeOpen] = useState(false);
  const [stocktakeProductId, setStocktakeProductId] = useState("");
  const [stocktakeQty, setStocktakeQty] = useState("");
  const [stocktakeReason, setStocktakeReason] = useState(ADJUST_REASONS[0]);

  const stats = useMemo(() => {
    const list = products ?? [];
    return {
      qty: list.reduce((s, p) => s + p.stock, 0),
      value: list.reduce((s, p) => s + p.stock * p.costPrice, 0),
      low: list.filter((p) => getStockStatus(p.stock, p.minStock) === "low")
        .length,
      out: list.filter((p) => getStockStatus(p.stock, p.minStock) === "out")
        .length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    return (products ?? []).filter((p) => {
      const st = getStockStatus(p.stock, p.minStock);
      if (filter === "low" && st !== "low") return false;
      if (filter === "out" && st !== "out") return false;
      const query = q.trim().toLowerCase();
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode ?? "").includes(query)
      );
    });
  }, [products, q, filter]);

  const adjustProduct = (products ?? []).find((p) => p.id === adjustId);
  const stocktakeProduct = (products ?? []).find(
    (p) => p.id === stocktakeProductId,
  );
  const delta =
    adjustProduct != null
      ? (Number(newStock) || 0) - adjustProduct.stock
      : 0;

  const openAdjust = (id: string, stock: number) => {
    setAdjustId(id);
    setNewStock(String(stock));
    setAdjustReason(ADJUST_REASONS[0]);
    setAdjustNote("");
  };

  return (
    <AppShell>
      <PageHeader
        title="Kho hàng"
        description="Theo dõi tồn kho, nhập xuất và sổ biến động"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadInventoryCsv(
                  (products ?? []).map((p) => ({
                    sku: p.sku,
                    barcode: p.barcode,
                    name: p.name,
                    unit: p.unit,
                    stock: p.stock,
                    minStock: p.minStock,
                    costPrice: p.costPrice,
                    sellPrice: p.sellPrice,
                  })),
                )
              }
            >
              <Download size={16} /> Xuất Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStocktakeOpen(true);
                setStocktakeProductId(products?.[0]?.id ?? "");
                setStocktakeQty(String(products?.[0]?.stock ?? 0));
                setStocktakeReason(ADJUST_REASONS[0]);
              }}
            >
              <ClipboardCheck size={16} /> Kiểm kho
            </Button>
            <Link href="/kho/nhap">
              <Button size="sm">
                <ArrowDownToLine size={16} /> Nhập
              </Button>
            </Link>
            <Link href="/kho/xuat">
              <Button size="sm" variant="outline">
                <ArrowUpFromLine size={16} /> Xuất
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Tổng tồn</p>
          <p className="mt-1 text-xl font-bold">{stats.qty}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Giá trị tồn (giá vốn)</p>
          <p className="mt-1 text-xl font-bold">{formatVnd(stats.value)}</p>
        </Card>
        <button
          type="button"
          className={cn(
            "rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-4 text-left",
            filter === "low" && "ring-2 ring-amber-400/50",
          )}
          onClick={() => {
            setFilter("low");
            setTab("stock");
          }}
        >
          <p className="text-sm text-slate-500">Sắp hết</p>
          <p className="mt-1 text-xl font-bold text-amber-600">
            {stats.low}{" "}
            <span className="text-sm font-medium text-slate-400">khoản</span>
          </p>
        </button>
        <button
          type="button"
          className={cn(
            "rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-4 text-left",
            filter === "out" && "ring-2 ring-rose-400/50",
          )}
          onClick={() => {
            setFilter("out");
            setTab("stock");
          }}
        >
          <p className="text-sm text-slate-500">Hết hàng</p>
          <p className="mt-1 text-xl font-bold text-rose-600">
            {stats.out}{" "}
            <span className="text-sm font-medium text-slate-400">khoản</span>
          </p>
        </button>
      </div>

      <div className="mt-4 flex gap-1 rounded-[12px] bg-white p-1 dark:bg-slate-900">
        {(
          [
            ["stock", "Tồn kho"],
            ["ledger", "Sổ biến động"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              "flex-1 rounded-[10px] py-2.5 text-sm font-semibold",
              tab === id ? "bg-emerald-500 text-white" : "text-slate-500",
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              className="flex-1"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tên / SKU / barcode…"
            />
            <div className="flex gap-2">
              {(
                [
                  ["all", "Tất cả"],
                  ["low", "Sắp hết"],
                  ["out", "Hết"],
                ] as const
              ).map(([f, label]) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {!filtered.length ? (
            <Card className="mt-4">
              <EmptyState
                title="Không có sản phẩm"
                description="Thử đổi bộ lọc hoặc nhập kho."
              />
            </Card>
          ) : (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((p) => (
                  <Card key={p.id} className="p-3">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-slate-400">
                          {p.sku}
                          {p.barcode ? ` · ${p.barcode}` : ""}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.stock} {p.unit} · vốn {formatVnd(p.costPrice)}
                        </p>
                      </div>
                      <Badge status={getStockStatus(p.stock, p.minStock)} />
                    </div>
                    <p className="mt-1 text-sm font-bold">
                      GT tồn {formatVnd(p.stock * p.costPrice)}
                    </p>
                    <Button
                      className="mt-2 w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => openAdjust(p.id, p.stock)}
                    >
                      Điều chỉnh
                    </Button>
                  </Card>
                ))}
              </div>

              <Card className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {[
                        "SKU / Barcode",
                        "Sản phẩm",
                        "Tồn",
                        "Tối thiểu",
                        "Giá vốn",
                        "Giá trị tồn",
                        "TT",
                        "",
                      ].map((h) => (
                        <th
                          key={h || "a"}
                          className="px-4 py-3 font-semibold text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">
                          <div>{p.sku}</div>
                          {p.barcode ? (
                            <div className="text-slate-400">{p.barcode}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">
                          {p.stock} {p.unit}
                        </td>
                        <td className="px-4 py-3">{p.minStock}</td>
                        <td className="px-4 py-3">{formatVnd(p.costPrice)}</td>
                        <td className="px-4 py-3 font-semibold">
                          {formatVnd(p.stock * p.costPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            status={getStockStatus(p.stock, p.minStock)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjust(p.id, p.stock)}
                          >
                            Điều chỉnh
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </>
      ) : (
        <Card className="mt-4 p-4">
          <h2 className="mb-3 font-bold">Sổ biến động kho</h2>
          {!(movements ?? []).length ? (
            <EmptyState
              title="Chưa có biến động"
              description="Nhập / xuất / bán hàng sẽ ghi vào đây."
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {(movements ?? []).map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-1 rounded-[10px] bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-800"
                >
                  <div>
                    <p className="font-semibold">
                      {m.code}{" "}
                      <Badge
                        status="partial"
                        label={MOVE_LABEL[m.type] ?? m.type}
                        className="ml-1"
                      />
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(m.createdAt)} · {m.userName}
                      {m.reason ? ` · ${m.reason}` : ""}
                    </p>
                    {m.note ? (
                      <p className="text-xs text-slate-400">{m.note}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{m.items.length} dòng</p>
                    {m.totalCost > 0 ? (
                      <p className="text-xs text-slate-500">
                        {formatVnd(m.totalCost)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Dialog
        open={!!adjustId}
        onClose={() => setAdjustId(null)}
        title="Điều chỉnh tồn kho"
        className="max-w-md"
      >
        {adjustProduct ? (
          <div className="space-y-3">
            <div className="rounded-[10px] bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p className="font-semibold">{adjustProduct.name}</p>
              <p className="text-slate-500">
                Tồn hiện tại: {adjustProduct.stock} {adjustProduct.unit}
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">
                Số lượng thực tế *
              </span>
              <Input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
              />
            </label>
            <p className="text-sm">
              Chênh lệch:{" "}
              <span
                className={cn(
                  "font-bold",
                  delta > 0
                    ? "text-emerald-600"
                    : delta < 0
                      ? "text-rose-600"
                      : "text-slate-600",
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">
                Lý do điều chỉnh *
              </span>
              <select
                className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              >
                {ADJUST_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <Input
              placeholder="Ghi chú thêm"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={async () => {
                if (!user || !adjustId) return;
                try {
                  await stockAdjust({
                    productId: adjustId,
                    newStock: Number(newStock) || 0,
                    reason: adjustReason,
                    note: adjustNote,
                    user,
                  });
                  toast.success("Đã điều chỉnh tồn");
                  setAdjustId(null);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Lỗi");
                }
              }}
            >
              Lưu điều chỉnh
            </Button>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={stocktakeOpen}
        onClose={() => setStocktakeOpen(false)}
        title="Kiểm kho nhanh"
        className="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Nhập số lượng đếm thực tế — hệ thống ghi phiếu điều chỉnh.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Sản phẩm</span>
            <select
              className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900"
              value={stocktakeProductId}
              onChange={(e) => {
                setStocktakeProductId(e.target.value);
                const p = (products ?? []).find((x) => x.id === e.target.value);
                setStocktakeQty(String(p?.stock ?? 0));
              }}
            >
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (tồn {p.stock})
                </option>
              ))}
            </select>
          </label>
          {stocktakeProduct ? (
            <p className="text-sm text-slate-500">
              Tồn sổ: {stocktakeProduct.stock} → thực tế:{" "}
              <strong>{stocktakeQty || 0}</strong> (
              {(Number(stocktakeQty) || 0) - stocktakeProduct.stock >= 0
                ? "+"
                : ""}
              {(Number(stocktakeQty) || 0) - stocktakeProduct.stock})
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Số lượng thực tế</span>
            <Input
              type="number"
              value={stocktakeQty}
              onChange={(e) => setStocktakeQty(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Lý do</span>
            <select
              className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900"
              value={stocktakeReason}
              onChange={(e) => setStocktakeReason(e.target.value)}
            >
              {ADJUST_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <Button
            className="w-full"
            onClick={async () => {
              if (!user || !stocktakeProductId) return;
              try {
                await stockAdjust({
                  productId: stocktakeProductId,
                  newStock: Number(stocktakeQty) || 0,
                  reason: stocktakeReason,
                  note: "Kiểm kho",
                  user,
                });
                toast.success("Đã ghi kiểm kho");
                setStocktakeOpen(false);
                setTab("ledger");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Lỗi");
              }
            }}
          >
            Xác nhận kiểm kho
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
