import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  UsersRound,
  Truck,
  Wallet,
  BarChart3,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionKey;
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, mobilePrimary: true },
  { href: "/ban-hang", label: "Bán hàng", icon: ShoppingCart, permission: "ban-hang", mobilePrimary: true },
  { href: "/san-pham", label: "Sản phẩm", icon: Package, permission: "san-pham", mobilePrimary: true },
  { href: "/kho", label: "Kho", icon: Warehouse, permission: "kho", mobilePrimary: true },
  { href: "/khach-hang", label: "Khách hàng", icon: UsersRound, permission: "khach-hang" },
  { href: "/nha-cung-cap", label: "Nhà cung cấp", icon: Truck, permission: "nha-cung-cap" },
  { href: "/cong-no", label: "Công nợ", icon: Wallet, permission: "cong-no" },
  { href: "/doanh-thu", label: "Doanh thu", icon: BarChart3, permission: "doanh-thu" },
  { href: "/nhan-vien", label: "Nhân viên", icon: Users, permission: "nhan-vien" },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings, permission: "cai-dat" },
];
