"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  OutboundLine,
  OutboundOrder,
  PurchaseLine,
  PurchaseOrder,
  StockTransfer,
} from "@/lib/warehouse/types";
import { uid } from "@/lib/utils";
import type { Product, Supplier } from "@/types";

const DEMO_VERSION = 2;

interface WarehouseState {
  verticalId: string;
  purchases: PurchaseOrder[];
  outbounds: OutboundOrder[];
  transfers: StockTransfer[];
  /** Hàng hỏng không bán được, tính trong tồn hiện tại */
  damaged: Record<string, number>;
  demoVersion: number;
  ensureVertical: (verticalId: string) => void;
  ensureDemo: (products: Product[], suppliers: Supplier[], userName: string) => void;
  savePurchase: (po: PurchaseOrder) => void;
  saveOutbound: (order: OutboundOrder) => void;
  addTransfer: (row: StockTransfer) => void;
  addDamaged: (productId: string, qty: number) => void;
}

function blank(verticalId: string) {
  return {
    verticalId,
    purchases: [] as PurchaseOrder[],
    outbounds: [] as OutboundOrder[],
    transfers: [] as StockTransfer[],
    damaged: {} as Record<string, number>,
    demoVersion: 0,
  };
}

function daysAgo(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 20, 0, 0);
  return d.toISOString();
}

function findProduct(products: Product[], pattern: RegExp, index: number) {
  return products.find((p) => pattern.test(p.name)) ?? products[index] ?? products[0];
}

function supplierOf(suppliers: Supplier[], product: Product | undefined) {
  return suppliers.find((s) => s.id === product?.supplierId) ?? suppliers[0];
}

function buyLine(
  product: Product,
  ordered: number,
  received: number,
  damaged = 0,
): PurchaseLine {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    ordered,
    received,
    damaged,
    cost: product.costPrice,
  };
}

function shipLine(product: Product, requested: number, picked: number): OutboundLine {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    requested,
    picked,
  };
}

