# 🔧 Hướng Dẫn Test Authentication

## ✅ Các vấn đề đã được sửa:

1. **AdminLayout** - Đã chuyển từ `children` prop sang `<Outlet />` để tương thích với React Router v6
2. **Route paths** - Đã sửa nested routes để tránh duplicate path (từ `/admin/dashboard` → `dashboard`)
3. **ProtectedRoute** - Đã thêm null check cho user object

---

## 🚀 Cách Test Admin Dashboard:

### Phương pháp 1: Sử dụng Console trực tiếp

1. Mở **DevTools Console** (F12)
2. Paste đoạn code sau:

```javascript
// Login as Admin
localStorage.setItem("token", "mock-admin-token");
localStorage.setItem("user", JSON.stringify({
  id: 1,
  name: "Admin User",
  email: "admin@capitalcoffee.com",
  roleName: "admin"
}));
window.location.href = "/admin/dashboard";
```

### Phương pháp 2: Sử dụng Helper Script

1. Mở **DevTools Console** (F12)
2. Load helper script:

```javascript
// Load mock-auth.js
const script = document.createElement('script');
script.src = '/mock-auth.js';
document.head.appendChild(script);
```

3. Sau khi load xong, sử dụng các function:

```javascript
loginAsAdmin()      // → /admin/dashboard
loginAsCustomer()   // → /customer/checkout
loginAsStaff()      // → /staff/scan
loginAsManager()    // → /manager/checkout
loginAsSupplier()   // → /supplier/checkout
logout()            // → /home
```

---

## 📍 Available Routes:

### Public Routes (không cần login):
- `/home` - Trang chủ
- `/about` - Giới thiệu
- `/403` - Forbidden page

### Admin Routes (role: "admin"):
- `/admin` hoặc `/admin/dashboard` - Dashboard
- `/admin/coupons` - Quản lý Coupon
- `/admin/promotions` - Quản lý Khuyến mãi
- `/admin/loyalty` - Loyalty Program
- `/admin/rewards` - Rewards

### Customer Routes (role: "customer"):
- `/customer/checkout` - Checkout
- `/invoice` - Invoice
- `/redeem` - Redeem Points

### Staff Routes (role: "staff"):
- `/staff/scan` - Scan QR

### Manager Routes (role: "manager"):
- `/manager/checkout` - Manager Checkout

### Supplier Routes (role: "supplier"):
- `/supplier/checkout` - Supplier Checkout

---

## 🔍 Debug Tips:

### Kiểm tra user hiện tại:
```javascript
console.log("Token:", localStorage.getItem("token"));
console.log("User:", JSON.parse(localStorage.getItem("user")));
```

### Xóa tất cả data:
```javascript
localStorage.clear();
window.location.reload();
```

### Mock nhiều role để test:
```javascript
// Admin
localStorage.setItem("user", JSON.stringify({roleName: "admin"}));

// Customer
localStorage.setItem("user", JSON.stringify({roleName: "customer"}));

// Staff
localStorage.setItem("user", JSON.stringify({roleName: "staff"}));
```

---

## ⚠️ Lưu ý:

- Đây là **mock authentication** chỉ để test UI
- Production cần integrate với backend API thực
- Không commit file `mock-auth.js` vào production
- ProtectedRoute sẽ redirect về `/home` nếu không có token/user
- ProtectedRoute sẽ redirect về `/403` nếu role không đúng

---

## 🔗 Next Steps:

1. Integrate với backend authentication API
2. Thêm refresh token logic
3. Implement proper session management
4. Add authentication context/provider
5. Handle token expiration
