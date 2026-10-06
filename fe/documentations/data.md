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

## Demo login

Mỗi pack có 4 tài khoản trong `demo-accounts.json` / `users.json`: chủ, quản lý, thu ngân (PIN `0000`), thủ kho (PIN `3333`, email `kho@…`). Thủ kho có quyền `san-pham`, `kho`, `nha-cung-cap`. DB đã seed sẽ được thêm user thiếu khi mở app (`migrateMissingUsers`).

## Kho demo

Phiếu nhập/xuất/chuyển kho không nằm trong JSON. `stores/warehouse-store.ts` sinh theo id sản phẩm của vertical (pet cát Tofu, cafe croissant, trà sữa trân châu, thời trang áo thun, nhà hàng gỏi cuốn). Phiếu demo còn đúng trạng thái seed được làm mới; phiếu user đã đổi trạng thái được giữ.
