# Changelog — Dolphin POS FE

## 2026-10-06

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
