"use client";

import { tr } from "@/lib/i18n/translate";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-950"
    >
      <WifiOff size={14} aria-hidden />
      {tr("Đang offline — dữ liệu vẫn lưu trên máy (IndexedDB)")}
    </div>
  );
}
