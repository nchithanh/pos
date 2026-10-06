# Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 · Tailwind 4 · Lucide |
| Forms | React Hook Form + Zod |
| Client state | Zustand (auth, cart) |
| Server/cache | TanStack Query (sẵn sàng mở rộng) |
| Persistence | Dexie IndexedDB (`lib/db.ts`) |
| Charts | Recharts |
| PWA | `@ducanh2912/next-pwa` |

## Folder (`fe/`)

```
app/              # routes (incl. chon-linh-vuc, login)
components/       # ui, layout, pos
data/{pet,cafe}/  # seed JSON theo lĩnh vực
lib/              # db, seed, vertical, services
stores/           # zustand
documentations/   # FE docs SoT
```

## Routes (`fe/app`)

| Path | Screen |
| --- | --- |
| `/chon-linh-vuc` | Chọn lĩnh vực (trước login) |
| `/login` | Đăng nhập |
| `/` | Tổng quan |
| `/ban-hang` | POS |
| `/don-hang` · `/san-pham` · `/danh-muc` · `/kho`… | Modules |
| `/cai-dat` | Cài đặt (+ đổi lĩnh vực) |

Chi tiết: `fe/documentations/pages.md`.

## Deploy

- Dev: `npm run dev` → :3012  
- Vercel: `npm run build`  
- Pages: `npm run build:pages` · workflow `.github/workflows/deploy-pages.yml` · https://nchithanh.github.io/pos/
