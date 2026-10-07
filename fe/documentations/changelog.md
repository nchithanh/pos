# Changelog — Dolphin POS FE

## 2026-10-07

- **+2 lĩnh vực:** Tạp hóa (`tap-hoa`, teal) · Điện thoại & laptop (`dien-thoai`, sky). Seed `fe/data/tap-hoa/` và `fe/data/dien-thoai/`. IndexedDB `dolphin_pos_{id}`.
- **Thanh toán CK:** dialog chuyển khoản hiện QR demo (payload có số tiền) và nút chia sẻ. Tách bill thì QR lấy phần chuyển khoản. Chưa nối ngân hàng.
- **Biểu đồ & quỹ:** màu biểu đồ theo ý nghĩa (xanh vào, đỏ ra), không theo theme lĩnh vực. Thẻ quỹ có dấu nhận diện tiền mặt, VCB, MB, MoMo.
- **Tài chính UI:** tổng quan có 6 chỉ số, biểu đồ dòng tiền và lãi lỗ; dòng tiền lọc ngang; công nợ có tuổi nợ và bảng phải thu/phải trả.
- **Kho UI:** tổng quan có thao tác nhanh và số liệu tô màu; tồn kho là bảng lọc/sắp xếp/chọn nhiều dòng; nhập–xuất có chip lọc; kiểm kê một sản phẩm hoặc theo lô. Sidebar chỉ sáng mục Kho khi đang ở module.
- **Kho theo lĩnh vực + thủ kho:** phiếu demo dùng hàng và nhân viên của đúng vertical. Login thêm Thủ kho (PIN `3333`) — quyền sản phẩm, kho, nhà cung cấp.
- **Kho demo:** thêm đơn nhập/xuất/chuyển kho nhiều trạng thái (NK00089 vẫn là phiếu kiểm nhận đang mở).
- **Kho vận hành:** đơn nhập kiểm nhận theo số thực nhận, đơn xuất duyệt/soạn/xuất, tồn khả dụng, lịch sử trước/sau. Bán hàng ghi biến động xuất bán.
- **Tài chính:** nhóm sidebar Tài chính · `/finance/*` (dòng tiền, doanh thu, chi phí, công nợ, quỹ, lợi nhuận, ca, báo cáo, dự báo). Sổ quỹ local; bán hàng / trả nợ / nhập trả ngay cập nhật số dư. `/cong-no` và `/doanh-thu` chuyển vào module mới.

## 2026-10-06

- **Logo:** mark UI (sidebar, login, chọn lĩnh vực) dùng `public/brand/logo-dolphin.webp` thay icon cá. Favicon + icon PWA (`favicon.ico`, `icon-192.png`, `icon-512.png`) cùng logo, nền trong.  
- **+3 lĩnh vực + accent:** Trà sữa (pink) · Thời trang (violet) · Nhà hàng (orange); Cafe amber · Pet emerald · `data-vertical` theme remap.  
- **Lĩnh vực + seed JSON:** `/chon-linh-vuc` trước login · data `fe/data/{pet\|cafe\|tra-sua\|thoi-trang\|nha-hang}/` · IndexedDB `dolphin_pos_{vertical}` · docs `data.md` / `verticals.md` / `pages.md`.  
- **Full polish Sprint 3–7 + SePay sim:** Dashboard · loyalty · PDF · simulator HĐĐT · offline/kiosk · ConfirmDialog/skeleton.  
- **POS core + theme light.**  
- **Kho UX:** phiếu nhập/xuất nhiều dòng + barcode picker · KPI lọc · kiểm kho · CSV · ghi nợ NCC tuỳ chọn · sổ biến động.  
- **AuthGate:** normalize pathname khi `trailingSlash` (tránh chớp giật redirect `/login` ↔ `/login/`).  
- **PWA Pages:** `metadata.manifest` / `icons` dùng `NEXT_PUBLIC_BASE_PATH` + `public/favicon.ico` (fix 404 icon trên `/pos`).  
- **PWA Pages:** manifest relative `./` (fix 404 `github.io/manifest.webmanifest`).  
- **Cài đặt 3 tab:** Cửa hàng (pháp lý + bill) · HĐĐT mock SePay (ký hiệu dropdown, kiểm tra kết nối) · Nhân viên tóm tắt; xuất HĐĐT POS dùng `settings.eInvoice`.  
- **Công nợ UX:** table desktop · search/filter · KPI lọc quá hạn · thu/trả từng phần + lịch sử · ghi nợ · xuất CSV · nhắc nợ/VietQR demo · sidebar user avatar.  
- **Bill / Receipt / HĐĐT:** sau thanh toán → success actions (In bill · Gửi bill mock · Xuất HĐĐT mock) · `ReceiptPreview` + print cửa sổ riêng · `/don-hang` cột Hóa đơn + actions trên chi tiết.  
- **Danh mục + Đơn hàng:** `/danh-muc` (CRUD category kiểu Like Food) · `/don-hang` (Order Line + badge hôm nay) · filter category trên Sản phẩm.  
- **Rebuild local-first:** Dexie IndexedDB · Auth/PIN · shift · POS barcode/hold/receipt · CRUD modules · dark mode · PWA · backup/restore.  
- **Deploy GitHub Pages:** workflow `deploy-pages.yml` · static export (`GITHUB_PAGES=true`, `basePath=/pos`).  
- Seed Pet Shop ~42 SKU; emerald design system; Vercel-ready.  
