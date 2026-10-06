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
app/           # routes
components/    # ui, layout
lib/           # db, seed, services, print, utils
stores/        # zustand
types/         # shared types
public/        # manifest + icons
```

## Deploy

- Dev: `npm run dev` → :3012  
- Vercel: `npm run build`  
- Pages: `npm run build:pages` · workflow `.github/workflows/deploy-pages.yml` · https://nchithanh.github.io/pos/
