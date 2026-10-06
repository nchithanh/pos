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

## Shortcuts

- `Ctrl/Cmd+K` command palette
- POS: `F2` focus search · `F4` checkout · `Enter` trên search = barcode/add
