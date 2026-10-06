# Routes — Dolphin POS FE

| Path | Auth | Ghi chú |
| --- | --- | --- |
| `/chon-linh-vuc` | public | Chọn lĩnh vực + seed + theme |
| `/login` | public* | Cần đã chọn vertical. Demo: chủ, quản lý, thu ngân, thủ kho (PIN 3333) |
| `/` | yes | Dashboard |
| `/ban-hang` | yes | POS |
| `/san-pham` | yes | |
| `/danh-muc` | yes | |
| `/don-hang` | yes | |
| `/kho` | yes | Tổng quan kho. Sidebar chỉ highlight mục Kho cho mọi `/kho/*` |
| `/kho/ton` | yes | Bảng tồn: lọc, sắp xếp, chọn nhiều dòng |
| `/kho/don-nhap` | yes | Kiểm nhận → nhập theo số thực nhận. Lọc `?status=` |
| `/kho/don-xuat` | yes | Duyệt → soạn → xuất. Lọc `?status=` |
| `/kho/kiem-ke` | yes | Kiểm kê một sản phẩm hoặc theo lô |
| `/kho/dieu-chinh` | yes | Điều chỉnh tồn |
| `/kho/chuyen-kho` | yes | Chuyển kho |
| `/kho/lich-su` | yes | Biến động trước/sau |
| `/kho/goi-y` | yes | Gợi ý tồn (mock) |
| `/kho/nhap` | yes | Phiếu nhập nhanh |
| `/kho/xuat` | yes | Phiếu xuất nhanh |
| `/khach-hang` | yes | |
| `/nha-cung-cap` | yes | |
| `/finance` | yes | Tổng quan tài chính |
| `/finance/cash-flow` | yes | Dòng tiền, phiếu thu/chi, chuyển tiền, đối soát |
| `/finance/revenue` | yes | Doanh thu |
| `/finance/expenses` | yes | Chi phí |
| `/finance/debts` | yes | Công nợ |
| `/finance/accounts` | yes | Quỹ & tài khoản |
| `/finance/profit` | yes | Lợi nhuận |
| `/finance/shifts` | yes | Ca & đối soát |
| `/finance/reports` | yes | Báo cáo |
| `/finance/forecast` | yes | Dự báo (mock) |
| `/finance/alerts` | yes | Cảnh báo |
| `/cong-no` | yes | Chuyển tới `/finance/debts` |
| `/doanh-thu` | yes | Chuyển tới `/finance/revenue` |
| `/nhan-vien` | yes | |
| `/cai-dat` | yes | Đổi lĩnh vực → `/chon-linh-vuc` |

\* `AuthGate`: chưa có vertical → `/chon-linh-vuc`; có vertical chưa login → `/login`.
