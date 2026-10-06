# Seed data

JSON packs under `fe/data/{vertical}/`, loaded by `lib/seed.ts` → Dexie.

## Folders

| Folder | Vertical |
| --- | --- |
| `pet/` | Pet shop |
| `cafe/` | Cafe |
| `tra-sua/` | Trà sữa |
| `thoi-trang/` | Thời trang |
| `nha-hang/` | Nhà hàng |

## Files per pack

`manifest.json` · `settings.json` · `users.json` · `categories.json` · `products.json` · `suppliers.json` · `customers.json` · `debts.json` · `debt-payments.json` · `orders.json` · `demo-accounts.json`

`settings.vertical` must match folder id. `manifest` includes `accent` for docs/UI reference.
