"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getStoredVertical } from "@/lib/vertical";

/** Pages `trailingSlash` → `/login/` — normalize trước khi so khớp. */
function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

const PUBLIC_NO_AUTH = new Set(["/chon-linh-vuc", "/login"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const path = normalizePath(pathname);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [vertical, setVertical] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setVertical(getStoredVertical());
  }, [path, hydrated]);

  useEffect(() => {
    if (!hydrated || vertical === undefined) return;

    if (!vertical) {
      if (path !== "/chon-linh-vuc") {
        router.replace("/chon-linh-vuc");
      }
      return;
    }

    if (!user && path !== "/login" && path !== "/chon-linh-vuc") {
      router.replace("/login");
      return;
    }

    if (user && (path === "/login" || path === "/chon-linh-vuc")) {
      router.replace("/");
    }
  }, [hydrated, user, path, router, vertical]);

  if (!hydrated || vertical === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!vertical && path !== "/chon-linh-vuc") return null;
  if (vertical && !user && !PUBLIC_NO_AUTH.has(path)) return null;

  return <>{children}</>;
}
