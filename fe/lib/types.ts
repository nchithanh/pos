export type CategoryId =
  | "all"
  | "thuc-an"
  | "cat-ve-sinh"
  | "pate"
  | "snack"
  | "do-choi"
  | "cham-soc"
  | "phu-kien";

export type StockStatus = "in_stock" | "low" | "out";
export type PaymentMethod = "cash" | "transfer" | "qr";
export type DebtStatus = "unpaid" | "partial" | "paid" | "overdue";
export type DebtType = "receivable" | "payable";
export type EmployeeRole =
  | "owner"
  | "manager"
  | "cashier"
  | "warehouse";
export type EmployeeStatus = "active" | "inactive";

export type PermissionKey =
  | "ban-hang"
  | "san-pham"
  | "kho"
  | "nha-cung-cap"
  | "cong-no"
  | "doanh-thu"
  | "nhan-vien";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: Exclude<CategoryId, "all">;
  sellPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  supplierId: string;
  imageColor: string;
  emoji: string;
  active: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  items: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  customerName?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  productCount: number;
  totalPurchased: number;
  debt: number;
  contactPerson: string;
}

export interface StockInRecord {
  id: string;
  code: string;
  supplierId: string;
  createdAt: string;
  items: { productId: string; quantity: number; costPrice: number }[];
  total: number;
  note: string;
}

export interface StockOutRecord {
  id: string;
  code: string;
  createdAt: string;
  items: { productId: string; quantity: number }[];
  reason: string;
  note: string;
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
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  avatarColor: string;
  permissions: Record<PermissionKey, boolean>;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  lastPurchaseAt: string;
  group: string;
  visitCount: number;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  lowStockCount: number;
  receivable: number;
  payable: number;
  revenue7Days: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: string; name: string; sold: number; revenue: number }[];
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