function buildDemoPack(products: Product[], suppliers: Supplier[], userName: string) {
  const tofu = findProduct(products, /tofu|cát đậu/i, 0);
  const royal = findProduct(products, /royal canin indoor/i, 1);
  const meo = findProduct(products, /me-o adult|meo adult/i, 2);
  const pate = findProduct(products, /pate me-o|me-o creamy/i, 3);
  const snack = findProduct(products, /jerhigh|snack/i, 4);
  const litterSup = supplierOf(suppliers, tofu);
  const foodSup = supplierOf(suppliers, royal);
  const pateSup = supplierOf(suppliers, pate);
  const actor = userName || "Phạm Đức Thành";
  if (!tofu || !litterSup) return null;

  const purchases: PurchaseOrder[] = [
    {
      id: "po_nk89",
      code: "NK00089",
      supplierId: litterSup.id,
      supplierName: litterSup.name,
      status: "awaiting_receive",
      expectedAt: new Date().toISOString().slice(0, 10),
      createdAt: daysAgo(0, 9),
      createdBy: actor,
      note: "Giao 50, kiểm nhận thực tế 48. Bấm xác nhận để cộng tồn.",
      payLater: true,
      lines: [buyLine(tofu, 50, 48, 0)],
    },
    {
      id: "po_nk76",
      code: "NK00076",
      supplierId: foodSup?.id ?? litterSup.id,
      supplierName: foodSup?.name ?? litterSup.name,
      status: "done",
      expectedAt: daysAgo(4).slice(0, 10),
      createdAt: daysAgo(6, 8),
      createdBy: actor,
      receivedBy: "Phạm Đức Thành",
      receivedAt: daysAgo(4, 15),
      note: "Nhập đủ hạt và pate.",
      payLater: true,
      lines: [
        buyLine(royal ?? tofu, 20, 20),
        buyLine(meo ?? tofu, 30, 30),
        buyLine(pate ?? tofu, 40, 40),
      ],
    },
    {
      id: "po_nk81",
      code: "NK00081",
      supplierId: pateSup?.id ?? litterSup.id,
      supplierName: pateSup?.name ?? litterSup.name,
      status: "variance",
      expectedAt: daysAgo(1).slice(0, 10),
      createdAt: daysAgo(2, 11),
      createdBy: "Lê Lan Anh",
      note: "Thiếu hàng và 2 đơn vị hỏng, chưa chốt nhập.",
      payLater: true,
      lines: [buyLine(pate ?? tofu, 100, 96, 2)],
    },
    {
      id: "po_nk64",
      code: "NK00064",
      supplierId: foodSup?.id ?? litterSup.id,
      supplierName: foodSup?.name ?? litterSup.name,
      status: "done",
      expectedAt: daysAgo(10).slice(0, 10),
      createdAt: daysAgo(12, 9),
      createdBy: actor,
      receivedBy: "Trần Minh Quân",
      receivedAt: daysAgo(10, 16),
      note: "Nhập snack tuần trước.",
      payLater: false,
      lines: [buyLine(snack ?? tofu, 24, 24)],
    },
    {
      id: "po_nk92",
      code: "NK00092",
      supplierId: foodSup?.id ?? litterSup.id,
      supplierName: foodSup?.name ?? litterSup.name,
      status: "draft",
      expectedAt: daysAgo(-3).slice(0, 10),
      createdAt: daysAgo(0, 14),
      createdBy: "Nguyễn Thị Hương",
      note: "Nháp, chưa gửi nhà cung cấp.",
      payLater: true,
      lines: [buyLine(royal ?? tofu, 12, 12)],
    },
    {
      id: "po_nk55",
      code: "NK00055",
      supplierId: litterSup.id,
      supplierName: litterSup.name,
      status: "cancelled",
      expectedAt: daysAgo(8).slice(0, 10),
      createdAt: daysAgo(9, 10),
      createdBy: actor,
      note: "NCC hết hàng, đã hủy.",
      payLater: true,
      lines: [buyLine(tofu, 20, 0)],
    },
  ];

  const outbounds: OutboundOrder[] = [
    {
      id: "ob_121",
      code: "XK00121",
      requester: "Nguyễn Minh Anh",
      purpose: "Bán hàng",
      destination: "Kho cửa hàng",
      note: "Chờ quản lý duyệt.",
      status: "pending",
      createdAt: daysAgo(0, 11),
      lines: [shipLine(tofu, 10, 0)],
    },
    {
      id: "ob_124",
      code: "XK00124",
      requester: "Lê Lan Anh",
      purpose: "Bán hàng",
      destination: "Kho cửa hàng",
      note: "",
      status: "approved",
      createdAt: daysAgo(1, 9),
      approvedBy: "Trần Minh Quân",
      approvedAt: daysAgo(1, 10),
      lines: [shipLine(royal ?? tofu, 4, 0)],
    },
    {
      id: "ob_126",
      code: "XK00126",
      requester: "Phạm Đức Thành",
      purpose: "Nội bộ",
      destination: "Kho cửa hàng",
      note: "Đang soạn.",
      status: "picking",
      createdAt: daysAgo(1, 14),
      approvedBy: "Nguyễn Thị Hương",
      approvedAt: daysAgo(1, 15),
      lines: [shipLine(meo ?? tofu, 8, 3)],
    },
    {
      id: "ob_128",
      code: "XK00128",
      requester: "Lê Lan Anh",
      purpose: "Bán hàng",
      destination: "Khách tại quầy",
      note: "Thiếu so với yêu cầu.",
      status: "partial",
      createdAt: daysAgo(2, 16),
      approvedBy: "Trần Minh Quân",
      approvedAt: daysAgo(2, 17),
      lines: [shipLine(pate ?? tofu, 20, 12)],
    },
    {
      id: "ob_119",
      code: "XK00119",
      requester: "Phạm Đức Thành",
      purpose: "Chuyển kho",
      destination: "Kho cửa hàng Q7",
      note: "Đã soạn đủ, chờ bàn giao.",
      status: "ready",
      createdAt: daysAgo(2, 8),
      approvedBy: "Nguyễn Thị Hương",
      approvedAt: daysAgo(2, 9),
      lines: [shipLine(snack ?? tofu, 6, 6)],
    },
    {
      id: "ob_112",
      code: "XK00112",
      requester: "Lê Lan Anh",
      purpose: "Bán hàng",
      destination: "Kho cửa hàng",
      note: "Đã xuất hôm trước.",
      status: "shipped",
      createdAt: daysAgo(5, 9),
      approvedBy: "Trần Minh Quân",
      approvedAt: daysAgo(5, 10),
      shippedBy: "Phạm Đức Thành",
      shippedAt: daysAgo(5, 16),
      lines: [shipLine(royal ?? tofu, 2, 2)],
    },
    {
      id: "ob_110",
      code: "XK00110",
      requester: "Lê Lan Anh",
      purpose: "Hàng mẫu",
      destination: "Sự kiện cuối tuần",
      note: "Không đủ ngân sách mẫu.",
      status: "rejected",
      createdAt: daysAgo(3, 11),
      lines: [shipLine(snack ?? tofu, 15, 0)],
    },
    {
      id: "ob_108",
      code: "XK00108",
      requester: "Phạm Đức Thành",
      purpose: "Khác",
      destination: "Kho cửa hàng",
      note: "Khách hủy.",
      status: "cancelled",
      createdAt: daysAgo(7, 13),
      lines: [shipLine(meo ?? tofu, 5, 0)],
    },
  ];

  const transfers: StockTransfer[] = [
    {
      id: "tf_01",
      code: "CK1042",
      from: "Kho tổng",
      to: "Kho cửa hàng",
      productId: (royal ?? tofu).id,
      name: (royal ?? tofu).name,
      qty: 6,
      status: "received",
      createdAt: daysAgo(6, 10),
      createdBy: actor,
    },
    {
      id: "tf_02",
      code: "CK1048",
      from: "Kho cửa hàng",
      to: "Kho cửa hàng Q7",
      productId: (snack ?? tofu).id,
      name: (snack ?? tofu).name,
      qty: 4,
      status: "transit",
      createdAt: daysAgo(1, 17),
      createdBy: "Phạm Đức Thành",
    },
  ];

  const damaged: Record<string, number> = {};
  if (pate) damaged[pate.id] = 2;

  return { purchases, outbounds, transfers, damaged };
}

