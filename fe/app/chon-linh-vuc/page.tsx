"use client";

import { tr } from "@/lib/i18n/translate";

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
      notify.success(
        tr("Đã chọn {name} — đăng nhập để bán hàng", {
          name: tr(opt.label),
        }),
      );
      router.replace("/login");
    } catch (e) {
      notify.fromError(e, tr("Không khởi tạo được dữ liệu lĩnh vực"));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark className="mb-3 h-14 w-14" />
        <h1 className="text-2xl font-bold tracking-tight">Dolphin POS</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          {tr(
            "Chọn lĩnh vực cửa hàng để tải dữ liệu demo phù hợp. Mỗi lĩnh vực có tông màu riêng và lưu IndexedDB riêng trên máy.",
          )}
        </p>
      </div>

      <div className="flex w-full max-w-lg flex-col gap-3">
        {VERTICAL_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => void pick(opt)}
            className="flex w-full items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-2xl"
              style={{ backgroundColor: opt.colorSoft }}
              aria-hidden
            >
              {opt.emoji}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-slate-900 dark:text-white">
                {tr(opt.label)}
              </span>
              <span className="mt-0.5 block text-sm text-slate-500">
                {tr(opt.description)}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        {tr("Có thể đổi lĩnh vực lại từ Cài đặt hoặc quay lại trang này khi đăng xuất.")}
      </p>
    </div>
  );
}
