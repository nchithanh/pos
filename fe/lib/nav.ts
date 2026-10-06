import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Tags,
  Warehouse,
  UsersRound,
  Truck,
  Wallet,
  BarChart3,
  Users,
  Settings,
  ArrowLeftRight,
  Receipt,
  PieChart,
  Landmark,
  LineChart,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionKey;
  mobilePrimary?: boolean;
  /** Nhãn ngắn trên thanh dưới mobile */
  mobileLabel?: string;
  badgeTodayOrders?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "Tổng quan",
    items: [
      {
        href: "/",
        label: "Tổng quan",
        icon: LayoutDashboard,
        mobilePrimary: true,
      },
    ],
  },
  {
    id: "sales",
    label: "Bán hàng",
    items: [
      {
        href: "/ban-hang",
        label: "Bán hàng",
        icon: ShoppingCart,
        permission: "ban-hang",
        mobilePrimary: true,
      },
      {
        href: "/don-hang",
        label: "Đơn hàng",
        icon: ClipboardList,
        permission: "ban-hang",
        badgeTodayOrders: true,
      },
    ],
  },
  {
    id: "stock",
    label: "Hàng hóa & kho",
    items: [
      {
        href: "/san-pham",
        label: "Sản phẩm",
        icon: Package,
        permission: "san-pham",
      },
      {
        href: "/danh-muc",
        label: "Danh mục",
        icon: Tags,
        permission: "san-pham",
      },
      {
        href: "/kho",
        label: "Kho",
        icon: Warehouse,
        permission: "kho",
        mobilePrimary: true,
        mobileLabel: "Kho",
      },
      {
        href: "/nha-cung-cap",
        label: "Nhà cung cấp",
        icon: Truck,
        permission: "nha-cung-cap",
      },
    ],
  },
  {
    id: "finance",
    label: "Tài chính",
    items: [
      {
        href: "/finance",
        label: "Tổng quan",
        mobileLabel: "Tài chính",
        icon: LayoutDashboard,
        permission: "doanh-thu",
        mobilePrimary: true,
      },
      {
        href: "/finance/cash-flow",
        label: "Dòng tiền",
        icon: ArrowLeftRight,
        permission: "doanh-thu",
      },
      {
        href: "/finance/revenue",
        label: "Doanh thu",
        icon: BarChart3,
        permission: "doanh-thu",
      },
      {
        href: "/finance/expenses",
        label: "Chi phí",
        icon: Receipt,
        permission: "doanh-thu",
      },
      {
        href: "/finance/debts",
        label: "Công nợ",
        icon: Wallet,
        permission: "cong-no",
      },
      {
        href: "/finance/accounts",
        label: "Quỹ & Tài khoản",
        icon: Landmark,
        permission: "doanh-thu",
      },
      {
        href: "/finance/profit",
        label: "Lợi nhuận",
        icon: PieChart,
        permission: "doanh-thu",
      },
      {
        href: "/finance/shifts",
        label: "Ca & Đối soát",
        icon: ClipboardList,
        permission: "doanh-thu",
      },
      {
        href: "/finance/reports",
        label: "Báo cáo",
        icon: LineChart,
        permission: "doanh-thu",
      },
      {
        href: "/finance/forecast",
        label: "Dự báo & Cảnh báo",
        icon: Bell,
        permission: "doanh-thu",
      },
    ],
  },
  {
    id: "crm",
    label: "Khách hàng",
    items: [
      {
        href: "/khach-hang",
        label: "Khách hàng",
        icon: UsersRound,
        permission: "khach-hang",
      },
    ],
  },
  {
    id: "admin",
    label: "Quản trị",
    items: [
      {
        href: "/nhan-vien",
        label: "Nhân viên",
        icon: Users,
        permission: "nhan-vien",
      },
      {
        href: "/cai-dat",
        label: "Cài đặt",
        icon: Settings,
        permission: "cai-dat",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function isNavActive(href: string, pathname: string) {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (href === "/" || href === "/finance") return path === href;
  if (href === "/kho") return path === "/kho" || path.startsWith("/kho/");
  return path === href || path.startsWith(`${href}/`);
}
