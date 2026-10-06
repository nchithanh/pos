# Dolphin POS — frontend (local-first)

POS web app cho **Pet shop** và **Cafe**. Seed JSON theo lĩnh vực → **IndexedDB (Dexie)** — offline.

Docs SoT: [`documentations/`](./documentations/).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Zustand · TanStack Query · React Hook Form · Zod
- Dexie.js · Recharts · Framer Motion · sonner · next-themes
- PWA · in hóa đơn / PDF

## Chạy local

```bash
cd fe
npm install
npm run dev
```

Mở http://localhost:3012 → **chọn lĩnh vực** → login.

### Tài khoản demo

PIN `1234` / `2222` / `0000` (owner / manager / cashier). Email theo lĩnh vực (xem `data/{pet|cafe}/demo-accounts.json`).

Đăng nhập **tự mở ca** (500.000đ đầu ca).

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
