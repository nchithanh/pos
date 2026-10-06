# Dolphin POS FE — overview

Local-first POS (IndexedDB) — demo nhiều lĩnh vực (chọn trước login), mỗi lĩnh vực có tông màu chủ đạo riêng.

## Architecture

| Layer | Tech |
| --- | --- |
| UI | Next App Router · Tailwind · shadcn-style primitives |
| State | Zustand (auth/cart) · TanStack Query · dexie-react-hooks |
| Data | JSON `fe/data/{vertical}/` → Dexie `dolphin_pos_{vertical}` |
| Theme | `data-vertical` + `--brand-*` (remap `emerald-*`) |
| Auth | Chọn lĩnh vực → PIN / email · shift open/close |
| Print | `lib/print-receipt.ts` + PDF `lib/pdf-receipt.ts` |
| HĐĐT | SePay **simulator** (docs contract) |

## Verticals & accents

Pet (emerald) · Cafe (amber) · Trà sữa (pink) · Thời trang (violet) · Nhà hàng (orange) — chi tiết [verticals.md](./verticals.md).

## Entry flow

`/chon-linh-vuc` → `/login` → app (`/` …)

Chi tiết routes: [pages.md](./pages.md) · seed: [data.md](./data.md).

## Modules

- POS `/ban-hang` — giỏ, giảm đ/%, điểm, split, shortcuts F2/F4/Esc  
- Kho — phiếu nhiều dòng, barcode, kiểm kho  
- Công nợ — thu/trả từng phần, CSV  
- Cài đặt — 3 tab (cửa hàng / HĐĐT / NV) + đổi lĩnh vực  

## Loyalty

- Tích điểm: `floor(total/10000)` · Đổi: 1 điểm = 1.000đ  

## Shortcuts

- `Ctrl/Cmd+K` palette  
- POS: `F2` search · `F4` checkout · `Enter` barcode · `Esc` / `+/-`  
