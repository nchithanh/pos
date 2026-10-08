"use client";

import { tr } from "@/lib/i18n/translate";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { differenceInDays, parseISO } from "date-fns";
import { Phone, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { formatDate, formatDateTime, formatVnd, uid } from "@/lib/utils";

export default function CustomersPage() {
  const customers = useLiveQuery(() => db.customers.toArray());
  const orders = useLiveQuery(() => db.orders.toArray());
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState(tr("Khách lẻ"));

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (customers ?? []).filter(
      (c) =>
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query),
    );
  }, [customers, q]);

  const ai = useMemo(() => {
    return (customers ?? [])
      .map((c) => {
        const days = c.lastPurchaseAt
          ? differenceInDays(new Date("2026-10-06"), parseISO(c.lastPurchaseAt))
          : 999;
        return { ...c, days };
      })
      .filter((c) => c.days >= 20)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [customers]);

  const detail = (customers ?? []).find((c) => c.id === detailId);
  const history = (orders ?? [])
    .filter((o) => o.customerId === detailId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AppShell>
      <PageHeader
        title={tr("Khách hàng")}
        description={tr("Dolphin Customer · điểm tích lũy · AI nhắc quay lại")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> {tr("Thêm")}
          </Button>
        }
      />
      <Input
        className="mb-4"
        placeholder={tr("Tìm tên / SĐT…")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {customers === undefined ? (
            <CardListSkeleton count={5} />
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                title={tr("Chưa có khách")}
                action={
                  <Button onClick={() => setOpen(true)}>{tr("Thêm khách")}</Button>
                }
              />
            </Card>
          ) : (
            filtered.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer p-4 transition hover:border-emerald-400"
                onClick={() => setDetailId(c.id)}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.phone} · {c.group}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.lastPurchaseAt
                        ? `Mua gần nhất ${formatDate(c.lastPurchaseAt)}`
                        : tr("Chưa mua")}{" "}
                      · {c.points} điểm · {c.visitCount} lần
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold">{formatVnd(c.totalSpent)}</p>
                    {c.debt > 0 ? (
                      <p className="text-xs text-amber-600">
                        {tr("Nợ")} {formatVnd(c.debt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:bg-emerald-950/30">
          <div className="mb-2 flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles size={16} /> AI gợi ý quay lại
          </div>
          {ai.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có khách &gt; 20 ngày chưa mua.
            </p>
          ) : (
            <ul className="space-y-2">
              {ai.map((c) => (
                <li
                  key={c.id}
                  className="rounded-[10px] bg-white p-3 text-sm dark:bg-slate-900"
                >
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    Cách lần mua cuối: {c.days} ngày · {c.points} điểm
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link href={`/ban-hang?customer=${c.id}`}>
                      <Button size="sm" className="w-full">
                        <ShoppingBag size={14} /> Tạo đơn
                      </Button>
                    </Link>
                    <a href={`tel:${c.phone}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <Phone size={14} /> Gọi
                      </Button>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title={tr("Thêm khách hàng")}>
        <div className="space-y-3">
          <Input
            placeholder={tr("Tên")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder={tr("SĐT")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            placeholder={tr("Nhóm")}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={async () => {
              if (!name.trim() || !phone.trim())
                return notify.error(tr("Thiếu thông tin"));
              await db.customers.add({
                id: uid("cus"),
                name: name.trim(),
                phone: phone.trim(),
                group,
                points: 0,
                totalSpent: 0,
                visitCount: 0,
                debt: 0,
                createdAt: new Date().toISOString(),
              });
              notify.success(tr("Đã thêm khách"));
              setOpen(false);
              setName("");
              setPhone("");
            }}
          >
            {tr("Lưu")}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? tr("Khách hàng")}
      >
        {detail ? (
          <div className="space-y-3">
            <div className="rounded-[10px] bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p>{detail.phone}</p>
              <p className="text-slate-500">{detail.group}</p>
              <p className="mt-1 font-semibold">
                {detail.points} điểm · {formatVnd(detail.totalSpent)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/ban-hang?customer=${detail.id}`}>
                <Button className="w-full" size="sm">
                  <ShoppingBag size={14} /> Tạo đơn
                </Button>
              </Link>
              <a href={`tel:${detail.phone}`}>
                <Button className="w-full" size="sm" variant="outline">
                  <Phone size={14} /> Gọi
                </Button>
              </a>
            </div>
            <h3 className="text-sm font-bold">{tr("Lịch sử mua")}</h3>
            <ul className="max-h-64 space-y-2 overflow-auto text-sm">
              {history.length === 0 ? (
                <li className="text-slate-500">{tr("Chưa có đơn gắn khách này.")}</li>
              ) : (
                history.map((o) => (
                  <li
                    key={o.id}
                    className="flex justify-between rounded-[8px] bg-slate-50 px-3 py-2 dark:bg-slate-800"
                  >
                    <span>
                      {o.code}
                      <span className="ml-2 text-xs text-slate-400">
                        {formatDateTime(o.createdAt)}
                      </span>
                    </span>
                    <span className="font-semibold">{formatVnd(o.total)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
