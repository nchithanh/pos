import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Wallet,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, mobilePrimary: true },
  { href: "/ban-hang", label: "Bán hàng", icon: ShoppingCart, mobilePrimary: true },
  { href: "/san-pham", label: "Sản phẩm", icon: Package, mobilePrimary: true },
  { href: "/kho", label: "Kho", icon: Warehouse, mobilePrimary: true },
  { href: "/nha-cung-cap", label: "Nhà cung cấp", icon: Truck },
  { href: "/cong-no", label: "Công nợ", icon: Wallet },
  { href: "/doanh-thu", label: "Doanh thu", icon: BarChart3 },
  { href: "/nhan-vien", label: "Nhân viên", icon: Users },
];

export const MOBILE_NAV = NAV_ITEMS.filter((n) => n.mobilePrimary);
