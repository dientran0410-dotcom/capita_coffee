# Staff Creation - Verification Guide

## ✅ Luồng Mong Đợi Sau Khi Fix

Khi bạn tạo một staff mới, đây là những gì sẽ xảy ra:

### 1️⃣ **Sau khi bấm "Create Account & Staff"**
```
✅ Form validation  
✅ POST /api/auth-service/users/create-account
✅ Toast: "Tạo tài khoản nhân viên thành công! Chờ 3 giây để backend xử lý..."
✅ Chờ 3 giây (để backend persist và sync)
✅ Redirect sang /manager/staff
```

**Console logs bạn sẽ thấy:**
```javascript
🔐 Creating staff account with form data: {
  name: "Nguyen Van A",
  email: "test@example.com",
  branchId: "abc123"
}

✅ Full response from API: {...}
📦 Extracted response data: {...}
🔄 Redirecting to staff list after 3s sync delay...
```

### 2️⃣ **Khi trang /manager/staff load**
```
🔍 Fetching staffs for branch: abc123
✅ Raw API response: {
  content: [
    {id: "...", name: "Nguyen Van A", ...},
    ...
  ],
  totalElements: 2
}
📋 Extracted list: 2 items
🔹 First staff (full): {...}
🆕 Newest staff: {
  name: "Nguyen Van A",
  email: "test@example.com",
  ...
}
```

### 3️⃣ **Staff Sẽ Xuất Hiện Trong Bảng**
```
📊 Staff Management
   Total: 2  | Working: 2  | Inactive: 0

[Table]
| Staff ID | Employee | Contact | Branch | Status |
|----------|----------|---------|--------|--------|
| ST-001   | Nguyen Van A | test@ex... | Branch 1 | Working |  ← Mới tạo
| ST-002   | Another Staff | ... | Branch 1 | Working |
```

---

## 🔍 Nếu Staff KHÔNG Xuất Hiện?

### Kiểm Tra 1: Xem Console Log
**Bước:**
1. Tạo staff mới  
2. Mở DevTools (F12 → Console)
3. Tìm log: `🆕 Newest staff:`

**Kỳ vọng:**
```javascript
🆕 Newest staff: {
  name: "Tên của staff",
  email: "email@example.com",
  status: "ACTIVE"
}
```

**Nếu không thấy:**
```javascript
⚠️ API returned empty list. Possible reasons:
  1. No staffs exist for this branch
  2. New staff not yet synced from auth-service to shift-service
  3. Backend processing time
```

→ **Giải pháp:** Bấm nút "Refresh" trên trang

---

### Kiểm Tra 2: Network Tab
1. Mở DevTools → Network
2. Khi tạo staff, tìm request: `POST /api/auth-service/users/create-account`
3. Xem Response:
```json
{
  "data": {
    "id": "user-123",  ← ID của user vừa tạo
    "email": "test@example.com",
    "franchiseId": "abc123",  ← Phải có franchiseId!
    "status": "ACTIVE"
  }
}
```

**Nếu Response không có fields trên:**
- Backend không trả về đầy đủ thông tin
- Cần kiểm tra Backend API

---

### Kiểm Tra 3: Liệt Kê Tất Cả Staff
**Mục đích:** Xem liệu staff vừa tạo có tồn tại trong backend không

**Bước:**
1. Mở DevTools Console
2. Chạy:
```javascript
// Fetch ALL staffs (không filter branchId)
const all = await (window as any).getAllStaffs(0, 100);
console.log("All staffs:", all.content.length);
all.content.forEach((s, i) => {
  console.log(`[${i}] ${s.name} (branchId: "${s.branchId}")`);
});
```

**Kỳ vọng:** Sẽ thấy staff vừa tạo trong danh sách

**Nếu KHÔNG thấy:**
- Staff không được tạo trong database
- Hoặc auth-service chưa synced sang shift-service
- → Kiểm tra Backend logs

---

### Kiểm Tra 4: BranchId Mismatch?
**Bước:**
1. Tìm log "🔹 First staff branchId value"
2. Ghi nhớ giá trị
3. So sánh với "🔍 Fetching staffs for branch"

**Kỳ vọng:**
```
🔍 Fetching staffs for branch: abc123
...
🔹 First staff branchId value: abc123  ← Phải giống!
```

**Nếu khác nhau:**
- Staff được tạo với branchId sai
- Hoặc API đang filter sai
- → Kiểm tra form branchId lúc tạo

---

## 🔧 Các Khả Năng Xảy Ra

| Hiện Tượng | Nguyên Nhân | Giải Pháp |
|-----------|-----------|----------|
| Toast hiển thị, redirect, nhưng bảng trống | Backend chưa xử lý xong | Bấy nút Refresh hoặc chờ 5s |
| Toast hiển thị, nhưng redirect về trang khác | Navigation error | Kiểm tra URL route mapping |
| Staff xuất hiện nhưng status INACTIVE | Backend set mặc định | Kiểm tra backend logic |
| Staff không xuất hiện dù đã refresh | branchId mismatch | Kiểm tra form submission data |
| Network error khi tạo | Auth-service down | Kiểm tra backend logs |
| Staff có thể login nhưng không trong list | Sync delay > 3s | Tăng timeout thêm |

---

## 📝 Thay Đổi Được Áp Dụng

### 1. CreateStaff.tsx
- ⏱️ Tăng delay từ 1s → 3s  
- 🔄 Sử dụng `replace: true` trong navigate (không push history)
- 📊 Cải thiện toast message

### 2. StaffList.tsx  
- 👁️ Thêm focus listener: tự động refresh khi user quay lại tab
- 📋 Cải thiện logging cho "Newest staff"
- ⚠️ Thêm warning logs nếu danh sách trống
- 🔘 Disable Refresh button lúc đang load

### 3. Luồng Xử Lý
- **Before:** Tạo → Redirect ngay → API chưa sẵn sàng
- **After:** Tạo → Chờ 3s (backend xử lý) → Redirect → Load danh sách

---

## ✅ Quy Trình Test Hoàn Chỉnh

1. **Chuẩn bị:**
   - Mở DevTools Console trước khi tạo
   - Có sẵn một manager account

2. **Tạo Staff:**
   - Bấm "Create New Staff"
   - Điền form
   - Bấm "Create Account & Staff"
   - **Quan sát console logs**

3. **Verify:**
   - ✅ Toast "Tạo tài khoản thành công"
   - ✅ Console show "Chờ 3 giây"
   - ✅ Redirect sang /manager/staff
   - ✅ Console show "🆕 Newest staff"
   - ✅ Staff xuất hiện trong bảng

4. **Test Login:**
   - Logout khỏi manager account
   - Login bằng email/password của staff vừa tạo
   - ✅ Có thể login thành công

5. **Test Visibility:**
   - Login lại manager account
   - Vào /manager/staff
   - ✅ Thấy staff vừa tạo

---

## 🚀 Nếu Vẫn Không Fix?

**Chụp screenshot của:**
1. Console logs (đầy đủ từ lúc tạo đến redirect)
2. Network tab request/response của create  
3. Staff list table (nếu trống)
4. `localStorage.getItem("auth_user")` output

**Gửi kèm:**
- Email của staff vừa tạo
- BranchId của manager
- Backend logs nếu có

---

**Cập nhật:** March 26, 2026  
**Status:** Implemented auto-refresh + longer sync delay
