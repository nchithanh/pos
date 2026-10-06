# Dolphin POS (SaaS) — agent context

When coding **this product**, stay in **this folder** (`products/saas/pos/`).

1. `context/README.md` (index)
2. `context/product.md` → `scope.md` → `architecture.md` → `constraints.md`
3. **`fe/documentations/`** — FE behavior SoT (bắt buộc cập nhật cùng task)

## Docs — same task (bắt buộc)

Mọi thay đổi **code / route / seed / lĩnh vực / deploy** → **create hoặc update** file trong **`fe/documentations/`** (+ `changelog.md`) trong **cùng task**, trước khi coi xong / commit.

| Change | Update |
| --- | --- |
| Overview / IA | `fe/documentations/overview.md` |
| Routes / pages | `fe/documentations/pages.md` |
| Seed JSON / vertical | `fe/documentations/data.md`, `verticals.md` |
| Non-trivial | + `fe/documentations/changelog.md` |
| Index docs | `fe/documentations/README.md` |

Cũng cập nhật `context/` khi đổi product/scope/architecture.

## Repo

GitHub: `nchithanh/pos` · FE: `fe/` · Pages: https://nchithanh.github.io/pos/

## Do not load as product SoT

- Dolphin Ops / Dolphin Edu domains
- Marketing site knowledge / homepage copy

## Still apply (repo-wide)

Confirm-before-acting (`ok`), workspace-only, Vietnamese replies, GitHub `nchithanh`.

Missing price / SLA → **TODO**.
