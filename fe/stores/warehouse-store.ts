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
import type { Product, Supplier, User } from "@/types";

const DEMO_VERSION = 3;

interface WarehouseState {
  verticalId: string;
  purchases: PurchaseOrder[];
  outbounds: OutboundOrder[];
  transfers: StockTransfer[];
  /** Hàng hỏng không bán được, tính trong tồn hiện tại */
  damaged: Record<string, number>;
  demoVersion: number;
  ensureVertical: (verticalId: string) => void;
  ensureDemo: (products: Product[], suppliers: Supplier[], users: User[]) => void;
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

function byId(products: Product[], id: string) {
  return products.find((p) => p.id === id) ?? products[0];
}

function supplierOf(suppliers: Supplier[], product: Product | undefined) {
  return suppliers.find((s) => s.id === product?.supplierId) ?? suppliers[0];
}

function verticalKey(products: Product[]) {
  const id = products[0]?.id ?? "";
  if (id.startsWith("ts-")) return "tra-sua";
  if (id.startsWith("tt-")) return "thoi-trang";
  if (id.startsWith("nh-")) return "nha-hang";
  if (id.startsWith("tp-")) return "tap-hoa";
  if (id.startsWith("dt-")) return "dien-thoai";
  if (id.startsWith("c-")) return "cafe";
  return "pet";
}

export function staffFromUsers(users: Pick<User, "id" | "name" | "role">[]) {
  const owner = users.find((u) => u.role === "owner")?.name ?? "Chủ cửa hàng";
  const manager =
    users.find((u) => u.id === "u_manager")?.name ??
    users.find((u) => u.role === "manager" && u.id !== "u_warehouse")?.name ??
    "Quản lý";
  const cashier = users.find((u) => u.role === "cashier")?.name ?? "Thu ngân";
  const warehouse = users.find((u) => u.id === "u_warehouse")?.name ?? manager;
  return { owner, manager, cashier, warehouse };
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

interface DemoProfile {
  receive: string;
  bundle: [string, string, string];
  variance: string;
  paid: string;
  draft: string;
  cancel: string;
  ordered: number;
  received: number;
  bundleQty: [number, number, number];
  varianceOrdered: number;
  varianceReceived: number;
  varianceDamaged: number;
  paidQty: number;
  draftQty: number;
  cancelQty: number;
  outPending: number;
  outApproved: number;
  outPicking: number;
  outPickingDone: number;
  outPartial: number;
  outPartialDone: number;
  outReady: number;
  outShipped: number;
  outRejected: number;
  outCancelled: number;
  transferA: number;
  transferB: number;
  place: string;
  branch: string;
  receiveNote: string;
  bundleNote: string;
  varianceNote: string;
  paidNote: string;
  draftNote: string;
  cancelNote: string;
  samplePurpose: string;
}

const PROFILES: Record<string, DemoProfile> = {
  pet: {
    receive: "p-09",
    bundle: ["p-01", "p-05", "p-15"],
    variance: "p-15",
    paid: "p-17",
    draft: "p-01",
    cancel: "p-09",
    ordered: 50,
    received: 48,
    bundleQty: [20, 30, 40],
    varianceOrdered: 100,
    varianceReceived: 96,
    varianceDamaged: 2,
    paidQty: 24,
    draftQty: 12,
    cancelQty: 20,
    outPending: 10,
    outApproved: 4,
    outPicking: 8,
    outPickingDone: 3,
    outPartial: 20,
    outPartialDone: 12,
    outReady: 6,
    outShipped: 2,
    outRejected: 15,
    outCancelled: 5,
    transferA: 6,
    transferB: 4,
    place: "Kho cửa hàng",
    branch: "Kho cửa hàng Q7",
    receiveNote: "Giao 50, kiểm nhận thực tế 48. Bấm xác nhận để cộng tồn.",
    bundleNote: "Nhập đủ hạt và pate.",
    varianceNote: "Thiếu hàng và 2 đơn vị hỏng, chưa chốt nhập.",
    paidNote: "Nhập snack tuần trước, đã trả NCC.",
    draftNote: "Nháp, chưa gửi nhà cung cấp.",
    cancelNote: "NCC hết hàng, đã hủy.",
    samplePurpose: "Hàng mẫu",
  },
  cafe: {
    receive: "c-13",
    bundle: ["c-17", "c-19", "c-20"],
    variance: "c-16",
    paid: "c-14",
    draft: "c-11",
    cancel: "c-15",
    ordered: 50,
    received: 48,
    bundleQty: [40, 20, 100],
    varianceOrdered: 12,
    varianceReceived: 10,
    varianceDamaged: 1,
    paidQty: 24,
    draftQty: 12,
    cancelQty: 8,
    outPending: 10,
    outApproved: 8,
    outPicking: 6,
    outPickingDone: 2,
    outPartial: 4,
    outPartialDone: 2,
    outReady: 6,
    outShipped: 4,
    outRejected: 6,
    outCancelled: 2,
    transferA: 10,
    transferB: 4,
    place: "Quầy",
    branch: "Chi nhánh Q7",
    receiveNote: "Giao 50 croissant, kiểm nhận thực tế 48. Bấm xác nhận để cộng tồn.",
    bundleNote: "Nhập trân châu, whipping và ly giấy.",
    varianceNote: "Cheesecake thiếu 2 và 1 phần hỏng, chưa chốt nhập.",
    paidNote: "Nhập bánh mì que, đã trả NCC.",
    draftNote: "Nháp cookie đá xay, chưa gửi bếp.",
    cancelNote: "Bếp hết tiramisu, đã hủy.",
    samplePurpose: "Pha chế thử",
  },
  "tra-sua": {
    receive: "ts-09",
    bundle: ["ts-01", "ts-10", "ts-16"],
    variance: "ts-12",
    paid: "ts-06",
    draft: "ts-13",
    cancel: "ts-15",
    ordered: 50,
    received: 48,
    bundleQty: [40, 30, 80],
    varianceOrdered: 20,
    varianceReceived: 18,
    varianceDamaged: 2,
    paidQty: 24,
    draftQty: 10,
    cancelQty: 12,
    outPending: 10,
    outApproved: 6,
    outPicking: 8,
    outPickingDone: 3,
    outPartial: 6,
    outPartialDone: 4,
    outReady: 10,
    outShipped: 4,
    outRejected: 8,
    outCancelled: 3,
    transferA: 12,
    transferB: 8,
    place: "Quầy",
    branch: "Chi nhánh Q7",
    receiveNote: "Giao 50 phần trân châu, kiểm nhận thực tế 48. Bấm xác nhận để cộng tồn.",
    bundleNote: "Nhập trà sữa, pudding và ly nhựa.",
    varianceNote: "Kem cheese thiếu và 2 phần hỏng, chưa chốt nhập.",
    paidNote: "Nhập trà đào, đã trả NCC.",
    draftNote: "Nháp matcha đá xay, chưa gửi.",
    cancelNote: "Hết combo, đã hủy.",
    samplePurpose: "Pha chế thử",
  },
  "thoi-trang": {
    receive: "tt-01",
    bundle: ["tt-05", "tt-07", "tt-09"],
    variance: "tt-12",
    paid: "tt-06",
    draft: "tt-14",
    cancel: "tt-08",
    ordered: 24,
    received: 22,
    bundleQty: [8, 6, 10],
    varianceOrdered: 10,
    varianceReceived: 8,
    varianceDamaged: 1,
    paidQty: 12,
    draftQty: 4,
    cancelQty: 4,
    outPending: 6,
    outApproved: 2,
    outPicking: 3,
    outPickingDone: 1,
    outPartial: 4,
    outPartialDone: 2,
    outReady: 2,
    outShipped: 1,
    outRejected: 2,
    outCancelled: 1,
    transferA: 3,
    transferB: 2,
    place: "Kho shop",
    branch: "Cửa hàng Q7",
    receiveNote: "Giao 24 áo thun, kiểm nhận thực tế 22. Bấm xác nhận để cộng tồn.",
    bundleNote: "Nhập jean, váy và túi tote.",
    varianceNote: "Sneaker thiếu 2 và 1 đôi lỗi, chưa chốt nhập.",
    paidNote: "Nhập quần short, đã trả NCC.",
    draftNote: "Nháp hoodie, chưa gửi xưởng.",
    cancelNote: "Hết size đầm, đã hủy.",
    samplePurpose: "Hàng mẫu",
  },
  "nha-hang": {
    receive: "nh-01",
    bundle: ["nh-04", "nh-13", "nh-12"],
    variance: "nh-14",
    paid: "nh-06",
    draft: "nh-16",
    cancel: "nh-08",
    ordered: 50,
    received: 48,
    bundleQty: [30, 40, 50],
    varianceOrdered: 20,
    varianceReceived: 18,
    varianceDamaged: 2,
    paidQty: 24,
    draftQty: 10,
    cancelQty: 8,
    outPending: 10,
    outApproved: 6,
    outPicking: 8,
    outPickingDone: 3,
    outPartial: 6,
    outPartialDone: 4,
    outReady: 8,
    outShipped: 4,
    outRejected: 6,
    outCancelled: 2,
    transferA: 8,
    transferB: 6,
    place: "Bếp",
    branch: "Chi nhánh Q7",
    receiveNote: "Giao 50 phần gỏi cuốn, kiểm nhận thực tế 48. Bấm xác nhận để cộng tồn.",
    bundleNote: "Nhập cơm gà, bia và trà đá.",
    varianceNote: "Chè thiếu và 2 phần hỏng, chưa chốt nhập.",
    paidNote: "Nhập phở, đã trả NCC.",
    draftNote: "Nháp set cơm văn phòng, chưa gửi bếp.",
    cancelNote: "Hết cá kho, đã hủy.",
    samplePurpose: "Món thử",
  },
  "tap-hoa": {
    receive: "tp-01",
    bundle: ["tp-04", "tp-07", "tp-12"],
    variance: "tp-09",
    paid: "tp-05",
    draft: "tp-03",
    cancel: "tp-10",
    ordered: 50,
    received: 48,
    bundleQty: [48, 24, 20],
    varianceOrdered: 12,
    varianceReceived: 10,
    varianceDamaged: 1,
    paidQty: 36,
    draftQty: 10,
    cancelQty: 8,
    outPending: 12,
    outApproved: 6,
    outPicking: 8,
    outPickingDone: 3,
    outPartial: 10,
    outPartialDone: 6,
    outReady: 8,
    outShipped: 4,
    outRejected: 6,
    outCancelled: 2,
    transferA: 12,
    transferB: 8,
    place: "Kệ tạp hóa",
    branch: "Cửa hàng Q1",
    receiveNote: "Giao 50 gói mì, kiểm nhận thực tế 48. Bấm xác nhận để cộng tồn.",
    bundleNote: "Nhập nước suối, snack khoai và khăn giấy.",
    varianceNote: "Nước mắm thiếu 2 và 1 chai hỏng, chưa chốt nhập.",
    paidNote: "Nhập lon cola, đã trả NCC.",
    draftNote: "Nháp gạo ST25, chưa gửi sỉ.",
    cancelNote: "Hết dầu ăn, đã hủy.",
    samplePurpose: "Hàng mẫu",
  },
  "dien-thoai": {
    receive: "dt-01",
    bundle: ["dt-09", "dt-10", "dt-11"],
    variance: "dt-05",
    paid: "dt-07",
    draft: "dt-06",
    cancel: "dt-03",
    ordered: 8,
    received: 7,
    bundleQty: [20, 15, 10],
    varianceOrdered: 3,
    varianceReceived: 2,
    varianceDamaged: 1,
    paidQty: 2,
    draftQty: 1,
    cancelQty: 2,
    outPending: 2,
    outApproved: 1,
    outPicking: 2,
    outPickingDone: 1,
    outPartial: 2,
    outPartialDone: 1,
    outReady: 1,
    outShipped: 1,
    outRejected: 1,
    outCancelled: 1,
    transferA: 2,
    transferB: 1,
    place: "Kho máy",
    branch: "Cửa hàng Q5",
    receiveNote: "Giao 8 máy Galaxy A15, kiểm nhận thực tế 7. Bấm xác nhận để cộng tồn.",
    bundleNote: "Nhập ốp lưng, cáp Type-C và tai nghe.",
    varianceNote: "Laptop Dell thiếu 1 và 1 máy lỗi, chưa chốt nhập.",
    paidNote: "Nhập Asus Vivobook, đã trả NCC.",
    draftNote: "Nháp MacBook Air, chưa gửi nhà phân phối.",
    cancelNote: "Hết Redmi Note 13, đã hủy.",
    samplePurpose: "Máy trưng bày",
  },
};

function buildDemoPack(products: Product[], suppliers: Supplier[], users: User[]) {
  const key = verticalKey(products);
  const profile = PROFILES[key];
  const receive = byId(products, profile.receive);
  const bundle = profile.bundle.map((id) => byId(products, id));
  const variance = byId(products, profile.variance);
  const paid = byId(products, profile.paid);
  const draft = byId(products, profile.draft);
  const cancel = byId(products, profile.cancel);
  const receiveSup = supplierOf(suppliers, receive);
  if (!receive || !receiveSup) return null;

  const staff = staffFromUsers(users);
  const sup = (product: Product) => supplierOf(suppliers, product) ?? receiveSup;

  const purchases: PurchaseOrder[] = [
    {
      id: "po_nk89",
      code: "NK00089",
      supplierId: receiveSup.id,
      supplierName: receiveSup.name,
      status: "awaiting_receive",
      expectedAt: new Date().toISOString().slice(0, 10),
      createdAt: daysAgo(0, 9),
      createdBy: staff.warehouse,
      note: profile.receiveNote,
      payLater: true,
      lines: [buyLine(receive, profile.ordered, profile.received, 0)],
    },
    {
      id: "po_nk76",
      code: "NK00076",
      supplierId: sup(bundle[0]).id,
      supplierName: sup(bundle[0]).name,
      status: "done",
      expectedAt: daysAgo(4).slice(0, 10),
      createdAt: daysAgo(6, 8),
      createdBy: staff.warehouse,
      receivedBy: staff.warehouse,
      receivedAt: daysAgo(4, 15),
      note: profile.bundleNote,
      payLater: true,
      lines: [
        buyLine(bundle[0], profile.bundleQty[0], profile.bundleQty[0]),
        buyLine(bundle[1], profile.bundleQty[1], profile.bundleQty[1]),
        buyLine(bundle[2], profile.bundleQty[2], profile.bundleQty[2]),
      ],
    },
    {
      id: "po_nk81",
      code: "NK00081",
      supplierId: sup(variance).id,
      supplierName: sup(variance).name,
      status: "variance",
      expectedAt: daysAgo(1).slice(0, 10),
      createdAt: daysAgo(2, 11),
      createdBy: staff.cashier,
      note: profile.varianceNote,
      payLater: true,
      lines: [
        buyLine(
          variance,
          profile.varianceOrdered,
          profile.varianceReceived,
          profile.varianceDamaged,
        ),
      ],
    },
    {
      id: "po_nk64",
      code: "NK00064",
      supplierId: sup(paid).id,
      supplierName: sup(paid).name,
      status: "done",
      expectedAt: daysAgo(10).slice(0, 10),
      createdAt: daysAgo(12, 9),
      createdBy: staff.warehouse,
      receivedBy: staff.manager,
      receivedAt: daysAgo(10, 16),
      note: profile.paidNote,
      payLater: false,
      lines: [buyLine(paid, profile.paidQty, profile.paidQty)],
    },
    {
      id: "po_nk92",
      code: "NK00092",
      supplierId: sup(draft).id,
      supplierName: sup(draft).name,
      status: "draft",
      expectedAt: daysAgo(-3).slice(0, 10),
      createdAt: daysAgo(0, 14),
      createdBy: staff.owner,
      note: profile.draftNote,
      payLater: true,
      lines: [buyLine(draft, profile.draftQty, profile.draftQty)],
    },
    {
      id: "po_nk55",
      code: "NK00055",
      supplierId: sup(cancel).id,
      supplierName: sup(cancel).name,
      status: "cancelled",
      expectedAt: daysAgo(8).slice(0, 10),
      createdAt: daysAgo(9, 10),
      createdBy: staff.warehouse,
      note: profile.cancelNote,
      payLater: true,
      lines: [buyLine(cancel, profile.cancelQty, 0)],
    },
  ];

  const outbounds: OutboundOrder[] = [
    {
      id: "ob_121",
      code: "XK00121",
      requester: staff.cashier,
      purpose: "Bán hàng",
      destination: profile.place,
      note: "Chờ quản lý duyệt.",
      status: "pending",
      createdAt: daysAgo(0, 11),
      lines: [shipLine(receive, profile.outPending, 0)],
    },
    {
      id: "ob_124",
      code: "XK00124",
      requester: staff.cashier,
      purpose: "Bán hàng",
      destination: profile.place,
      note: "",
      status: "approved",
      createdAt: daysAgo(1, 9),
      approvedBy: staff.manager,
      approvedAt: daysAgo(1, 10),
      lines: [shipLine(bundle[0], profile.outApproved, 0)],
    },
    {
      id: "ob_126",
      code: "XK00126",
      requester: staff.warehouse,
      purpose: "Nội bộ",
      destination: profile.place,
      note: "Đang soạn.",
      status: "picking",
      createdAt: daysAgo(1, 14),
      approvedBy: staff.owner,
      approvedAt: daysAgo(1, 15),
      lines: [shipLine(bundle[1], profile.outPicking, profile.outPickingDone)],
    },
    {
      id: "ob_128",
      code: "XK00128",
      requester: staff.cashier,
      purpose: "Bán hàng",
      destination: "Khách tại quầy",
      note: "Thiếu so với yêu cầu.",
      status: "partial",
      createdAt: daysAgo(2, 16),
      approvedBy: staff.manager,
      approvedAt: daysAgo(2, 17),
      lines: [shipLine(variance, profile.outPartial, profile.outPartialDone)],
    },
    {
      id: "ob_119",
      code: "XK00119",
      requester: staff.warehouse,
      purpose: "Chuyển kho",
      destination: profile.branch,
      note: "Đã soạn đủ, chờ bàn giao.",
      status: "ready",
      createdAt: daysAgo(2, 8),
      approvedBy: staff.owner,
      approvedAt: daysAgo(2, 9),
      lines: [shipLine(paid, profile.outReady, profile.outReady)],
    },
    {
      id: "ob_112",
      code: "XK00112",
      requester: staff.cashier,
      purpose: "Bán hàng",
      destination: profile.place,
      note: "Đã xuất hôm trước.",
      status: "shipped",
      createdAt: daysAgo(5, 9),
      approvedBy: staff.manager,
      approvedAt: daysAgo(5, 10),
      shippedBy: staff.warehouse,
      shippedAt: daysAgo(5, 16),
      lines: [shipLine(bundle[0], profile.outShipped, profile.outShipped)],
    },
    {
      id: "ob_110",
      code: "XK00110",
      requester: staff.cashier,
      purpose: profile.samplePurpose,
      destination: profile.branch,
      note: "Không duyệt đợt này.",
      status: "rejected",
      createdAt: daysAgo(3, 11),
      lines: [shipLine(draft, profile.outRejected, 0)],
    },
    {
      id: "ob_108",
      code: "XK00108",
      requester: staff.warehouse,
      purpose: "Khác",
      destination: profile.place,
      note: "Khách hủy.",
      status: "cancelled",
      createdAt: daysAgo(7, 13),
      lines: [shipLine(cancel, profile.outCancelled, 0)],
    },
  ];

  const transfers: StockTransfer[] = [
    {
      id: "tf_01",
      code: "CK1042",
      from: "Kho tổng",
      to: profile.place,
      productId: bundle[0].id,
      name: bundle[0].name,
      qty: profile.transferA,
      status: "received",
      createdAt: daysAgo(6, 10),
      createdBy: staff.warehouse,
    },
    {
      id: "tf_02",
      code: "CK1048",
      from: profile.place,
      to: profile.branch,
      productId: paid.id,
      name: paid.name,
      qty: profile.transferB,
      status: "transit",
      createdAt: daysAgo(1, 17),
      createdBy: staff.warehouse,
    },
  ];

  const damaged: Record<string, number> = {
    [variance.id]: profile.varianceDamaged,
  };

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
      ensureDemo: (products, suppliers, users) => {
        if (!products.length || !suppliers.length || !users.length) return;
        if (get().demoVersion >= DEMO_VERSION) return;
        const pack = buildDemoPack(products, suppliers, users);
        if (!pack) return;
        const merge = <T extends { code: string; status: string }>(
          current: T[],
          incoming: T[],
        ) => {
          const byCode = new Map(current.map((row) => [row.code, row]));
          const refreshed = incoming.map((row) => {
            const old = byCode.get(row.code);
            if (!old || old.status === row.status) return row;
            return old;
          });
          const incomingCodes = new Set(incoming.map((row) => row.code));
          return [
            ...refreshed,
            ...current.filter((row) => !incomingCodes.has(row.code)),
          ];
        };
        const damaged = { ...pack.damaged };
        for (const [id, qty] of Object.entries(get().damaged)) {
          if (!(id in pack.damaged) && qty > 0) damaged[id] = qty;
        }
        set({
          purchases: merge(get().purchases, pack.purchases),
          outbounds: merge(get().outbounds, pack.outbounds),
          transfers: merge(get().transfers, pack.transfers),
          damaged,
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
