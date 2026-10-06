"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AI_SUGGESTIONS, INITIAL_CUSTOMERS } from "@/data/customers";
import { daysAgoLabel, formatDate, formatVnd } from "@/lib/format";
import { usePosStore } from "@/store/usePosStore";

const FEATURES = [
  "Hồ sơ khách hàng",
  "Lịch sử mua hàng",
  "Tổng chi tiêu",
  "Lần mua gần nhất",
  "Nhóm khách hàng",
  "Nhắc khách quay lại",
];

export default function CustomerExpansionPage() {
  const addToast = usePosStore((s) => s.addToast);

  return (
    <AppShell>
      <PageHeader
        title="Dolphin Customer"
        description="Expansion feature — giới thiệu cho Founder demo upsell"
        actions={
          <Link href="/" className="pos-btn pos-btn-outline">
            <ArrowLeft size={16} />
            Về tổng quan
          </Link>
        }
      />

      <div className="mb-4 rounded-[12px] bg-gradient-to-br from-[var(--pos-green)] to-emerald-400 p-5 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users size={18} />
          Quản lý khách hàng và tăng tỷ lệ khách quay lại
        </div>
        <p className="mt-2 max-w-2xl text-sm text-emerald-50">
          Đây không phải core POS. Module giúp cửa hàng nhớ khách thân, theo dõi
          chu kỳ mua cát / thức ăn, và nhắc quay lại đúng lúc.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="pos-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-base font-bold">Khách hàng mẫu</h2>
          <ul className="space-y-3">
            {INITIAL_CUSTOMERS.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 rounded-[10px] border border-[var(--pos-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {c.phone} · {c.group}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Mua gần nhất {formatDate(c.lastPurchaseAt)} · {c.visitCount} lần
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold">{formatVnd(c.totalSpent)}</p>
                  <p className="text-xs text-slate-500">Tổng chi tiêu</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[12px] border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--pos-green-dark)]">
            <Sparkles size={16} />
            Dolphin AI
          </div>
          <p className="text-sm font-semibold text-slate-900">
            3 khách hàng có khả năng quay lại mua cát trong 5 ngày tới.
          </p>
          <ul className="mt-3 space-y-2">
            {AI_SUGGESTIONS.map((s) => (
              <li key={s.customerId} className="rounded-[10px] bg-white p-3 text-sm">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-slate-500">{s.insight}</p>
                <p className="mt-1 text-xs text-[var(--pos-green-dark)]">
                  Gợi ý: {s.productHint}
                </p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="pos-btn pos-btn-primary mt-4 w-full"
            onClick={() =>
              addToast("info", "Đã mở danh sách đề xuất chăm sóc (mock demo)")
            }
          >
            Xem đề xuất
          </button>
          <p className="mt-3 text-xs text-slate-500">
            Ví dụ: khách A mua cát lần cuối {daysAgoLabel("2026-09-09")}.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
