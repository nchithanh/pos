# Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind CSS 4 |
| Icons | Lucide React |
| State | Zustand (`store/usePosStore.ts`) |
| Charts | Recharts |
| Data | Hardcoded `fe/data/*.ts` |

## Routes (`fe/app`)

| Path | Screen |
| --- | --- |
| `/` | Tổng quan |
| `/ban-hang` | POS |
| `/san-pham` | Sản phẩm |
| `/kho` | Kho |
| `/kho/nhap` | Nhập kho |
| `/kho/xuat` | Xuất kho |
| `/nha-cung-cap` | NCC |
| `/nha-cung-cap/[id]` | NCC detail |
| `/cong-no` | Công nợ |
| `/doanh-thu` | Doanh thu |
| `/nhan-vien` | Nhân viên |
| `/khach-hang` | Customer expansion |

Dev: `npm run dev` → port **3012**.

## Deploy

- GitHub Pages via `.github/workflows/deploy-pages.yml`
- Static export: `GITHUB_PAGES=true` · project basePath `/pos`
- Docs: `fe/documentations/deploy.md`
- Live (project Pages): https://nchithanh.github.io/pos/
