# Dolphin POS FE — overview

Prototype bán hàng + vận hành cửa hàng thú cưng.

## Shell

- Desktop: sidebar trái (Dolphin POS + 8 mục core)  
- Mobile: bottom nav (Tổng quan, Bán hàng, Sản phẩm, Kho) + drawer “Thêm”  
- Toast global, confirm dialog destructive  

## Design

- Accent xanh lá (`#22C55E`), nền xám nhạt, card trắng  
- POS desktop: category list | product grid | cart  
- POS mobile: grid + sticky cart bar + bottom sheet  

## State interactions

Cart add/qty/checkout · product CRUD · stock in/out · debt pay · employee add/edit/toggle/permissions.
