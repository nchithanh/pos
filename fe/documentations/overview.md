# Dolphin POS FE — overview

Local-first POS (IndexedDB) cho pet shop & cafe.

## Architecture

| Layer | Tech |
| --- | --- |
| UI | Next App Router · Tailwind · shadcn-style primitives |
| State | Zustand (auth/cart) · TanStack Query · dexie-react-hooks |
| Data | Dexie `dolphin_pos_v1` + seed Pet Shop |
| Auth | PIN / email+password · shift open/close |
| Print | `lib/print-receipt.ts` + `components/pos/ReceiptPreview` (thermal 58/80) |
| Bill / HĐĐT | After checkout: In bill · Gửi bill (mock) · Xuất HĐĐT (mock, lưu `order.eInvoice`) |

## Routes

`/login` · `/` · `/ban-hang` · `/don-hang` · `/san-pham` · `/danh-muc` · `/kho` (+ nhập/xuất) · `/khach-hang` · `/nha-cung-cap` · `/cong-no` · `/doanh-thu` · `/nhan-vien` · `/cai-dat`

## Kho (`/kho`, `/kho/nhap`, `/kho/xuat`)

- Danh sách tồn: KPI lọc · SKU/barcode · Kiểm kho · Xuất CSV · sổ biến động  
- Phiếu nhập/xuất nhiều dòng: tìm/quét barcode · xóa dòng · nhập: TT ngay / ghi nợ NCC · HSD tuỳ chọn  

## Công nợ (`/cong-no`)

- KPI clickable (Phải thu / Phải trả / Quá hạn) · tab · search · lọc hạn  
- Desktop table + mobile card dày · Thu/Trả nợ từng phần · lịch sử `debtPayments`  
- Ghi nợ thủ công · Xuất CSV · Nhắc nợ / VietQR / Zalo = **demo**

## Receipt flow

1. POS checkout → success → **In bill** / **Gửi bill** / **Xuất hóa đơn điện tử** / **Xong**
2. `/don-hang` — cột Hóa đơn (Chưa xuất / Đã xuất), chi tiết tái dùng `ReceiptActions`
3. HĐĐT là **demo** (không kết nối cơ quan thuế / provider thật)

## Cài đặt (`/cai-dat`)

3 tab:

1. **Cửa hàng** — shop, pháp lý nội bộ, bill, theme, backup  
2. **Hóa đơn điện tử** — mock SePay (`provider_account_id`, mẫu, ký hiệu chọn list `C26…`, địa điểm)  
3. **Nhân viên & phân quyền** — tóm tắt roles + link `/nhan-vien`  

Xuất HĐĐT trên POS đọc `settings.eInvoice` (phải *Đã kết nối*).

## POS (`/ban-hang`)

- Product card: hover, badge tồn thấp/hết · toast khi thêm
- Dòng giỏ: ghi chú · giảm % dòng · +/- qty · click chọn dòng
- Giảm đơn: chế độ `đ` / `%` · split cash + method khác
- Checkout success: motion ngắn + actions bill / HĐĐT

## UX feedback

- Toast qua `lib/notify.ts` (success / error / warning / info)
- Confirm destructive: `hooks/use-confirm` + `ConfirmDialog` (không dùng `window.confirm`)
- Skeleton: `TableSkeleton` · `CardListSkeleton` · `ProductGridSkeleton`
- Page enter: `PageTransition` trong `AppShell`
- Offline banner · POS kiosk (sidebar từ `xl` trên `/ban-hang`)

## Loyalty

- Tích điểm: `floor(total/10000)` mỗi đơn paid
- Đổi điểm tại POS: 1 điểm = 1.000đ (`POINT_VALUE_VND`) — cần chọn khách

## HĐĐT SePay

- Mode mặc định **Simulator** (`lib/services/sepay-simulator.ts`) — contract docs, không credential
- Mode **Sandbox thật** = TODO (cần `client_id`/`secret` + API proxy; Pages static không gọi trực tiếp)
- Xuất HĐ lưu `trackingCode` / `trackingUrl` / `status` trên `order.eInvoice`

## Bill

- Preview + `window.print` nhiệt 58/80 (`settings.receiptWidth`)
- Tải PDF: `lib/pdf-receipt.ts` (jsPDF)

## Shortcuts

- `Ctrl/Cmd+K` command palette
- POS: `F2` search · `F4` checkout · `Enter` barcode/add · `Esc` đóng modal / xóa giỏ · `+`/`-` qty dòng đang chọn
