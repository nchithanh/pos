"use client";

import { useLang } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { reopenDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { applyVerticalTheme, getStoredVertical } from "@/lib/vertical";
import { useFinanceStore } from "@/stores/finance-store";
import { useWarehouseStore } from "@/stores/warehouse-store";
import { useAuthStore } from "@/stores/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const lang = useLang();
  const [client] = useState(() => new QueryClient());
  const [ready, setReady] = useState(false);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let alive = true;
    (async () => {
      const vertical = getStoredVertical();
      applyVerticalTheme(vertical);
      useFinanceStore.getState().ensureVertical(vertical ?? "pet");
      useWarehouseStore.getState().ensureVertical(vertical ?? "pet");
      if (vertical) {
        reopenDb(vertical);
        await ensureSeeded(vertical);
      }
      if (alive) {
        setReady(true);
        setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [setHydrated]);

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <div key={lang} className="contents">
          {ready ? (
            children
          ) : (
            <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
              <div className="text-center">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className="text-sm font-medium text-slate-500">
                  {lang === "en" ? "Starting Dolphin POS…" : "Đang khởi tạo Dolphin POS…"}
                </p>
              </div>
            </div>
          )}
        </div>
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
