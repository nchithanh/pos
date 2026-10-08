"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barcode, ChevronDown } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import {
  EmptyBlock,
  FilterChip,
  ProductThumb,
  StatusPill,
  StockMeter,
  TableSkeleton,
  fieldClass,
  stockLevel,
  stockLevelLabel,
} from "@/components/kho/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { inBranch } from "@/lib/branch";
import { useBranchId } from "@/lib/use-branch";
import { notify } from "@/lib/notify";
import { postStockDelta } from "@/lib/warehouse/ops";
import { availableQty, reservedQty, useWarehouseStore } from "@/stores/warehouse-store";
import { useAuthStore } from "@/stores/auth-store";
import { formatDateTime, formatVnd, uid } from "@/lib/utils";
import type { Product } from "@/types";

type SortKey = "name" | "stock" | "available" | "value";

export default function StockPage() {
  const router = useRouter();
  const products = useLiveQuery(() => db.products.toArray());
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const branchId = useBranchId();
  const movements =
    useLiveQuery(
      () => db.movements.filter((m) => inBranch(m.branchId, branchId)).toArray(),
      [branchId],
    ) ?? [];
  const outbounds = useWarehouseStore((s) => s.outbounds);
  const purchases = useWarehouseStore((s) => s.purchases);
  const damaged = useWarehouseStore((s) => s.damaged);
  const savePurchase = useWarehouseStore((s) => s.savePurchase);
  const user = useAuthStore((s) => s.user);
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [level, setLevel] = useState("all");
  const [supplierId, setSupplierId] = useState("all");
  const [filters, setFilters] = useState(false);
  const [picked, setPicked] = useState<Product | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sort, setSort] = useState<SortKey>("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDelta, setBulkDelta] = useState("-1");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("level");
    if (next) setLevel(next);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rows = useMemo(() => {
    const list = (products ?? []).map((p) => {
      const reserved = reservedQty(outbounds, p.id);
      const dmg = damaged[p.id] ?? 0;
      const available = availableQty(p.stock, dmg, reserved);
      const st = stockLevel(p.stock, p.minStock, p.active);
      const value = p.stock * p.costPrice;
      return { p, reserved, dmg, available, st, value };
    });
    const filtered = list.filter((r) => {
      const blob = `${r.p.name} ${r.p.sku} ${r.p.barcode ?? ""}`.toLowerCase();
      if (q && !blob.includes(q.toLowerCase())) return false;
      if (cat !== "all" && r.p.categoryId !== cat) return false;
      if (supplierId !== "all" && r.p.supplierId !== supplierId) return false;
      if (level === "low" && r.st !== "low") return false;
      if (level === "out" && r.st !== "out") return false;
      if (level === "high" && r.st !== "high") return false;
      return true;
    });
    const factor = dir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      if (sort === "name") return a.p.name.localeCompare(b.p.name, "vi") * factor;
      if (sort === "stock") return (a.p.stock - b.p.stock) * factor;
      if (sort === "available") return (a.available - b.available) * factor;
      return (a.value - b.value) * factor;
    });
    return filtered;
  }, [products, outbounds, damaged, q, cat, level, supplierId, sort, dir]);

  const history = (
    picked ? movements.filter((m) => m.items.some((i) => i.productId === picked.id)) : []
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.p.id));
  const pad = density === "compact" ? "py-1.5" : "py-3";

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("asc");
    }
  };

  const exportCsv = () => {
    const source = rows.filter((r) => selected.includes(r.p.id));
    const data = source.length ? source : rows;
    const header = ["SKU", tr("Tên"), tr("Danh mục"), tr("Tồn"), tr("Giữ chỗ"), tr("Khả dụng"), tr("Giá trị")];
    const lines = data.map((r) => {
      const category = categories.find((c) => c.id === r.p.categoryId)?.name ?? "";
      return [r.p.sku, r.p.name, category, r.p.stock, r.reserved, r.available, r.value]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",");
    });
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ton-kho.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const createPurchase = () => {
    const pickedRows = rows.filter((r) => selected.includes(r.p.id));
    if (!pickedRows.length || !user) {
      notify.error("Chọn sản phẩm trước");
      return;
    }
    const supplier =
      suppliers.find((s) => s.id === pickedRows[0].p.supplierId) ?? suppliers[0];
    if (!supplier) {
      notify.error("Chưa có nhà cung cấp");
      return;
    }
    const po = {
      id: uid("po"),
      code: `NK${String(purchases.length + 90).padStart(5, "0")}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: "awaiting_receive" as const,
      expectedAt: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      createdBy: user.name,
      note: "Tạo từ tồn kho",
      payLater: true,
      lines: pickedRows.map((r) => ({
        productId: r.p.id,
        name: r.p.name,
        sku: r.p.sku,
        ordered: Math.max(1, r.p.minStock - r.p.stock),
        received: Math.max(1, r.p.minStock - r.p.stock),
        damaged: 0,
        cost: r.p.costPrice,
      })),
    };
    savePurchase(po);
    router.push(`/kho/don-nhap?open=${po.id}`);
  };

  const applyBulk = async () => {
    if (!user) return;
    if (user.role !== "owner" && user.role !== "manager") {
      notify.error(tr("Cần quyền quản lý để điều chỉnh tồn"));
      return;
    }
    const delta = Number(bulkDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      notify.error("Nhập số điều chỉnh khác 0");
      return;
    }
    try {
      await postStockDelta({
        lines: selected.map((productId) => ({ productId, delta })),
        type: "adjust",
        reason: delta < 0 ? tr("Điều chỉnh giảm") : tr("Điều chỉnh tăng"),
        note: "Điều chỉnh hàng loạt từ tồn kho",
        user,
      });
      notify.success("Đã điều chỉnh các sản phẩm đã chọn");
      setBulkOpen(false);
      setSelected([]);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : tr("Không điều chỉnh được"));
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={tr("Tồn kho")}
        description="Tồn khả dụng = tồn hiện tại − hàng giữ chỗ − hàng hỏng."
      />
      <WarehouseNav />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, SKU, barcode"
            aria-label="Tìm sản phẩm"
            className="pl-9"
          />
        </label>
        <Button variant="outline" className="lg:hidden" onClick={() => setFilters(true)}>
          {tr("Bộ lọc")}
        </Button>
        <div className="hidden gap-2 lg:flex">
          <Filters
            cat={cat}
            setCat={setCat}
            level={level}
            setLevel={setLevel}
            supplierId={supplierId}
            setSupplierId={setSupplierId}
            categories={categories}
            suppliers={suppliers}
          />
        </div>
        <div className="flex gap-1">
          <FilterChip active={density === "comfortable"} onClick={() => setDensity("comfortable")}>
            Comfortable
          </FilterChip>
          <FilterChip active={density === "compact"} onClick={() => setDensity("compact")}>
            Compact
          </FilterChip>
        </div>
      </div>
      <p className="mb-3 text-xs text-slate-400">{tr("Nhấn / để nhảy vào ô tìm.")}</p>

      {selected.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          <span className="font-semibold">{selected.length} đã chọn</span>
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
            {tr("Điều chỉnh hàng loạt")}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            {tr("Xuất Excel")}
          </Button>
          <Button size="sm" onClick={createPurchase}>
            {tr("Tạo phiếu nhập")}
          </Button>
        </div>
      ) : null}

      {products === undefined ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyBlock
          title={tr("Không có sản phẩm")}
          body="Đổi bộ lọc hoặc từ khóa tìm kiếm."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setCat("all");
                setLevel("all");
                setSupplierId("all");
              }}
            >
              {tr("Xóa bộ lọc")}
            </Button>
          }
        />
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-[10px] border border-slate-200 shadow-sm dark:border-slate-700">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label={tr("Chọn tất cả")}
                    checked={allChecked}
                    onChange={(e) =>
                      setSelected(e.target.checked ? rows.map((r) => r.p.id) : [])
                    }
                  />
                </th>
                <SortTh label={tr("Sản phẩm")} active={sort === "name"} onClick={() => toggleSort("name")} />
                <th className="px-3 py-3 font-medium">{tr("Danh mục")}</th>
                <SortTh label={tr("Tồn hiện tại")} active={sort === "stock"} onClick={() => toggleSort("stock")} />
                <th className="px-3 py-3 font-medium">{tr("Giữ chỗ")}</th>
                <SortTh label={tr("Khả dụng")} active={sort === "available"} onClick={() => toggleSort("available")} />
                <th className="px-3 py-3 font-medium">{tr("Mức tồn")}</th>
                <SortTh label={tr("Giá trị tồn")} active={sort === "value"} onClick={() => toggleSort("value")} />
                <th className="px-3 py-3 font-medium">{tr("Thao tác")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const category = categories.find((c) => c.id === r.p.categoryId)?.name ?? "—";
                return (
                  <tr key={r.p.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
                    <td className={`px-3 ${pad}`}>
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${r.p.name}`}
                        checked={selected.includes(r.p.id)}
                        onChange={(e) =>
                          setSelected((cur) =>
                            e.target.checked ? [...cur, r.p.id] : cur.filter((id) => id !== r.p.id),
                          )
                        }
                      />
                    </td>
                    <td className={`px-3 ${pad}`}>
                      <span className="flex items-center gap-2">
                        <ProductThumb
                          name={r.p.name}
                          emoji={r.p.emoji}
                          imageColor={r.p.imageColor}
                          imageUrl={r.p.imageUrl}
                        />
                        <span>
                          <span className="block font-semibold">{r.p.name}</span>
                          <span className="text-xs text-slate-500">{r.p.sku}</span>
                        </span>
                      </span>
                    </td>
                    <td className={`px-3 ${pad}`}>{category}</td>
                    <td className={`px-3 ${pad} font-semibold`}>{r.p.stock}</td>
                    <td className={`px-3 ${pad}`}>{r.reserved}</td>
                    <td
                      className={`px-3 ${pad} font-semibold ${
                        r.available <= 0
                          ? "text-rose-600"
                          : r.st === "low"
                            ? "text-amber-600"
                            : ""
                      }`}
                    >
                      {r.available}
                    </td>
                    <td className={`px-3 ${pad}`}>
                      <StockMeter stock={r.p.stock} minStock={r.p.minStock} />
                      <span className="mt-1 block text-xs text-slate-500">{stockLevelLabel(r.st)}</span>
                    </td>
                    <td className={`px-3 ${pad}`}>{formatVnd(r.value)}</td>
                    <td className={`px-3 ${pad}`}>
                      <RowMenu
                        onHistory={() => setPicked(r.p)}
                        productId={r.p.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={filters} onClose={() => setFilters(false)} title={tr("Bộ lọc")}>
        <div className="space-y-3">
          <Filters
            cat={cat}
            setCat={setCat}
            level={level}
            setLevel={setLevel}
            supplierId={supplierId}
            setSupplierId={setSupplierId}
            categories={categories}
            suppliers={suppliers}
          />
          <Button className="w-full" onClick={() => setFilters(false)}>
            {tr("Áp dụng")}
          </Button>
        </div>
      </Dialog>

      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} title={tr("Điều chỉnh hàng loạt")}>
        <div className="space-y-3 text-sm">
          <p>{tr("Áp dụng cùng một số lượng cho")} {selected.length} sản phẩm. Số âm là giảm tồn.</p>
          <Input value={bulkDelta} onChange={(e) => setBulkDelta(e.target.value)} type="number" aria-label="Số điều chỉnh" />
          <Button className="w-full" onClick={() => void applyBulk()}>
            {tr("Ghi sổ")}
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!picked} onClose={() => setPicked(null)} title="Lịch sử tồn kho" className="max-w-lg">
        {picked ? (
          <StockDetail
            product={picked}
            reserved={reservedQty(outbounds, picked.id)}
            damagedQty={damaged[picked.id] ?? 0}
            history={history}
          />
        ) : null}
      </Dialog>
    </AppShell>
  );
}

