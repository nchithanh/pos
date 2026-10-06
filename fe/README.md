# Dolphin POS — frontend (local-first)

POS web app production-oriented cho pet shop & cafe. Dữ liệu chạy **IndexedDB (Dexie)** — offline, không cần backend.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Zustand · TanStack Query · React Hook Form · Zod
- Dexie.js · Recharts · Framer Motion · sonner · next-themes
- PWA (`@ducanh2912/next-pwa`) · in hóa đơn (window.print)

## Chạy local

```bash
cd fe
npm install
npm run dev
```

Mở http://localhost:3012

### Tài khoản demo

| Vai trò | PIN | Email / mật khẩu |
| --- | --- | --- |
| Chủ cửa hàng | `1234` | `owner@petdolphin.vn` / `owner123` |
| Quản lý | `2222` | `manager@petdolphin.vn` / `manager123` |
| Thu ngân | `0000` | `cashier@petdolphin.vn` / `cashier123` |

Đăng nhập sẽ **tự mở ca** với 500.000đ tiền mặt đầu ca.

## Modules

- Auth (PIN / email) + ca làm
- Dashboard real-time từ DB
- POS: barcode Enter, giỏ, giữ đơn, khách, cash/CK/QR/nợ/tách, in hóa đơn, phím tắt F2/F4
- Sản phẩm · Kho (nhập/xuất/điều chỉnh) · Khách hàng + AI mock
- NCC · Công nợ · Doanh thu (CSV) · Nhân viên/quyền · Cài đặt/backup

## Scripts

| Script | Mô tả |
| --- | --- |
| `npm run dev` | Dev port 3012 |
| `npm run build` | Production (Vercel-ready) |
| `npm run build:pages` | Static export GitHub Pages (`basePath=/pos`) |
| `npm start` | Serve build |

## Deploy

- **Vercel:** root = `fe/`, `npm run build`
- **GitHub Pages:** xem `documentations/deploy.md` → https://nchithanh.github.io/pos/

## Docs

- Product SoT: `../context/`
- App docs: `documentations/`
