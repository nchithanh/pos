# Dolphin POS FE — overview

Local-first POS (IndexedDB) cho pet shop & cafe.

## Architecture

| Layer | Tech |
| --- | --- |
| UI | Next App Router · Tailwind · shadcn-style primitives |
| State | Zustand (auth/cart) · TanStack Query · dexie-react-hooks |
| Data | Dexie `dolphin_pos_v1` + seed Pet Shop |
| Auth | PIN / email+password · shift open/close |
| Print | `lib/print-receipt.ts` (thermal 58/80 mock) |

## Routes

`/login` · `/` · `/ban-hang` · `/san-pham` · `/kho` (+ nhập/xuất) · `/khach-hang` · `/nha-cung-cap` · `/cong-no` · `/doanh-thu` · `/nhan-vien` · `/cai-dat`

## Shortcuts

- `Ctrl/Cmd+K` command palette
- POS: `F2` focus search · `F4` checkout · `Enter` trên search = barcode/add
