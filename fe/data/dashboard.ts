import type { DashboardStats } from "@/lib/types";

export const DASHBOARD_STATS: DashboardStats = {
  todayRevenue: 8_450_000,
  todayOrders: 42,
  lowStockCount: 8,
  receivable: 12_930_000,
  payable: 22_000_000,
  revenue7Days: [
    { date: "2026-09-30", revenue: 6_820_000, orders: 31 },
    { date: "2026-10-01", revenue: 7_450_000, orders: 35 },
    { date: "2026-10-02", revenue: 5_980_000, orders: 28 },
    { date: "2026-10-03", revenue: 8_120_000, orders: 39 },
    { date: "2026-10-04", revenue: 9_340_000, orders: 44 },
    { date: "2026-10-05", revenue: 7_760_000, orders: 36 },
    { date: "2026-10-06", revenue: 8_450_000, orders: 42 },
  ],
  topProducts: [
    { productId: "p-07", name: "Cát vệ sinh Catsan 10L", sold: 48, revenue: 8_880_000 },
    { productId: "p-01", name: "Royal Canin Indoor 2kg", sold: 22, revenue: 8_470_000 },
    { productId: "p-12", name: "Pate Whiskas vị cá ngừ", sold: 186, revenue: 3_348_000 },
    { productId: "p-09", name: "Cát đậu nành Tofu 6L", sold: 31, revenue: 4_185_000 },
    { productId: "p-03", name: "Pedigree Adult 1.5kg", sold: 27, revenue: 4_455_000 },
  ],
};

export const STORE_INFO = {
  name: "Pet Dolphin Store",
  address: "12 Nguyễn Thị Minh Khai, Q.1, TP.HCM",
  phone: "028 3822 5566",
};

export const REVENUE_SERIES = {
  today: {
    revenue: 8_450_000,
    profit: 2_680_000,
    orders: 42,
    aov: 201_190,
    daily: [{ date: "2026-10-06", revenue: 8_450_000, orders: 42 }],
  },
  "7d": {
    revenue: 53_920_000,
    profit: 16_850_000,
    orders: 255,
    aov: 211_451,
    daily: [
      { date: "2026-09-30", revenue: 6_820_000, orders: 31 },
      { date: "2026-10-01", revenue: 7_450_000, orders: 35 },
      { date: "2026-10-02", revenue: 5_980_000, orders: 28 },
      { date: "2026-10-03", revenue: 8_120_000, orders: 39 },
      { date: "2026-10-04", revenue: 9_340_000, orders: 44 },
      { date: "2026-10-05", revenue: 7_760_000, orders: 36 },
      { date: "2026-10-06", revenue: 8_450_000, orders: 42 },
    ],
  },
  "30d": {
    revenue: 218_400_000,
    profit: 68_200_000,
    orders: 1024,
    aov: 213_281,
    daily: [
      { date: "2026-09-07", revenue: 6_100_000, orders: 29 },
      { date: "2026-09-10", revenue: 7_200_000, orders: 33 },
      { date: "2026-09-14", revenue: 8_050_000, orders: 38 },
      { date: "2026-09-18", revenue: 6_880_000, orders: 32 },
      { date: "2026-09-22", revenue: 9_100_000, orders: 41 },
      { date: "2026-09-26", revenue: 7_540_000, orders: 35 },
      { date: "2026-09-30", revenue: 6_820_000, orders: 31 },
      { date: "2026-10-03", revenue: 8_120_000, orders: 39 },
      { date: "2026-10-06", revenue: 8_450_000, orders: 42 },
    ],
  },
  month: {
    revenue: 48_110_000,
    profit: 15_020_000,
    orders: 224,
    aov: 214_777,
    daily: [
      { date: "2026-10-01", revenue: 7_450_000, orders: 35 },
      { date: "2026-10-02", revenue: 5_980_000, orders: 28 },
      { date: "2026-10-03", revenue: 8_120_000, orders: 39 },
      { date: "2026-10-04", revenue: 9_340_000, orders: 44 },
      { date: "2026-10-05", revenue: 7_760_000, orders: 36 },
      { date: "2026-10-06", revenue: 8_450_000, orders: 42 },
    ],
  },
};
