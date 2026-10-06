# Deploy — Dolphin POS frontend

Static export → **GitHub Pages** (`nchithanh/pos`).

## CI

Workflow: `.github/workflows/deploy-pages.yml` (repo root)

- Trigger: push `main` hoặc `workflow_dispatch`
- Working directory: `fe/`
- Build: `GITHUB_PAGES=true` + `GITHUB_PAGES_BASE_PATH=/pos` → artifact `fe/out/`
- Deploy: GitHub Actions `deploy-pages`

## GitHub (1 lần)

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. (Tuỳ chọn) Custom domain → bỏ `GITHUB_PAGES_BASE_PATH` trong workflow

## URL

| Giai đoạn | URL |
| --- | --- |
| Project Pages | https://nchithanh.github.io/pos/ |
| Custom domain | `https://<domain>/` — để `GITHUB_PAGES_BASE_PATH` rỗng |

## PWA manifest

`layout` metadata `manifest` = `${NEXT_PUBLIC_BASE_PATH}/manifest.webmanifest` (vd. `/pos/…`). File `public/manifest.webmanifest` dùng path tương đối (`./`) để icon/start_url khớp project Pages.

## Local artifact (giống CI)

```bash
cd fe
npm run build:pages
# static files in out/
```

## Push

```bash
GIT_SSH_COMMAND='ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes' git push origin main
```
