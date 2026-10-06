"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { differenceInDays, parseISO } from "date-fns";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { formatDate, formatVnd, uid } from "@/lib/utils";

export default function CustomersPage() {
  const customers = useLiveQuery(() => db.customers.toArray());
  const orders = useLiveQuery(() => db.orders.toArray());
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("Khách lẻ");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (customers ?? []).filter(
      (c) => !query || c.name.toLowerCase().includes(query) || c.phone.includes(query),
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

  const history = (orders ?? []).filter((o) => o.customerId === detailId);

  return (
    <AppShell>
      <PageHeader
        title="Khách hàng"
        description="Dolphin Customer · điểm tích lũy · AI nhắc quay lại"
        actions={<Button onClick={() => setOpen(true)}><Plus size={16} /> Thêm</Button>}
      />
      <Input className="mb-4" placeholder="Tìm tên / SĐT…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {filtered.map((c) => (
            <Card key={c.id} className="cursor-pointer p-4" onClick={() => setDetailId(c.id)}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone} · {c.group}</p>
                  <p className="text-xs text-slate-500">
                    {c.lastPurchaseAt ? `Mua gần nhất ${formatDate(c.lastPurchaseAt)}` : "Chưa mua"} · {c.points} điểm
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-bold">{formatVnd(c.totalSpent)}</p>
                  {c.debt > 0 ? <p className="text-xs text-amber-600">Nợ {formatVnd(c.debt)}</p> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="border-emerald-200 bg-emerald-50/50 p-4 dark:bg-emerald-950/30">
          <div className="mb-2 flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles size={16} /> AI gợi ý quay lại
          </div>
          <ul className="space-y-2">
            {ai.map((c) => (
              <li key={c.id} className="rounded-[10px] bg-white p-3 text-sm dark:bg-slate-900">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-slate-500">Cách lần mua cuối: {c.days} ngày</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Thêm khách hàng">
        <div className="space-y-3">
          <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="SĐT" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Nhóm" value={group} onChange={(e) => setGroup(e.target.value)} />
          <Button
            className="w-full"
            onClick={async () => {
              if (!name.trim() || !phone.trim()) return toast.error("Thiếu thông tin");
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
              toast.success("Đã thêm khách");
              setOpen(false);
              setName("");
              setPhone("");
            }}
          >
            Lưu
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!detailId} onClose={() => setDetailId(null)} title="Lịch sử mua hàng">
        <ul className="max-h-72 space-y-2 overflow-auto text-sm">
          {history.length === 0 ? (
            <li className="text-slate-500">Chưa có đơn gắn khách này.</li>
          ) : (
            history.map((o) => (
              <li key={o.id} className="flex justify-between rounded-[8px] bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>{o.code}</span>
                <span className="font-semibold">{formatVnd(o.total)}</span>
              </li>
            ))
          )}
        </ul>
      </Dialog>
    </AppShell>
  );
}
