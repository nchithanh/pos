# Scope — Dolphin POS FE

## In scope (shipped)

- Local-first IndexedDB (Dexie) + seed Pet Shop  
- Auth PIN/email · roles · mở/đóng ca  
- Dashboard real stats/charts  
- POS core: cart, barcode, hold, customer, payments, receipt  
- CRUD sản phẩm · kho (phiếu nhiều dòng, barcode, kiểm kho, sổ biến động, ghi nợ NCC)  
- Khách hàng + điểm + AI rule-based  
- NCC · công nợ (table, partial pay, lịch sử, CSV, nhắc nợ demo) · doanh thu/export CSV  
- Nhân viên/permissions · cài đặt 3 tab (cửa hàng / HĐĐT SePay mock / NV) · backup/restore/theme  
- PWA (prod) · GitHub Pages + Vercel-ready  

## Recently polished (FE)

- Chọn lĩnh vực Pet/Cafe · seed JSON `fe/data/{vertical}` · DB tách  
- Dashboard KPI/charts · loyalty điểm · bill PDF · SePay **simulator**  
- Offline banner · POS kiosk layout · ConfirmDialog / skeletons  

## Out of scope / later

- Supabase sync thật (adapter stub chưa nối)  
- SePay sandbox API thật (cần credential + server proxy)  
- Gateway thanh toán online  
- Capacitor native wrapper  
- Multi-store / multi-warehouse đầy đủ  
