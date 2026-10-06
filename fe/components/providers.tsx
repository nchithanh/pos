"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ensureSeeded } from "@/lib/seed";
import { useAuthStore } from "@/stores/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const [ready, setReady] = useState(false);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureSeeded();
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
        {ready ? (
          children
        ) : (
          <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-500">
                Đang khởi tạo Dolphin POS…
              </p>
            </div>
          </div>
        )}
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
