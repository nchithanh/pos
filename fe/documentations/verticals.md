# Lĩnh vực (verticals)

Chọn trước login tại `/chon-linh-vuc`. Mỗi lĩnh vực:

- Seed JSON: `fe/data/{id}/`
- IndexedDB: `dolphin_pos_{id}`
- Theme: `html[data-vertical="{id}"]` → `--brand-*` (remap class `emerald-*`)

## Accent map

| id | Label | Accent | Hex |
| --- | --- | --- | --- |
| `pet` | Pet shop | emerald | `#10B981` |
| `cafe` | Cafe | amber / coffee | `#D97706` |
| `tra-sua` | Trà sữa | pink | `#EC4899` |
| `thoi-trang` | Thời trang | violet | `#7C3AED` |
| `nha-hang` | Nhà hàng | orange | `#EA580C` |
| `tap-hoa` | Tạp hóa | teal | `#0D9488` |
| `dien-thoai` | Điện thoại & laptop | sky | `#0284C7` |

SoT UI meta: `lib/vertical.ts` (`VERTICAL_OPTIONS`). CSS: `app/globals.css`.

## Legacy

`StoreSettings.vertical` còn nhận `clothing` → seed map `thoi-trang`, `general` → `pet` (`normalizeStoreVertical`).
