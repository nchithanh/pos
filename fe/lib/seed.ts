import { format as dfFormat, subDays, setHours, setMinutes } from "date-fns";
import { db } from "@/lib/db";
import { DEFAULT_EINVOICE_CONFIG } from "@/lib/einvoice-config";
import type {
  Category,
  Customer,
  Debt,
  DebtPayment,
  Order,
  PermissionKey,
  Product,
  StoreSettings,
  Supplier,
  User,
} from "@/types";

function atDaysAgo(days: number, hour: number, minute = 0): string {
  const d = setMinutes(setHours(subDays(new Date(), days), hour), minute);
  return d.toISOString();
}

function demoOrderCode(seq: number, daysAgo: number): string {
  const d = subDays(new Date(), daysAgo);
  return `DH-${dfFormat(d, "ddMMyy")}-${String(seq).padStart(3, "0")}`;
}

function line(
  productId: string,
  productName: string,
  sku: string,
  quantity: number,
  unitPrice: number,
  costPrice: number,
) {
  return {
    productId,
    productName,
    sku,
    quantity,
    unitPrice,
    costPrice,
    discountPercent: 0,
    lineTotal: unitPrice * quantity,
  };
}

/** Đơn mẫu 7 ngày — luôn neo theo “hôm nay” để Dashboard có chart */
function buildDemoOrders(): Order[] {
  const mk = (
    seq: number,
    daysAgo: number,
    hour: number,
    items: Order["items"],
    paymentMethod: Order["paymentMethod"],
    opts?: {
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      discount?: number;
      cashier?: "Lan Anh" | "Minh Quân";
      eInvoice?: Order["eInvoice"];
    },
  ): Order => {
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const discount = opts?.discount ?? 0;
    const total = subtotal - discount;
    const cashierName = opts?.cashier ?? "Lê Lan Anh";
    const cashierId = cashierName.includes("Quân") ? "u_manager" : "u_cashier";
    return {
      id: `o-seed-${seq}`,
      code: demoOrderCode(seq, daysAgo),
      createdAt: atDaysAgo(daysAgo, hour, seq % 50),
      cashierId,
      cashierName,
      customerId: opts?.customerId,
      customerName: opts?.customerName,
      customerPhone: opts?.customerPhone,
      customerEmail: opts?.customerEmail,
      items,
      subtotal,
      discount,
      tax: 0,
      total,
      paymentMethod,
      payments: [{ method: paymentMethod === "split" ? "cash" : paymentMethod, amount: total }],
      cashReceived: paymentMethod === "cash" ? total + 20000 : undefined,
      changeDue: paymentMethod === "cash" ? 20000 : undefined,
      status: "paid",
      eInvoice: opts?.eInvoice,
    };
  };

  return [
    // Hôm nay — doanh thu ~8tr+
    mk(42, 0, 9, [line("p-07", "Cát vệ sinh Catsan 10L", "CAT-CSN-10", 2, 185000, 125000), line("p-12", "Pate Whiskas vị cá ngừ 85g", "PT-WHK-TUNA", 6, 18000, 11000)], "qr", {
      customerId: "cus-01",
      customerName: "Nguyễn Văn A",
      customerPhone: "0901234567",
      eInvoice: {
        number: "00001234",
        issuedAt: atDaysAgo(0, 9, 15),
        customerType: "business",
        companyName: "Công ty TNHH Pet Care A",
        taxCode: "0312345678",
        address: "12 Nguyễn Văn A, Q.7, TP.HCM",
        email: "accounting@petcare-a.vn",
      },
    }),
    mk(41, 0, 10, [line("p-01", "Royal Canin Indoor 2kg", "RC-IND-2KG", 1, 385000, 295000)], "cash"),
    mk(40, 0, 11, [line("p-25", "Sữa tắm SOS trị ve", "CS-SOS-500", 1, 145000, 95000), line("p-30", "Vòng cổ da có chuông", "AC-COL-01", 1, 75000, 38000), line("p-17", "Snack xương sữa Pedigree", "SN-PDG-MILK", 2, 55000, 36000)], "transfer", {
      customerId: "cus-03",
      customerName: "Lê Thị Cẩm",
      customerPhone: "0903456789",
      customerEmail: "cam.le@email.com",
      discount: 10000,
      cashier: "Minh Quân",
      eInvoice: {
        number: "00001233",
        issuedAt: atDaysAgo(0, 11, 20),
        customerType: "individual",
        companyName: "Lê Thị Cẩm",
        taxCode: "0311122233",
        address: "TP.HCM",
        email: "cam.le@email.com",
      },
    }),
    mk(39, 0, 12, [line("p-03", "Pedigree Adult 1.5kg", "PDG-ADT-15", 2, 165000, 118000), line("p-23", "Đồ chơi gặm xương nylon", "TY-CHEW-01", 1, 85000, 48000)], "cash"),
    mk(38, 0, 13, [line("p-09", "Cát đậu nành Tofu 6L", "CAT-TOF-6", 3, 135000, 88000), line("p-16", "Pate Ciao Churu mix 20 thanh", "PT-CIAO-20", 1, 165000, 118000)], "qr", { customerId: "cus-04", customerName: "Phạm Đức D", discount: 20000 }),
    mk(37, 0, 14, [line("p-36", "Royal Canin Urinary 1.5kg", "RC-URI-15", 1, 520000, 395000), line("p-18", "Snack cá khô cho mèo 50g", "SN-FISH-50", 3, 42000, 26000)], "transfer"),
    mk(36, 0, 15, [line("p-05", "Me-O Adult Seafood 1.2kg", "MEO-SEA-12", 2, 112000, 78000), line("p-11", "Cát bentonite hương lavender", "CAT-BNL-10", 4, 78000, 48000), line("p-38", "Pate Sheba vị tôm 70g", "PT-SHE-70", 10, 22000, 14000)], "cash", { cashier: "Minh Quân" }),
    mk(35, 0, 16, [line("p-41", "Máy lọc nước thú cưng", "AC-FOUNT-01", 1, 590000, 380000), line("p-32", "Bát ăn inox đôi", "AC-BOWL-02", 1, 95000, 52000)], "qr", { customerId: "cus-03", customerName: "Lê Thị Cẩm", discount: 35000 }),
    mk(34, 0, 16, [line("p-07", "Cát vệ sinh Catsan 10L", "CAT-CSN-10", 3, 185000, 125000)], "cash"),
    mk(33, 0, 17, [line("p-14", "Pate Royal Canin Instinctive", "PT-RC-INS", 8, 32000, 22000), line("p-02", "Royal Canin Kitten 400g", "RC-KIT-400", 2, 125000, 92000)], "transfer"),
    // 1–6 ngày trước
    mk(32, 1, 10, [line("p-07", "Cát vệ sinh Catsan 10L", "CAT-CSN-10", 4, 185000, 125000), line("p-12", "Pate Whiskas vị cá ngừ 85g", "PT-WHK-TUNA", 12, 18000, 11000)], "qr"),
    mk(31, 1, 14, [line("p-01", "Royal Canin Indoor 2kg", "RC-IND-2KG", 2, 385000, 295000), line("p-21", "Bóng cao su có chuông", "TY-BALL-01", 2, 35000, 18000)], "cash", { cashier: "Minh Quân" }),
    mk(30, 1, 16, [line("p-03", "Pedigree Adult 1.5kg", "PDG-ADT-15", 3, 165000, 118000)], "transfer"),
    mk(29, 2, 11, [line("p-09", "Cát đậu nành Tofu 6L", "CAT-TOF-6", 5, 135000, 88000)], "cash"),
    mk(28, 2, 15, [line("p-36", "Royal Canin Urinary 1.5kg", "RC-URI-15", 1, 520000, 395000), line("p-28", "Thuốc nhỏ gáy Frontline", "CS-FTL-01", 2, 210000, 155000)], "qr", { customerId: "cus-02", customerName: "Trần Văn B" }),
    mk(27, 3, 10, [line("p-06", "Zenith Holistic Dog 2kg", "ZEN-HOL-2", 2, 420000, 310000), line("p-17", "Snack xương sữa Pedigree", "SN-PDG-MILK", 4, 55000, 36000)], "transfer"),
    mk(26, 3, 16, [line("p-07", "Cát vệ sinh Catsan 10L", "CAT-CSN-10", 6, 185000, 125000), line("p-15", "Pate Me-O Creamy 4 thanh", "PT-MEO-CRM", 3, 45000, 30000)], "cash"),
    mk(25, 4, 12, [line("p-41", "Máy lọc nước thú cưng", "AC-FOUNT-01", 1, 590000, 380000)], "qr", { customerId: "cus-04", customerName: "Phạm Đức D" }),
    mk(24, 4, 15, [line("p-05", "Me-O Adult Seafood 1.2kg", "MEO-SEA-12", 4, 112000, 78000), line("p-11", "Cát bentonite hương lavender", "CAT-BNL-10", 5, 78000, 48000)], "cash", { cashier: "Minh Quân" }),
    mk(23, 5, 11, [line("p-01", "Royal Canin Indoor 2kg", "RC-IND-2KG", 3, 385000, 295000)], "transfer"),
    mk(22, 5, 14, [line("p-03", "Pedigree Adult 1.5kg", "PDG-ADT-15", 2, 165000, 118000), line("p-25", "Sữa tắm SOS trị ve", "CS-SOS-500", 2, 145000, 95000)], "cash"),
    mk(21, 6, 10, [line("p-07", "Cát vệ sinh Catsan 10L", "CAT-CSN-10", 3, 185000, 125000), line("p-12", "Pate Whiskas vị cá ngừ 85g", "PT-WHK-TUNA", 20, 18000, 11000)], "qr"),
    mk(20, 6, 16, [line("p-09", "Cát đậu nành Tofu 6L", "CAT-TOF-6", 2, 135000, 88000), line("p-33", "Nhà vệ sinh kín size L", "AC-LITBOX-L", 1, 450000, 280000)], "transfer", { customerId: "cus-01", customerName: "Nguyễn Văn A", discount: 30000 }),
  ];
}

