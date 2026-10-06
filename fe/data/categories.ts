import type { Category } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { id: "all", name: "Tất cả", emoji: "🐾" },
  { id: "thuc-an", name: "Thức ăn", emoji: "🥣" },
  { id: "cat-ve-sinh", name: "Cát vệ sinh", emoji: "📦" },
  { id: "pate", name: "Pate", emoji: "🥫" },
  { id: "snack", name: "Snack", emoji: "🦴" },
  { id: "do-choi", name: "Đồ chơi", emoji: "🧸" },
  { id: "cham-soc", name: "Chăm sóc", emoji: "🧴" },
  { id: "phu-kien", name: "Phụ kiện", emoji: "🎀" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<Category["id"], Category>;
