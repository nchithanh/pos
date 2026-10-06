"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { BrandMark } from "@/components/brand-mark";
import { ensureSeeded } from "@/lib/seed";
import { reopenDb } from "@/lib/db";
import {
  VERTICAL_OPTIONS,
  setStoredVertical,
  type VerticalOption,
} from "@/lib/vertical";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ChooseVerticalPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clear);

  const pick = async (opt: VerticalOption) => {
    try {
      setStoredVertical(opt.id);
      logout();
      clearCart();
      reopenDb(opt.id);
      await ensureSeeded(opt.id);
      notify.success(`Đã chọn ${opt.label} — đăng nhập để bán hàng`);
      router.replace("/login");
    } catch (e) {
      notify.fromError(e, "Không khởi tạo được dữ liệu lĩnh vực");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark className="mb-3 h-14 w-14" />
        <h1 className="text-2xl font-bold tracking-tight">Dolphin POS</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Chọn lĩnh vực cửa hàng để tải dữ liệu demo phù hợp. Mỗi lĩnh vực có
          tông màu riêng và lưu IndexedDB riêng trên máy.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VERTICAL_OPTIONS.map((opt) => (
          <Card
            key={opt.id}
            className="flex flex-col border-2 p-5 transition hover:shadow-md"
            style={{
              borderColor: opt.colorSoft,
              background: `linear-gradient(180deg, ${opt.colorSoft} 0%, var(--card) 48%)`,
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-4xl" aria-hidden>
                {opt.emoji}
              </span>
              <span
                className="h-3 w-3 rounded-full ring-2 ring-white"
                style={{ backgroundColor: opt.color }}
                title={`Accent ${opt.accent}`}
                aria-hidden
              />
            </div>
            <h2 className="text-lg font-bold">{opt.label}</h2>
            <p className="mt-1 flex-1 text-sm text-slate-500">
              {opt.description}
            </p>
            <Button
              className="mt-5 w-full border-0 text-white hover:opacity-90"
              style={{ backgroundColor: opt.color }}
              onClick={() => void pick(opt)}
            >
              Chọn {opt.label}
            </Button>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Có thể đổi lĩnh vực lại từ Cài đặt hoặc quay lại trang này khi đăng xuất.
      </p>
    </div>
  );
}
