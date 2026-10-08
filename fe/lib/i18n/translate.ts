import { EN } from "@/lib/i18n/en";

export type Lang = "vi" | "en";

export const LANG_STORAGE_KEY = "dolphin-pos-lang";
export const LANG_EVENT = "dolphin-pos-lang";

export function detectMachineLang(): Lang {
  if (typeof navigator === "undefined") return "vi";
  const list = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const raw of list) {
    const tag = (raw || "").toLowerCase();
    if (tag.startsWith("vi")) return "vi";
    if (tag.startsWith("en")) return "en";
  }
  return (navigator.language || "").toLowerCase().startsWith("vi") ? "vi" : "en";
}

export function readLang(): Lang {
  if (typeof window === "undefined") return "vi";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "vi" || stored === "en") return stored;
  return detectMachineLang();
}

export function setLang(lang: Lang) {
  window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event(LANG_EVENT));
}

export function subscribeLang(onStoreChange: () => void) {
  window.addEventListener(LANG_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(LANG_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function applyVars(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] == null ? "" : String(vars[key]),
  );
}

/** Dịch nhãn giao diện. Chuỗi không có trong từ điển giữ nguyên. */
export function tr(vi: string, vars?: Record<string, string | number>): string {
  const text = readLang() === "en" ? (EN[vi] ?? vi) : vi;
  return applyVars(text, vars);
}
