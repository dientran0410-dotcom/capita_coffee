# Manager Staff Management - Implementation Guide

## ✅ Fix Summary
Lỗi "Request method 'POST' is not supported" đã được sửa. Manager giờ có thể tạo tài khoản Staff bằng cách sử dụng endpoint `/api/auth-service/users/create-account` (giống Admin).

## 📋 Staff Creation Flow

### Current Implementation
```
Manager (CreateStaff.tsx)
    ↓
POST /api/auth-service/users/create-account
    ↓
Auth-Service tạo tài khoản STAFF
    ↓
Redirect to /manager/staff
```

## 🔗 API Endpoints Used

### Manager Staff Pages

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth-service/users/create-account` | POST | Create new staff account |
| `/api/shift-service/staffs` | GET | List all staffs for manager's franchise |
| `/api/shift-service/staffs/{id}` | GET | Get specific staff details |
| `/api/shift-service/staffs/{id}` | PUT | Update staff info |
| `/api/shift-service/staffs/{id}/status` | PATCH | Update staff status |

### Key Files

```
src/pages/manager/staff/
├── CreateStaff.tsx          ✅ Create new staff account
├── StaffList.tsx            - List staff (uses GET /api/shift-service/staffs)
├── StaffSchedules.tsx       - View staff schedules
└── StaffAttendance.tsx      - Record attendance

src/services/
├── staffService.ts          - Staff API functions
├── staffScheduleService.ts  - Schedule management
└── attendanceService.ts     - Attendance tracking
```

## 🚀 Data Flow - Getting Data from Manager to Staff Page

### 1. When Creating Staff
```tsx
// CreateStaff.tsx
const createAccountPayload = {
    email, password, name, address, phone,
    franchiseId: branchId,
    roleName: "STAFF"
};

const response = await apiUtils.post(
    "/api/auth-service/users/create-account",
    createAccountPayload
);
// New staff account is now ready to display in StaffList
```

### 2. Get Created Staff in Staff List
```tsx
// StaffList.tsx or similar
const staffList = await apiUtils.get("/api/shift-service/staffs", {
    branchId: managerBranchId,
    status: "ACTIVE"
});
```

### 3. Update Staff Details
```tsx
// When staff details need updating
const updatedStaff = await apiUtils.put(
    `/api/shift-service/staffs/${staffId}`,
    { gender, dateOfBirth, address, ...moreFields }
);
```

## 📝 Form Fields for Staff Creation

Manager form requires:
- **Full Name** (name)
- **Email** (email) - used for login
- **Password** (password) - initial password
- **Phone** (phone)
- **Address** (address)
- **Gender** (gender)
- **Date of Birth** (dateOfBirth)
- **Branch** (branchId/franchiseId)

## 🔧 How to Extend - Additional Features

### 1. Add Staff Search/Filter
```tsx
// In StaffList.tsx
const searchStaff = async (keyword) => {
    const response = await apiUtils.get("/api/shift-service/staffs", {
        branchId: managerBranchId,
        search: keyword,
        status: "ACTIVE"
    });
};
```

### 2. Add Staff Status Management
```tsx
// Change staff status (ACTIVE, INACTIVE, etc.)
const updateStaffStatus = async (staffId, newStatus) => {
    await apiUtils.patch(
        `/api/shift-service/staffs/${staffId}/status`,
        { status: newStatus }
    );
};
```

### 3. Add Bulk Operations
```tsx
// Assign multiple staffs to shifts
const assignStaffToShift = async (staffIds, shiftId) => {
    await apiUtils.post(
        "/api/shift-service/shift-assignments",
        { staffIds, shiftId }
    );
};
```

## 🔄 Difference: Manager vs Admin Staff Creation

| Aspect | Manager | Admin |
|--------|---------|-------|
| **Endpoint** | `/api/auth-service/users/create-account` | `/api/auth-service/users/create-account` |
| **Role** | "STAFF" (fixed) | CUSTOMER, STAFF, MANAGER, SUPPLIER, etc. |
| **Branch** | From logged-in manager's franchise | Can select any franchise |
| **Scope** | Only for own franchise | Can create for any franchise |
| **URL Redirect** | `/manager/staff` | `/admin/users` or specific page |

## 📊 Data Dependencies

```
Auth-Service (User Account)
    ↓
Shift-Service (Staff Profile & Schedule)
    ↓
Attendance-Service (Attendance Records)
```

When a new staff is created:
1. Auth-Service creates user account
2. Shift-Service syncs and stores staff profile
3. Attendance-Service ready to track records

## 🚨 Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "POST is not supported" | Wrong endpoint/method | Use `/create-account` not `/register` |
| "franchiseId is required" | Missing branch selection | Ensure user selects a branch |
| "Invalid email/password" | Format validation | Check email format, password >= 6 chars |
| "Email already exists" | Duplicate email | Verify email is unique |
| "Unauthorized" | Token expired | User needs to login again |

## 🎯 Next Steps to Complete

- [ ] Create staff list page with search/filter
- [ ] Add staff detail/edit page
- [ ] Implement staff status toggle
- [ ] Add staff assignment to shifts
- [ ] Create staff attendance tracking
- [ ] Add staff performance dashboard

## 📚 Related Documentation

- [Auth Service Docs](./AUTH_TEST_GUIDE.md)
- [Shift Service Docs](./PRODUCT_FEATURE_MERGE.md)
- [API Endpoints Reference](./src/constants/apiEndPoints.ts)
