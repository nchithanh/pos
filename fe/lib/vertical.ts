import type { StoreVertical } from "@/types";

export const VERTICAL_STORAGE_KEY = "dolphin-pos-vertical";

export type SeedVerticalId =
  | "pet"
  | "cafe"
  | "tra-sua"
  | "thoi-trang"
  | "nha-hang"
  | "tap-hoa"
  | "dien-thoai";

export type VerticalAccent =
  | "emerald"
  | "amber"
  | "pink"
  | "violet"
  | "orange"
  | "teal"
  | "sky";

export type VerticalOption = {
  id: SeedVerticalId;
  label: string;
  emoji: string;
  description: string;
  accent: VerticalAccent;
  /** Hex chính — swatch UI */
  color: string;
  colorSoft: string;
};

/** Lĩnh vực demo có JSON seed */
export const VERTICAL_OPTIONS: VerticalOption[] = [
  {
    id: "pet",
    label: "Pet shop",
    emoji: "🐾",
    description: "Thức ăn, cát, pate, phụ kiện thú cưng",
    accent: "emerald",
    color: "#10B981",
    colorSoft: "#ECFDF5",
  },
  {
    id: "cafe",
    label: "Cafe",
    emoji: "☕",
    description: "Cà phê, trà, bánh, topping, mang đi",
    accent: "amber",
    color: "#D97706",
    colorSoft: "#FFFBEB",
  },
  {
    id: "tra-sua",
    label: "Trà sữa",
    emoji: "🧋",
    description: "Trà sữa, topping, size L/M — mang đi & tại quán",
    accent: "pink",
    color: "#EC4899",
    colorSoft: "#FDF2F8",
  },
  {
    id: "thoi-trang",
    label: "Thời trang",
    emoji: "👗",
    description: "Áo quần, phụ kiện — size & SKU bán lẻ",
    accent: "violet",
    color: "#7C3AED",
    colorSoft: "#F5F3FF",
  },
  {
    id: "nha-hang",
    label: "Nhà hàng",
    emoji: "🍽️",
    description: "Món ăn, đồ uống, set bàn — F&B tại chỗ",
    accent: "orange",
    color: "#EA580C",
    colorSoft: "#FFF7ED",
  },
  {
    id: "tap-hoa",
    label: "Tạp hóa",
    emoji: "🛒",
    description: "Mì, nước, snack, gia vị, đồ dùng nhà",
    accent: "teal",
    color: "#0D9488",
    colorSoft: "#F0FDFA",
  },
  {
    id: "dien-thoai",
    label: "Điện thoại & laptop",
    emoji: "📱",
    description: "Điện thoại, laptop, máy tính bảng và phụ kiện",
    accent: "sky",
    color: "#0284C7",
    colorSoft: "#F0F9FF",
  },
];

const SEED_IDS = new Set<string>(VERTICAL_OPTIONS.map((v) => v.id));

export function isSeedVertical(
  v: string | null | undefined,
): v is SeedVerticalId {
  return !!v && SEED_IDS.has(v);
}

export function getStoredVertical(): SeedVerticalId | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(VERTICAL_STORAGE_KEY);
  return isSeedVertical(v) ? v : null;
}

export function setStoredVertical(vertical: SeedVerticalId) {
  window.localStorage.setItem(VERTICAL_STORAGE_KEY, vertical);
  applyVerticalTheme(vertical);
}

export function clearStoredVertical() {
  window.localStorage.removeItem(VERTICAL_STORAGE_KEY);
  applyVerticalTheme(null);
}

export function dbNameForVertical(vertical: string) {
  return `dolphin_pos_${vertical}`;
}

export function getVerticalOption(id: string | null | undefined) {
  return VERTICAL_OPTIONS.find((v) => v.id === id);
}

/** Gắn `data-vertical` trên <html> → CSS đổi tông emerald-* / --primary */
export function applyVerticalTheme(vertical: SeedVerticalId | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!vertical) {
    root.removeAttribute("data-vertical");
    return;
  }
  root.setAttribute("data-vertical", vertical);
}

/** StoreSettings.vertical có thể chứa hơn seed — map legacy */
export function normalizeStoreVertical(
  v: StoreVertical | string | undefined,
): SeedVerticalId | null {
  if (isSeedVertical(v)) return v;
  if (v === "clothing") return "thoi-trang";
  if (v === "general") return "pet";
  return null;
}
