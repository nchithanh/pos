import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dfFormat, parseISO } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { readLang } from "@/lib/i18n/translate";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVnd(amount: number): string {
  const locale = readLang() === "en" ? "en-US" : "vi-VN";
  return `${Math.round(amount).toLocaleString(locale)}đ`;
}

export function formatDate(iso: string, pattern = "dd/MM/yyyy"): string {
  try {
    return dfFormat(parseISO(iso), pattern, {
      locale: readLang() === "en" ? enUS : vi,
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  return formatDate(iso, "dd/MM/yyyy HH:mm");
}

export function todayKey(d = new Date()): string {
  return dfFormat(d, "yyyy-MM-dd");
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function orderCode(seq: number, d = new Date()): string {
  return `DH-${dfFormat(d, "ddMMyy")}-${String(seq).padStart(3, "0")}`;
}
