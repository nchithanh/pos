import type { StockInRecord, StockOutRecord } from "@/lib/types";

export const INITIAL_STOCK_INS: StockInRecord[] = [
  {
    id: "si-01",
    code: "NK-280926-01",
    supplierId: "sup-01",
    createdAt: "2026-09-28T09:30:00",
    items: [
      { productId: "p-01", quantity: 20, costPrice: 295_000 },
      { productId: "p-02", quantity: 30, costPrice: 92_000 },
    ],
    total: 8_660_000,
    note: "Nhập bổ sung cuối tháng 9",
  },
  {
    id: "si-02",
    code: "NK-011026-01",
    supplierId: "sup-04",
    createdAt: "2026-10-01T10:15:00",
    items: [
      { productId: "p-07", quantity: 40, costPrice: 125_000 },
      { productId: "p-09", quantity: 25, costPrice: 88_000 },
    ],
    total: 7_200_000,
    note: "Cát vệ sinh bán chạy",
  },
  {
    id: "si-03",
    code: "NK-031026-01",
    supplierId: "sup-02",
    createdAt: "2026-10-03T14:00:00",
    items: [
      { productId: "p-12", quantity: 100, costPrice: 11_000 },
      { productId: "p-13", quantity: 80, costPrice: 10_000 },
    ],
    total: 1_900_000,
    note: "Pate tuần 1",
  },
];

export const INITIAL_STOCK_OUTS: StockOutRecord[] = [
  {
    id: "so-01",
    code: "XK-021026-01",
    createdAt: "2026-10-02T16:20:00",
    items: [{ productId: "p-26", quantity: 2 }],
    reason: "Hàng lỗi / đổi trả NCC",
    note: "Chai bị rò nắp",
  },
  {
    id: "so-02",
    code: "XK-041026-01",
    createdAt: "2026-10-04T11:00:00",
    items: [{ productId: "p-21", quantity: 3 }],
    reason: "Sử dụng nội bộ / trưng bày",
    note: "Trưng bày cửa sổ",
  },
];

export const STOCK_OUT_REASONS = [
  "Hàng lỗi / đổi trả NCC",
  "Hết hạn sử dụng",
  "Sử dụng nội bộ / trưng bày",
  "Điều chỉnh kiểm kê",
  "Khác",
];
