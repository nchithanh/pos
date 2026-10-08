"use client";

import { useSyncExternalStore } from "react";
import {
  readLang,
  setLang,
  subscribeLang,
  tr,
  type Lang,
} from "@/lib/i18n/translate";

export type { Lang };
export { readLang, setLang, tr };

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, readLang, () => "vi");
}
