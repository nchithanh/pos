# Routes — Dolphin POS FE

| Path | Auth | Ghi chú |
| --- | --- | --- |
| `/chon-linh-vuc` | public | Chọn lĩnh vực + seed + theme |
| `/login` | public* | Cần đã chọn vertical |
| `/` | yes | Dashboard |
| `/ban-hang` | yes | POS |
| `/san-pham` | yes | |
| `/danh-muc` | yes | |
| `/don-hang` | yes | |
| `/kho` | yes | |
| `/khach-hang` | yes | |
| `/nha-cung-cap` | yes | |
| `/cong-no` | yes | |
| `/doanh-thu` | yes | |
| `/nhan-vien` | yes | |
| `/cai-dat` | yes | Đổi lĩnh vực → `/chon-linh-vuc` |

\* `AuthGate`: chưa có vertical → `/chon-linh-vuc`; có vertical chưa login → `/login`.