const allPerms = (on = true): Record<PermissionKey, boolean> => ({
  "ban-hang": on,
  "san-pham": on,
  kho: on,
  "khach-hang": on,
  "nha-cung-cap": on,
  "cong-no": on,
  "doanh-thu": on,
  "nhan-vien": on,
  "cai-dat": on,
});

const SETTINGS: StoreSettings = {
  id: "store",
  name: "Pet Dolphin Store",
  slogan: "Pet shop & cafe",
  vertical: "pet",
  address: "12 Nguyễn Thị Minh Khai, Q.1, TP.HCM",
  phone: "028 3822 5566",
  email: "hello@petdolphin.vn",
  legalName: "CÔNG TY TNHH PET DOLPHIN",
  taxCode: "0312345678",
  billFooter: "Cảm ơn quý khách! Hẹn gặp lại lần sau",
  taxRate: 0,
  currency: "VND",
  receiptWidth: 80,
  logoEmoji: "🐬",
  theme: "light",
  eInvoice: { ...DEFAULT_EINVOICE_CONFIG },
  updatedAt: new Date().toISOString(),
};

const USERS: User[] = [
  {
    id: "u_owner",
    name: "Nguyễn Thị Hương",
    email: "owner@petdolphin.vn",
    phone: "0901 111 222",
    role: "owner",
    status: "active",
    pin: "1234",
    password: "owner123",
    avatarColor: "#10B981",
    permissions: allPerms(true),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "u_manager",
    name: "Trần Minh Quân",
    email: "manager@petdolphin.vn",
    phone: "0902 333 444",
    role: "manager",
    status: "active",
    pin: "2222",
    password: "manager123",
    avatarColor: "#3B82F6",
    permissions: {
      ...allPerms(true),
      "nhan-vien": false,
      "cai-dat": false,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "u_cashier",
    name: "Lê Lan Anh",
    email: "cashier@petdolphin.vn",
    phone: "0903 555 666",
    role: "cashier",
    status: "active",
    pin: "0000",
    password: "cashier123",
    avatarColor: "#F59E0B",
    permissions: {
      ...allPerms(false),
      "ban-hang": true,
      "san-pham": true,
      "khach-hang": true,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "u_warehouse",
    name: "Phạm Đức Thành",
    email: "kho@petdolphin.vn",
    phone: "0904 777 888",
    role: "manager",
    status: "active",
    pin: "3333",
    password: "kho123",
    avatarColor: "#8B5CF6",
    permissions: {
      ...allPerms(false),
      "san-pham": true,
      kho: true,
      "nha-cung-cap": true,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const CATEGORIES: Category[] = [
  { id: "thuc-an", name: "Thức ăn", emoji: "🥣", sort: 1 },
  { id: "cat-ve-sinh", name: "Cát vệ sinh", emoji: "📦", sort: 2 },
  { id: "pate", name: "Pate", emoji: "🥫", sort: 3 },
  { id: "snack", name: "Snack", emoji: "🦴", sort: 4 },
  { id: "do-choi", name: "Đồ chơi", emoji: "🧸", sort: 5 },
  { id: "cham-soc", name: "Chăm sóc", emoji: "🧴", sort: 6 },
  { id: "phu-kien", name: "Phụ kiện", emoji: "🎀", sort: 7 },
];

type SeedProduct = Omit<Product, "createdAt" | "updatedAt" | "active" | "barcode"> & {
  barcode?: string;
};

const PRODUCT_ROWS: SeedProduct[] = [
  { id: "p-01", name: "Royal Canin Indoor 2kg", sku: "RC-IND-2KG", barcode: "8935001800011", categoryId: "thuc-an", brand: "Royal Canin", sellPrice: 385000, costPrice: 295000, stock: 24, minStock: 8, unit: "bao", supplierId: "sup-01", imageColor: "#E8F5E9", emoji: "🐱" },
  { id: "p-02", name: "Royal Canin Kitten 400g", sku: "RC-KIT-400", barcode: "8935001800028", categoryId: "thuc-an", brand: "Royal Canin", sellPrice: 125000, costPrice: 92000, stock: 36, minStock: 10, unit: "bao", supplierId: "sup-01", imageColor: "#FFF3E0", emoji: "🐱" },
  { id: "p-03", name: "Pedigree Adult 1.5kg", sku: "PDG-ADT-15", barcode: "8935001800035", categoryId: "thuc-an", brand: "Pedigree", sellPrice: 165000, costPrice: 118000, stock: 18, minStock: 6, unit: "bao", supplierId: "sup-02", imageColor: "#E3F2FD", emoji: "🐶" },
  { id: "p-04", name: "SmartHeart Puppy 1.5kg", sku: "SH-PUP-15", barcode: "8935001800042", categoryId: "thuc-an", brand: "SmartHeart", sellPrice: 148000, costPrice: 105000, stock: 5, minStock: 6, unit: "bao", supplierId: "sup-03", imageColor: "#FCE4EC", emoji: "🐶" },
  { id: "p-05", name: "Me-O Adult Seafood 1.2kg", sku: "MEO-SEA-12", barcode: "8935001800059", categoryId: "thuc-an", brand: "Me-O", sellPrice: 112000, costPrice: 78000, stock: 42, minStock: 12, unit: "bao", supplierId: "sup-03", imageColor: "#E0F7FA", emoji: "🐱" },
  { id: "p-06", name: "Zenith Holistic Dog 2kg", sku: "ZEN-HOL-2", barcode: "8935001800066", categoryId: "thuc-an", brand: "Zenith", sellPrice: 420000, costPrice: 310000, stock: 9, minStock: 4, unit: "bao", supplierId: "sup-02", imageColor: "#F3E5F5", emoji: "🐶" },
  { id: "p-07", name: "Cát vệ sinh Catsan 10L", sku: "CAT-CSN-10", barcode: "8935001800073", categoryId: "cat-ve-sinh", brand: "Catsan", sellPrice: 185000, costPrice: 125000, stock: 28, minStock: 10, unit: "bao", supplierId: "sup-04", imageColor: "#FFF8E1", emoji: "📦" },
  { id: "p-08", name: "Cát đất sét Petkit 8L", sku: "CAT-PKT-8", barcode: "8935001800080", categoryId: "cat-ve-sinh", brand: "Petkit", sellPrice: 95000, costPrice: 62000, stock: 3, minStock: 8, unit: "bao", supplierId: "sup-04", imageColor: "#EFEBE9", emoji: "📦" },
  { id: "p-09", name: "Cát đậu nành Tofu 6L", sku: "CAT-TOF-6", barcode: "8935001800097", categoryId: "cat-ve-sinh", brand: "TofuCat", sellPrice: 135000, costPrice: 88000, stock: 15, minStock: 6, unit: "bao", supplierId: "sup-04", imageColor: "#E8F5E9", emoji: "📦" },
  { id: "p-10", name: "Cát thủy tinh Silica 3.8L", sku: "CAT-SIL-38", barcode: "8935001800103", categoryId: "cat-ve-sinh", brand: "Silica", sellPrice: 168000, costPrice: 115000, stock: 0, minStock: 4, unit: "bao", supplierId: "sup-04", imageColor: "#E3F2FD", emoji: "📦" },
  { id: "p-11", name: "Cát bentonite hương lavender", sku: "CAT-BNL-10", barcode: "8935001800110", categoryId: "cat-ve-sinh", brand: "Lavender", sellPrice: 78000, costPrice: 48000, stock: 51, minStock: 15, unit: "bao", supplierId: "sup-04", imageColor: "#F3E5F5", emoji: "📦" },
  { id: "p-12", name: "Pate Whiskas vị cá ngừ 85g", sku: "PT-WHK-TUNA", barcode: "8935001800127", categoryId: "pate", brand: "Whiskas", sellPrice: 18000, costPrice: 11000, stock: 120, minStock: 30, unit: "hộp", supplierId: "sup-02", imageColor: "#FFF3E0", emoji: "🥫" },
  { id: "p-13", name: "Pate Pedigree vị bò 80g", sku: "PT-PDG-BEEF", barcode: "8935001800134", categoryId: "pate", brand: "Pedigree", sellPrice: 16000, costPrice: 10000, stock: 88, minStock: 24, unit: "hộp", supplierId: "sup-02", imageColor: "#FFEBEE", emoji: "🥫" },
  { id: "p-14", name: "Pate Royal Canin Instinctive", sku: "PT-RC-INS", barcode: "8935001800141", categoryId: "pate", brand: "Royal Canin", sellPrice: 32000, costPrice: 22000, stock: 64, minStock: 20, unit: "hộp", supplierId: "sup-01", imageColor: "#E8F5E9", emoji: "🥫" },
  { id: "p-15", name: "Pate Me-O Creamy 4 thanh", sku: "PT-MEO-CRM", barcode: "8935001800158", categoryId: "pate", brand: "Me-O", sellPrice: 45000, costPrice: 30000, stock: 40, minStock: 12, unit: "gói", supplierId: "sup-03", imageColor: "#E0F7FA", emoji: "🥫" },
  { id: "p-16", name: "Pate Ciao Churu mix 20 thanh", sku: "PT-CIAO-20", barcode: "8935001800165", categoryId: "pate", brand: "Ciao", sellPrice: 165000, costPrice: 118000, stock: 22, minStock: 8, unit: "hộp", supplierId: "sup-03", imageColor: "#FCE4EC", emoji: "🥫" },
  { id: "p-17", name: "Snack xương sữa Pedigree", sku: "SN-PDG-MILK", barcode: "8935001800172", categoryId: "snack", brand: "Pedigree", sellPrice: 55000, costPrice: 36000, stock: 33, minStock: 10, unit: "gói", supplierId: "sup-02", imageColor: "#FFF8E1", emoji: "🦴" },
  { id: "p-18", name: "Snack cá khô cho mèo 50g", sku: "SN-FISH-50", barcode: "8935001800189", categoryId: "snack", brand: "PawSnack", sellPrice: 42000, costPrice: 26000, stock: 47, minStock: 12, unit: "gói", supplierId: "sup-05", imageColor: "#E3F2FD", emoji: "🐟" },
  { id: "p-19", name: "Snack jerky thịt gà 100g", sku: "SN-JRK-100", barcode: "8935001800196", categoryId: "snack", brand: "PawSnack", sellPrice: 68000, costPrice: 42000, stock: 4, minStock: 8, unit: "gói", supplierId: "sup-05", imageColor: "#FFEBEE", emoji: "🍗" },
  { id: "p-20", name: "Bánh thưởng Inaba 6 thanh", sku: "SN-INB-6", barcode: "8935001800202", categoryId: "snack", brand: "Inaba", sellPrice: 75000, costPrice: 50000, stock: 26, minStock: 8, unit: "hộp", supplierId: "sup-03", imageColor: "#F3E5F5", emoji: "🍪" },
  { id: "p-21", name: "Bóng cao su có chuông", sku: "TY-BALL-01", barcode: "8935001800219", categoryId: "do-choi", brand: "PawToy", sellPrice: 35000, costPrice: 18000, stock: 40, minStock: 10, unit: "cái", supplierId: "sup-05", imageColor: "#E8F5E9", emoji: "🎾" },
  { id: "p-22", name: "Cần câu lông vũ", sku: "TY-WAND-01", barcode: "8935001800226", categoryId: "do-choi", brand: "PawToy", sellPrice: 48000, costPrice: 22000, stock: 19, minStock: 6, unit: "cái", supplierId: "sup-05", imageColor: "#FFF3E0", emoji: "🪶" },
  { id: "p-23", name: "Đồ chơi gặm xương nylon", sku: "TY-CHEW-01", barcode: "8935001800233", categoryId: "do-choi", brand: "PawToy", sellPrice: 85000, costPrice: 48000, stock: 14, minStock: 5, unit: "cái", supplierId: "sup-05", imageColor: "#EFEBE9", emoji: "🦴" },
  { id: "p-24", name: "Ổ nằm mềm size M", sku: "TY-BED-M", barcode: "8935001800240", categoryId: "do-choi", brand: "PawHome", sellPrice: 320000, costPrice: 195000, stock: 7, minStock: 3, unit: "cái", supplierId: "sup-05", imageColor: "#FCE4EC", emoji: "🛏️" },
  { id: "p-25", name: "Sữa tắm SOS trị ve", sku: "CS-SOS-500", barcode: "8935001800257", categoryId: "cham-soc", brand: "SOS", sellPrice: 145000, costPrice: 95000, stock: 21, minStock: 6, unit: "chai", supplierId: "sup-05", imageColor: "#E0F7FA", emoji: "🧴" },
  { id: "p-26", name: "Xịt khử mùi chuồng 300ml", sku: "CS-DEO-300", barcode: "8935001800264", categoryId: "cham-soc", brand: "PawCare", sellPrice: 89000, costPrice: 55000, stock: 2, minStock: 5, unit: "chai", supplierId: "sup-05", imageColor: "#E8F5E9", emoji: "💨" },
  { id: "p-27", name: "Bàn chải lông mềm", sku: "CS-BRUSH-01", barcode: "8935001800271", categoryId: "cham-soc", brand: "PawCare", sellPrice: 65000, costPrice: 32000, stock: 16, minStock: 4, unit: "cái", supplierId: "sup-05", imageColor: "#FFF8E1", emoji: "🧹" },
  { id: "p-28", name: "Thuốc nhỏ gáy Frontline", sku: "CS-FTL-01", barcode: "8935001800288", categoryId: "cham-soc", brand: "Frontline", sellPrice: 210000, costPrice: 155000, stock: 11, minStock: 4, unit: "tuýp", supplierId: "sup-02", imageColor: "#FFEBEE", emoji: "💊" },
  { id: "p-29", name: "Khăn ướt thú cưng 80 tờ", sku: "CS-WIP-80", barcode: "8935001800295", categoryId: "cham-soc", brand: "PawCare", sellPrice: 55000, costPrice: 32000, stock: 38, minStock: 10, unit: "gói", supplierId: "sup-05", imageColor: "#E3F2FD", emoji: "🧻" },
  { id: "p-30", name: "Vòng cổ da có chuông", sku: "AC-COL-01", barcode: "8935001800301", categoryId: "phu-kien", brand: "PawStyle", sellPrice: 75000, costPrice: 38000, stock: 25, minStock: 8, unit: "cái", supplierId: "sup-05", imageColor: "#F3E5F5", emoji: "🎀" },
  { id: "p-31", name: "Dây dắt phản quang 1.5m", sku: "AC-LSH-15", barcode: "8935001800318", categoryId: "phu-kien", brand: "PawStyle", sellPrice: 120000, costPrice: 68000, stock: 13, minStock: 5, unit: "cái", supplierId: "sup-05", imageColor: "#E8F5E9", emoji: "🦮" },
  { id: "p-32", name: "Bát ăn inox đôi", sku: "AC-BOWL-02", barcode: "8935001800325", categoryId: "phu-kien", brand: "PawHome", sellPrice: 95000, costPrice: 52000, stock: 20, minStock: 6, unit: "bộ", supplierId: "sup-05", imageColor: "#ECEFF1", emoji: "🍽️" },
  { id: "p-33", name: "Nhà vệ sinh kín size L", sku: "AC-LITBOX-L", barcode: "8935001800332", categoryId: "phu-kien", brand: "PawHome", sellPrice: 450000, costPrice: 280000, stock: 6, minStock: 2, unit: "cái", supplierId: "sup-04", imageColor: "#FFF3E0", emoji: "🚽" },
  { id: "p-34", name: "Balo vận chuyển trong suốt", sku: "AC-BAG-01", barcode: "8935001800349", categoryId: "phu-kien", brand: "PawTravel", sellPrice: 380000, costPrice: 230000, stock: 1, minStock: 2, unit: "cái", supplierId: "sup-05", imageColor: "#E0F7FA", emoji: "🎒" },
  { id: "p-35", name: "Áo mưa chó size S", sku: "AC-RAIN-S", barcode: "8935001800356", categoryId: "phu-kien", brand: "PawStyle", sellPrice: 110000, costPrice: 60000, stock: 17, minStock: 5, unit: "cái", supplierId: "sup-05", imageColor: "#E3F2FD", emoji: "🧥" },
  { id: "p-36", name: "Royal Canin Urinary 1.5kg", sku: "RC-URI-15", barcode: "8935001800363", categoryId: "thuc-an", brand: "Royal Canin", sellPrice: 520000, costPrice: 395000, stock: 8, minStock: 3, unit: "bao", supplierId: "sup-01", imageColor: "#E8F5E9", emoji: "🐱" },
  { id: "p-37", name: "Cát gỗ nén hữu cơ 5kg", sku: "CAT-WOOD-5", barcode: "8935001800370", categoryId: "cat-ve-sinh", brand: "EcoLitter", sellPrice: 155000, costPrice: 98000, stock: 12, minStock: 5, unit: "bao", supplierId: "sup-04", imageColor: "#EFEBE9", emoji: "🪵" },
  { id: "p-38", name: "Pate Sheba vị tôm 70g", sku: "PT-SHE-70", barcode: "8935001800387", categoryId: "pate", brand: "Sheba", sellPrice: 22000, costPrice: 14000, stock: 75, minStock: 20, unit: "hộp", supplierId: "sup-02", imageColor: "#FCE4EC", emoji: "🦐" },
  { id: "p-39", name: "Snack dental stick 7 thanh", sku: "SN-DNT-7", barcode: "8935001800394", categoryId: "snack", brand: "Dental", sellPrice: 95000, costPrice: 62000, stock: 0, minStock: 6, unit: "gói", supplierId: "sup-02", imageColor: "#FFF8E1", emoji: "🦷" },
  { id: "p-40", name: "Lược chải lông tĩnh điện", sku: "CS-COMB-01", barcode: "8935001800400", categoryId: "cham-soc", brand: "PawCare", sellPrice: 125000, costPrice: 70000, stock: 9, minStock: 3, unit: "cái", supplierId: "sup-05", imageColor: "#F3E5F5", emoji: "✨" },
  { id: "p-41", name: "Máy lọc nước thú cưng", sku: "AC-FOUNT-01", barcode: "8935001800417", categoryId: "phu-kien", brand: "Petkit", sellPrice: 590000, costPrice: 380000, stock: 4, minStock: 2, unit: "cái", supplierId: "sup-05", imageColor: "#E0F7FA", emoji: "💧" },
  { id: "p-42", name: "Thức ăn ướt Felina Canino", sku: "TA-FEL-400", barcode: "8935001800424", categoryId: "thuc-an", brand: "Felina", sellPrice: 58000, costPrice: 38000, stock: 30, minStock: 10, unit: "lon", supplierId: "sup-01", imageColor: "#FFF3E0", emoji: "🐶" },
];

const SUPPLIERS: Supplier[] = [
  { id: "sup-01", name: "Royal Canin Việt Nam", phone: "0901 234 567", email: "banhang@royalcanin.vn", address: "Quận 7, TP. Hồ Chí Minh", contactPerson: "Anh Minh", productCount: 8, totalPurchased: 186500000, debt: 12500000, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "sup-02", name: "Pet Mart Distribution", phone: "0912 888 333", email: "order@petmart.vn", address: "Quận Tân Bình, TP. Hồ Chí Minh", contactPerson: "Chị Lan", productCount: 12, totalPurchased: 142200000, debt: 4800000, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "sup-03", name: "Me-O & SmartHeart Hub", phone: "0933 445 566", email: "wholesale@meo.vn", address: "Bình Thạnh, TP. Hồ Chí Minh", contactPerson: "Anh Khoa", productCount: 9, totalPurchased: 98700000, debt: 0, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "sup-04", name: "Cat Litter Pro", phone: "0987 654 321", email: "sales@catlitterpro.vn", address: "Thủ Đức, TP. Hồ Chí Minh", contactPerson: "Chị Hương", productCount: 6, totalPurchased: 67400000, debt: 3200000, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "sup-05", name: "Paw Care Supplies", phone: "0908 112 233", email: "hello@pawcare.vn", address: "Quận 3, TP. Hồ Chí Minh", contactPerson: "Anh Tú", productCount: 7, totalPurchased: 54100000, debt: 1500000, createdAt: "2026-01-01T00:00:00.000Z" },
];

const CUSTOMERS: Customer[] = [
  { id: "cus-01", name: "Nguyễn Văn A", phone: "0906 111 222", group: "Mèo — mua cát định kỳ", points: 485, totalSpent: 4850000, visitCount: 18, lastPurchaseAt: "2026-09-09T10:00:00.000Z", debt: 0, createdAt: "2025-06-01T00:00:00.000Z" },
  { id: "cus-02", name: "Trần Văn B", phone: "0907 333 444", group: "Mèo — mua cát định kỳ", points: 322, totalSpent: 3220000, visitCount: 14, lastPurchaseAt: "2026-09-06T10:00:00.000Z", debt: 0, createdAt: "2025-07-01T00:00:00.000Z" },
  { id: "cus-03", name: "Lê Thị Cẩm", phone: "0908 555 666", group: "VIP", points: 614, totalSpent: 6140000, visitCount: 26, lastPurchaseAt: "2026-10-05T10:00:00.000Z", debt: 0, createdAt: "2025-05-01T00:00:00.000Z" },
  { id: "cus-04", name: "Phạm Đức D", phone: "0909 777 888", group: "Chó — thức ăn hạt", points: 278, totalSpent: 2780000, visitCount: 11, lastPurchaseAt: "2026-10-04T10:00:00.000Z", debt: 0, createdAt: "2025-08-01T00:00:00.000Z" },
  { id: "cus-05", name: "Hoàng Thị Mai", phone: "0910 999 000", group: "Khách thân", points: 195, totalSpent: 1950000, visitCount: 9, lastPurchaseAt: "2026-09-28T10:00:00.000Z", debt: 450000, createdAt: "2025-09-01T00:00:00.000Z" },
  { id: "cus-06", name: "Vũ Minh Tuấn", phone: "0911 222 333", group: "Cần nhắc quay lại", points: 89, totalSpent: 890000, visitCount: 4, lastPurchaseAt: "2026-08-20T10:00:00.000Z", debt: 0, createdAt: "2026-01-15T00:00:00.000Z" },
];

const DEBTS: Debt[] = [
  { id: "d-01", type: "payable", partyName: "Royal Canin Việt Nam", partyId: "sup-01", partyPhone: "0901 234 567", amount: 12500000, paidAmount: 0, dueDate: "2026-10-12", status: "unpaid", note: "Đợt nhập tháng 9", createdAt: "2026-09-20T00:00:00.000Z" },
  { id: "d-02", type: "payable", partyName: "Pet Mart Distribution", partyId: "sup-02", partyPhone: "0912 888 333", amount: 4800000, paidAmount: 2000000, dueDate: "2026-10-08", status: "partial", note: "Còn lại sau thanh toán một phần", createdAt: "2026-09-25T00:00:00.000Z" },
  { id: "d-03", type: "payable", partyName: "Cat Litter Pro", partyId: "sup-04", partyPhone: "0987 654 321", amount: 3200000, paidAmount: 0, dueDate: "2026-10-02", status: "overdue", note: "Quá hạn nhập cát", createdAt: "2026-09-15T00:00:00.000Z" },
  { id: "d-04", type: "payable", partyName: "Paw Care Supplies", partyId: "sup-05", partyPhone: "0908 112 233", amount: 1500000, paidAmount: 0, dueDate: "2026-10-20", status: "unpaid", note: "Phụ kiện & chăm sóc", createdAt: "2026-10-01T00:00:00.000Z" },
  { id: "d-05", type: "receivable", partyName: "Cửa hàng Pet House Q3", partyId: "cus-wholesale-01", partyPhone: "0908 321 654", amount: 8200000, paidAmount: 0, dueDate: "2026-10-10", status: "unpaid", note: "Bán sỉ cát + thức ăn", createdAt: "2026-09-28T00:00:00.000Z" },
  { id: "d-06", type: "receivable", partyName: "Spa thú cưng Mimi", partyId: "cus-wholesale-02", partyPhone: "0912 456 789", amount: 3500000, paidAmount: 1000000, dueDate: "2026-10-05", status: "overdue", note: "Công nợ spa đối tác", createdAt: "2026-09-20T00:00:00.000Z" },
  { id: "d-07", type: "receivable", partyName: "Hoàng Thị Mai", partyId: "cus-05", partyPhone: "0910 999 000", amount: 450000, paidAmount: 0, dueDate: "2026-10-15", status: "unpaid", note: "Lấy hàng trước · Đơn DH-seed", createdAt: "2026-10-01T00:00:00.000Z", orderId: "o-seed-35" },
];

const DEBT_PAYMENTS: DebtPayment[] = [
  {
    id: "dpay-01",
    debtId: "d-02",
    amount: 2000000,
    method: "transfer",
    createdAt: "2026-09-28T10:00:00.000Z",
    userId: "u_owner",
    note: "Thanh toán đợt 1",
  },
  {
    id: "dpay-02",
    debtId: "d-06",
    amount: 1000000,
    method: "cash",
    createdAt: "2026-09-25T15:30:00.000Z",
    userId: "u_manager",
    note: "Thu một phần tại spa",
  },
];

async function seedDemoOrdersIfEmpty(): Promise<void> {
  const count = await db.orders.count();
  if (count > 0) return;
  const orders = buildDemoOrders();
  await db.orders.bulkPut(orders);
  await db.meta.put({ key: "orderSeq", value: "42" });
  await db.meta.put({ key: "ordersSeeded", value: "1" });
}

async function migrateStoreSettingsIfNeeded(): Promise<void> {
  const row = await db.settings.get("store");
  if (!row) return;
  const needs =
    !row.eInvoice ||
    row.email === undefined ||
    row.legalName === undefined ||
    row.taxCode === undefined ||
    row.billFooter === undefined;
  if (!needs) return;
  await db.settings.put({
    ...row,
    email: row.email ?? SETTINGS.email,
    legalName: row.legalName ?? SETTINGS.legalName,
    taxCode: row.taxCode ?? SETTINGS.taxCode,
    billFooter: row.billFooter ?? SETTINGS.billFooter,
    eInvoice: row.eInvoice ?? SETTINGS.eInvoice,
    updatedAt: new Date().toISOString(),
  });
}

export async function ensureSeeded(): Promise<void> {
  const seeded = await db.meta.get("seeded");
  if (seeded?.value === "1") {
    // DB cũ thiếu đơn mẫu → bổ sung để Dashboard có data
    await seedDemoOrdersIfEmpty();
    await migrateStoreSettingsIfNeeded();
    return;
  }

  const now = new Date().toISOString();
  const products: Product[] = PRODUCT_ROWS.map((p) => ({
    ...p,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));
  const orders = buildDemoOrders();

  await db.transaction(
    "rw",
    [
      db.settings,
      db.users,
      db.categories,
      db.products,
      db.suppliers,
      db.customers,
      db.debts,
      db.debtPayments,
      db.orders,
      db.meta,
    ],
    async () => {
      await db.settings.put(SETTINGS);
      await db.users.bulkPut(USERS);
      await db.categories.bulkPut(CATEGORIES);
      await db.products.bulkPut(products);
      await db.suppliers.bulkPut(SUPPLIERS);
      await db.customers.bulkPut(CUSTOMERS);
      await db.debts.bulkPut(DEBTS);
      await db.debtPayments.bulkPut(DEBT_PAYMENTS);
      await db.orders.bulkPut(orders);
      await db.meta.put({ key: "seeded", value: "1" });
      await db.meta.put({ key: "ordersSeeded", value: "1" });
      await db.meta.put({ key: "orderSeq", value: "42" });
      await db.meta.put({ key: "movementSeq", value: "10" });
    },
  );
}

export async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
  await ensureSeeded();
}

export const DEMO_ACCOUNTS = [
  { label: "Chủ cửa hàng", email: "owner@petdolphin.vn", pin: "1234", password: "owner123" },
  { label: "Quản lý", email: "manager@petdolphin.vn", pin: "2222", password: "manager123" },
  { label: "Thu ngân", email: "cashier@petdolphin.vn", pin: "0000", password: "cashier123" },
];
