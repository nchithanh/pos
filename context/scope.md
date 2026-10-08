# Scope — Dolphin POS FE

## In scope (shipped)

- Local-first IndexedDB (Dexie) + seed Pet Shop  
- Auth PIN/email · roles · thủ kho (PIN 3333, quyền kho) · mở/đóng ca  
- Dashboard real stats/charts  
- POS core: cart, barcode, hold, customer, payments, receipt  
- CRUD sản phẩm · kho vận hành (kiểm nhận, xuất có duyệt/soạn, kiểm kê, sổ trước/sau)  
- Khách hàng + điểm + AI rule-based  
- NCC · công nợ (table, partial pay, lịch sử, CSV, nhắc nợ demo) · doanh thu/export CSV  
- Nhân viên/permissions · cài đặt 3 tab (cửa hàng / HĐĐT SePay mock / NV) · backup/restore/theme  
- Đa chi nhánh demo: chọn trên header/sidebar (kể cả **Tất cả**) · ca, đơn, tồn, quỹ theo lựa chọn · catalog và khách dùng chung · tổng quan/biểu đồ theo branch switcher  
- Tài chính vận hành `/finance` (sổ quỹ local, không kế toán/ngân hàng thật)  
- PWA (prod) · GitHub Pages + Vercel-ready  

## Recently polished (FE)

- Chọn lĩnh vực (Pet, Cafe, Trà sữa, Thời trang, Nhà hàng, Tạp hóa, Điện thoại & laptop) · seed JSON `fe/data/{vertical}` · DB tách  
- Dashboard KPI/charts · loyalty điểm · bill PDF · SePay **simulator**  
- Offline banner · POS kiosk layout · ConfirmDialog / skeletons  

## Out of scope / later

- Supabase sync thật (adapter stub chưa nối)  
- SePay sandbox API thật (cần credential + server proxy)  
- Gateway thanh toán online  
- Capacitor native wrapper  
