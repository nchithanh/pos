export type Role = "owner" | "manager" | "cashier";
export type UserStatus = "active" | "inactive";
export type StockStatus = "in_stock" | "low" | "out";
export type PaymentMethod = "cash" | "transfer" | "qr" | "split" | "debt";
export type DebtType = "receivable" | "payable";
export type DebtStatus = "unpaid" | "partial" | "paid" | "overdue";
export type MovementType = "in" | "out" | "adjust" | "sale" | "return";
export type StoreVertical =
  | "pet"
  | "cafe"
  | "tra-sua"
  | "thoi-trang"
  | "nha-hang"
  /** legacy — map → thoi-trang khi seed */
  | "clothing"
  | "general";

export type PermissionKey =
  | "ban-hang"
  | "san-pham"
  | "kho"
  | "khach-hang"
  | "nha-cung-cap"
  | "cong-no"
  | "doanh-thu"
  | "nhan-vien"
  | "cai-dat";

/** Mock SePay-style e-invoice account config (admin settings). */
export interface EInvoiceConfig {
  provider: "sepay" | "none";
  /** simulator = docs contract local; sandbox = TODO real API when có credential */
  mode: "simulator" | "sandbox";
  connected: boolean;
  /** Mock provider_account_id */
  providerAccountId: string;
  accountLabel: string;
  invoiceTemplateId: string;
  invoiceTemplateLabel: string;
  /** Must be chosen from account options (e.g. C26TSE), not free-typed */
  invoiceSeries: string;
  /** Mock seller_store_xid */
  sellerStoreXid: string;
  storeLabel: string;
  lastCheckedAt?: string;
  /** Placeholder — không dùng trên client static Pages */
  sandboxClientId?: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  slogan: string;
  vertical: StoreVertical;
  address: string;
  phone: string;
  email?: string;
  /** Tên pháp nhân (hiển thị nội bộ) — ≠ tài khoản HĐĐT provider */
  legalName?: string;
  /** MST cửa hàng (thông tin Dolphin) — không dùng làm MST phát hành HĐ */
  taxCode?: string;
  billFooter?: string;
  taxRate: number;
  currency: "VND";
  receiptWidth: 58 | 80;
  logoEmoji: string;
  theme: "light" | "dark" | "system";
  eInvoice?: EInvoiceConfig;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  pin: string;
  password: string;
  avatarColor: string;
  permissions: Record<PermissionKey, boolean>;
  createdAt: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  note?: string;
  status: "open" | "closed";
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  sort: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brand?: string;
  sellPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  supplierId?: string;
  imageColor: string;
  emoji: string;
  /** URL ảnh sản phẩm (tùy chọn) — placeholder emoji nếu trống */
  imageUrl?: string;
  active: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  group: string;
  points: number;
  totalSpent: number;
  visitCount: number;
  lastPurchaseAt?: string;
  debt: number;
  note?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  productCount: number;
  totalPurchased: number;
  debt: number;
  createdAt: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
  note?: string;
  discountPercent?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountPercent: number;
  note?: string;
  lineTotal: number;
}

export interface PaymentSplit {
  method: Exclude<PaymentMethod, "split">;
  amount: number;
}

/** Mock electronic invoice issued in prototype (not a legal e-invoice). */
export interface EInvoiceMock {
  number: string;
  issuedAt: string;
  customerType: "individual" | "business";
  companyName: string;
  taxCode: string;
  address: string;
  email: string;
  provider?: "sepay";
  invoiceSeries?: string;
  invoiceTemplateLabel?: string;
  storeLabel?: string;
  accountLabel?: string;
  /** SePay-style tracking (simulator / sandbox) */
  trackingCode?: string;
  trackingUrl?: string;
  status?: "draft" | "processing" | "issued" | "failed";
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments: PaymentSplit[];
  cashReceived?: number;
  changeDue?: number;
  /** Điểm khách đã đổi (1 điểm = 1.000đ) */
  pointsRedeemed?: number;
  note?: string;
  status: "paid" | "debt" | "void";
  eInvoice?: EInvoiceMock;
}

export interface HeldCart {
  id: string;
  name: string;
  createdAt: string;
  customerId?: string;
  items: CartLine[];
  discount: number;
  note?: string;
}

export interface InventoryMovement {
  id: string;
  code: string;
  type: MovementType;
  createdAt: string;
  userId: string;
  userName: string;
  supplierId?: string;
  reason?: string;
  note?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost?: number;
    /** HSD (YYYY-MM-DD) — tùy chọn trên phiếu nhập */
    expiryDate?: string;
  }[];
  totalCost: number;
}

export interface Debt {
  id: string;
  type: DebtType;
  partyName: string;
  partyId: string;
  /** SĐT đối tác — lưu sẵn hoặc lookup từ KH/NCC */
  partyPhone?: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: DebtStatus;
  note: string;
  createdAt: string;
  orderId?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  method: PaymentMethod;
  createdAt: string;
  userId: string;
  note?: string;
}

export interface Meta {
  key: string;
  value: string;
}
