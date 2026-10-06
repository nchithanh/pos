export type Role = "owner" | "manager" | "cashier";
export type UserStatus = "active" | "inactive";
export type StockStatus = "in_stock" | "low" | "out";
export type PaymentMethod = "cash" | "transfer" | "qr" | "split" | "debt";
export type DebtType = "receivable" | "payable";
export type DebtStatus = "unpaid" | "partial" | "paid" | "overdue";
export type MovementType = "in" | "out" | "adjust" | "sale" | "return";
export type StoreVertical = "pet" | "cafe" | "clothing" | "general";

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

export interface StoreSettings {
  id: string;
  name: string;
  slogan: string;
  vertical: StoreVertical;
  address: string;
  phone: string;
  taxRate: number;
  currency: "VND";
  receiptWidth: 58 | 80;
  logoEmoji: string;
  theme: "light" | "dark" | "system";
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

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  customerId?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments: PaymentSplit[];
  cashReceived?: number;
  changeDue?: number;
  note?: string;
  status: "paid" | "debt" | "void";
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
  items: { productId: string; quantity: number; unitCost?: number }[];
  totalCost: number;
}

export interface Debt {
  id: string;
  type: DebtType;
  partyName: string;
  partyId: string;
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