export const useWarehouseStore = create<WarehouseState>()(
  persist(
    (set, get) => ({
      ...blank("pet"),
      ensureVertical: (verticalId) => {
        if (get().verticalId === verticalId) return;
        set(blank(verticalId));
      },
      ensureDemo: (products, suppliers, userName) => {
        if (!products.length || !suppliers.length) return;
        if (get().demoVersion >= DEMO_VERSION) return;
        const pack = buildDemoPack(products, suppliers, userName);
        if (!pack) return;
        const merge = <T extends { code: string }>(current: T[], incoming: T[]) => {
          const codes = new Set(current.map((row) => row.code));
          return [...current, ...incoming.filter((row) => !codes.has(row.code))];
        };
        set({
          purchases: merge(get().purchases, pack.purchases),
          outbounds: merge(get().outbounds, pack.outbounds),
          transfers: merge(get().transfers, pack.transfers),
          damaged: { ...pack.damaged, ...get().damaged },
          demoVersion: DEMO_VERSION,
        });
      },
      savePurchase: (po) => {
        const list = get().purchases;
        const idx = list.findIndex((p) => p.id === po.id);
        const next = idx >= 0 ? list.map((p) => (p.id === po.id ? po : p)) : [po, ...list];
        set({ purchases: next });
      },
      saveOutbound: (order) => {
        const list = get().outbounds;
        const idx = list.findIndex((p) => p.id === order.id);
        const next =
          idx >= 0 ? list.map((p) => (p.id === order.id ? order : p)) : [order, ...list];
        set({ outbounds: next });
      },
      addTransfer: (row) => set({ transfers: [row, ...get().transfers] }),
      addDamaged: (productId, qty) => {
        if (qty <= 0) return;
        set({
          damaged: {
            ...get().damaged,
            [productId]: (get().damaged[productId] ?? 0) + qty,
          },
        });
      },
    }),
    { name: "dolphin-pos-warehouse" },
  ),
);

export function reservedQty(
  outbounds: OutboundOrder[],
  productId: string,
  exceptId?: string,
) {
  return outbounds
    .filter(
      (o) =>
        o.id !== exceptId &&
        (o.status === "approved" ||
          o.status === "picking" ||
          o.status === "partial" ||
          o.status === "ready"),
    )
    .flatMap((o) => o.lines)
    .filter((l) => l.productId === productId)
    .reduce((s, l) => s + l.requested, 0);
}

export function availableQty(
  stock: number,
  damaged: number,
  reserved: number,
) {
  return Math.max(0, stock - damaged - reserved);
}
