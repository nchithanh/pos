export type PurchaseStatus =
  | "draft"
  | "awaiting_receive"
  | "receiving"
  | "variance"
  | "done"
  | "cancelled";

export type OutboundStatus =
  | "pending"
  | "approved"
  | "picking"
  | "partial"
  | "ready"
  | "shipped"
  | "rejected"
  | "cancelled";

export interface PurchaseLine {
  productId: string;
  name: string;
  sku: string;
  ordered: number;
  received: number;
  damaged: number;
  cost: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseStatus;
  expectedAt: string;
  createdAt: string;
  createdBy: string;
  note: string;
  lines: PurchaseLine[];
  receivedBy?: string;
  receivedAt?: string;
  payLater: boolean;
}

export interface OutboundLine {
  productId: string;
  name: string;
  sku: string;
  requested: number;
  picked: number;
}

export interface OutboundOrder {
  id: string;
  code: string;
  requester: string;
  purpose: string;
  destination: string;
  note: string;
  status: OutboundStatus;
  createdAt: string;
  lines: OutboundLine[];
  approvedBy?: string;
  approvedAt?: string;
  shippedBy?: string;
  shippedAt?: string;
}

export interface StockTransfer {
  id: string;
  code: string;
  from: string;
  to: string;
  productId: string;
  name: string;
  qty: number;
  status: "draft" | "approved" | "transit" | "received";
  createdAt: string;
  createdBy: string;
}

export const PURCHASE_LABEL: Record<PurchaseStatus, string> = {
  draft: "Nháp",
  awaiting_receive: "Chờ kiểm nhận",
  receiving: "Đang kiểm nhận",
  variance: "Có sai lệch",
  done: "Hoàn tất",
  cancelled: "Đã hủy",
};

export const OUTBOUND_LABEL: Record<OutboundStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  picking: "Đang soạn",
  partial: "Đã soạn một phần",
  ready: "Chờ bàn giao",
  shipped: "Đã xuất",
  rejected: "Từ chối",
  cancelled: "Hủy",
};