function SortTh({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-3 py-3 font-medium">
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        onClick={onClick}
      >
        {label}
        <ChevronDown className={`h-3 w-3 ${active ? "text-emerald-600" : "opacity-40"}`} aria-hidden />
      </button>
    </th>
  );
}

function RowMenu({ onHistory, productId }: { onHistory: () => void; productId: string }) {
  return (
    <details className="relative">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden">
        <span className="sr-only">{tr("Thao tác")}</span>
        ···
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-44 rounded-[10px] border border-slate-200 bg-white py-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <button type="button" className="block w-full px-3 py-2 text-left hover:bg-slate-50" onClick={onHistory}>
          {tr("Xem lịch sử")}
        </button>
        <Link className="block px-3 py-2 hover:bg-slate-50" href={`/kho/dieu-chinh?product=${productId}`}>
          {tr("Điều chỉnh")}
        </Link>
        <Link className="block px-3 py-2 hover:bg-slate-50" href={`/kho/don-nhap?create=1&product=${productId}`}>
          {tr("Tạo yêu cầu nhập")}
        </Link>
        <Link className="block px-3 py-2 hover:bg-slate-50" href={`/kho/kiem-ke?product=${productId}`}>
          {tr("Kiểm kê")}
        </Link>
      </div>
    </details>
  );
}

