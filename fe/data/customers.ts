import type { Customer } from "@/lib/types";

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cus-01",
    name: "Nguyễn Văn A",
    phone: "0906 111 222",
    totalSpent: 4_850_000,
    lastPurchaseAt: "2026-09-09",
    group: "Mèo — mua cát định kỳ",
    visitCount: 18,
  },
  {
    id: "cus-02",
    name: "Trần Văn B",
    phone: "0907 333 444",
    totalSpent: 3_220_000,
    lastPurchaseAt: "2026-09-06",
    group: "Mèo — mua cát định kỳ",
    visitCount: 14,
  },
  {
    id: "cus-03",
    name: "Lê Thị Cẩm",
    phone: "0908 555 666",
    totalSpent: 6_140_000,
    lastPurchaseAt: "2026-10-05",
    group: "VIP",
    visitCount: 26,
  },
  {
    id: "cus-04",
    name: "Phạm Đức D",
    phone: "0909 777 888",
    totalSpent: 2_780_000,
    lastPurchaseAt: "2026-10-04",
    group: "Chó — thức ăn hạt",
    visitCount: 11,
  },
  {
    id: "cus-05",
    name: "Hoàng Thị Mai",
    phone: "0910 999 000",
    totalSpent: 1_950_000,
    lastPurchaseAt: "2026-09-28",
    group: "Khách thân",
    visitCount: 9,
  },
  {
    id: "cus-06",
    name: "Vũ Minh Tuấn",
    phone: "0911 222 333",
    totalSpent: 890_000,
    lastPurchaseAt: "2026-08-20",
    group: "Cần nhắc quay lại",
    visitCount: 4,
  },
];

export const AI_SUGGESTIONS = [
  {
    customerId: "cus-01",
    name: "Nguyễn Văn A",
    insight: "Mua cát lần cuối: 27 ngày trước",
    productHint: "Cát vệ sinh Catsan 10L",
  },
  {
    customerId: "cus-02",
    name: "Trần Văn B",
    insight: "Mua cát lần cuối: 30 ngày trước",
    productHint: "Cát đậu nành Tofu 6L",
  },
  {
    customerId: "cus-06",
    name: "Vũ Minh Tuấn",
    insight: "Mua thức ăn lần cuối: 47 ngày trước",
    productHint: "Pedigree Adult 1.5kg",
  },
];
