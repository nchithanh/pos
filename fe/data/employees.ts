import type { Employee, PermissionKey } from "@/lib/types";

const allOn = (): Record<PermissionKey, boolean> => ({
  "ban-hang": true,
  "san-pham": true,
  kho: true,
  "nha-cung-cap": true,
  "cong-no": true,
  "doanh-thu": true,
  "nhan-vien": true,
});

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "e-01",
    name: "Nguyễn Thị Hương",
    email: "huong@petdolphinstore.vn",
    phone: "0901 111 222",
    role: "owner",
    status: "active",
    avatarColor: "#22C55E",
    permissions: allOn(),
  },
  {
    id: "e-02",
    name: "Trần Minh Quân",
    email: "quan@petdolphinstore.vn",
    phone: "0902 333 444",
    role: "manager",
    status: "active",
    avatarColor: "#3B82F6",
    permissions: {
      "ban-hang": true,
      "san-pham": true,
      kho: true,
      "nha-cung-cap": true,
      "cong-no": true,
      "doanh-thu": true,
      "nhan-vien": false,
    },
  },
  {
    id: "e-03",
    name: "Lê Lan Anh",
    email: "lananh@petdolphinstore.vn",
    phone: "0903 555 666",
    role: "cashier",
    status: "active",
    avatarColor: "#F59E0B",
    permissions: {
      "ban-hang": true,
      "san-pham": true,
      kho: false,
      "nha-cung-cap": false,
      "cong-no": false,
      "doanh-thu": false,
      "nhan-vien": false,
    },
  },
  {
    id: "e-04",
    name: "Phạm Đức Thành",
    email: "thanh@petdolphinstore.vn",
    phone: "0904 777 888",
    role: "warehouse",
    status: "active",
    avatarColor: "#8B5CF6",
    permissions: {
      "ban-hang": false,
      "san-pham": true,
      kho: true,
      "nha-cung-cap": true,
      "cong-no": false,
      "doanh-thu": false,
      "nhan-vien": false,
    },
  },
  {
    id: "e-05",
    name: "Võ Bảo Ngọc",
    email: "ngoc@petdolphinstore.vn",
    phone: "0905 999 000",
    role: "cashier",
    status: "inactive",
    avatarColor: "#94A3B8",
    permissions: {
      "ban-hang": true,
      "san-pham": false,
      kho: false,
      "nha-cung-cap": false,
      "cong-no": false,
      "doanh-thu": false,
      "nhan-vien": false,
    },
  },
];

export const ROLE_LABELS: Record<Employee["role"], string> = {
  owner: "Chủ cửa hàng",
  manager: "Quản lý",
  cashier: "Nhân viên bán hàng",
  warehouse: "Nhân viên kho",
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "ban-hang": "Bán hàng",
  "san-pham": "Sản phẩm",
  kho: "Kho",
  "nha-cung-cap": "Nhà cung cấp",
  "cong-no": "Công nợ",
  "doanh-thu": "Doanh thu",
  "nhan-vien": "Nhân viên",
};