function StockDetail({
  product,
  reserved,
  damagedQty,
  history,
}: {
  product: Product;
  reserved: number;
  damagedQty: number;
  history: {
    id: string;
    code: string;
    createdAt: string;
    userName: string;
    reason?: string;
    type: string;
    items: { productId: string; quantity: number; beforeQty?: number; afterQty?: number }[];
  }[];
}) {
  const available = availableQty(product.stock, damagedQty, reserved);
  const level = stockLevel(product.stock, product.minStock, product.active);
  return (
    <div className="space-y-3 text-sm">
      <p className="text-lg font-bold">{product.name}</p>
      <p className="text-slate-500">SKU {product.sku}</p>
      <StatusPill label={stockLevelLabel(level)} tone={level === "out" ? "danger" : level === "low" ? "warn" : "ok"} />
      <p>{tr("Tồn hiện tại:")} <b>{product.stock}</b> {product.unit}</p>
      <p>{tr("Giữ chỗ:")} <b>{reserved}</b></p>
      <p>{tr("Hàng hỏng:")} <b>{damagedQty}</b></p>
      <p>{tr("Khả dụng:")} <b>{available}</b></p>
      <p>Giá trị tồn: {formatVnd(product.stock * product.costPrice)}</p>
      <h3 className="pt-2 font-medium">{tr("Biến động tồn kho")}</h3>
      {history.length === 0 ? (
        <p className="text-slate-500">{tr("Chưa có phiếu cho sản phẩm này.")}</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-auto">
          {history.slice(0, 12).map((m) => {
            const line = m.items.find((i) => i.productId === product.id);
            const inbound = m.type === "in" || m.type === "return";
            return (
              <li key={m.id} className="rounded-[10px] border border-slate-100 px-3 py-2">
                <p className="font-semibold">
                  {inbound ? "+" : "−"}
                  {line?.quantity ?? 0} · {m.reason ?? m.type} #{m.code}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(m.createdAt)} · {m.userName}
                  {line?.beforeQty != null ? ` · ${line.beforeQty} → ${line.afterQty}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Filters({
  cat,
  setCat,
  level,
  setLevel,
  supplierId,
  setSupplierId,
  categories,
  suppliers,
}: {
  cat: string;
  setCat: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  supplierId: string;
  setSupplierId: (v: string) => void;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}) {
  return (
    <>
      <select className={fieldClass} value={cat} aria-label={tr("Danh mục")} onChange={(e) => setCat(e.target.value)}>
        <option value="all">{tr("Mọi danh mục")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select className={fieldClass} value={level} aria-label={tr("Mức tồn")} onChange={(e) => setLevel(e.target.value)}>
        <option value="all">{tr("Tất cả")}</option>
        <option value="low">{tr("Sắp hết")}</option>
        <option value="out">{tr("Hết hàng")}</option>
        <option value="high">{tr("Tồn cao")}</option>
      </select>
      <select className={fieldClass} value={supplierId} aria-label={tr("Nhà cung cấp")} onChange={(e) => setSupplierId(e.target.value)}>
        <option value="all">{tr("Mọi nhà cung cấp")}</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </>
  );
}
