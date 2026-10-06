"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, formatVnd } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductPicker({
  products,
  onPick,
  placeholder = "Quét mã vạch hoặc gõ tên / SKU…",
  className,
}: {
  products: Product[];
  onPick: (product: Product) => void;
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products.filter((p) => p.active).slice(0, 8);
    const exactBarcode = products.find(
      (p) => p.active && (p.barcode ?? "") === q.trim(),
    );
    if (exactBarcode) return [exactBarcode];
    return products
      .filter((p) => {
        if (!p.active) return false;
        return (
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode ?? "").includes(query)
        );
      })
      .slice(0, 12);
  }, [products, q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (p: Product) => {
    onPick(p);
    setQ("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = q.trim();
      if (!query) return;
      const byBarcode = products.find(
        (p) => p.active && (p.barcode ?? "") === query,
      );
      if (byBarcode) {
        pick(byBarcode);
        return;
      }
      if (matches[0]) pick(matches[0]);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
      />
      <Input
        ref={inputRef}
        className="pl-9"
        value={q}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && matches.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-[10px] border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => pick(p)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="text-xs text-slate-400">
                    {p.sku}
                    {p.barcode ? ` · ${p.barcode}` : ""} · tồn {p.stock} {p.unit}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-500">
                  {formatVnd(p.costPrice)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
