"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/format";

export function SearchBar({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
  rect,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rect?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={18}
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
      />
      <input
        className={cn("pos-input pl-10", rect && "pos-input-rect")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
        enterKeyHint="search"
      />
    </div>
  );
}
