/**
 * MOCK AUTHENTICATION HELPER
 *
 * Copy và paste đoạn code tương ứng với role bạn muốn test vào Console (F12)
 */

// ========================================
// ADMIN ROLE
// ========================================
function loginAsAdmin() {
  localStorage.clear();
  localStorage.setItem("token", "mock-admin-token-123");
  localStorage.setItem("user", JSON.stringify({
    id: 1,
    name: "Admin User",
    email: "admin@capitalcoffee.com",
    roleName: "admin"
  }));
  console.log("✅ Logged in as ADMIN");
  window.location.href = "/admin/dashboard";
}

// ========================================
// CUSTOMER ROLE
// ========================================
function loginAsCustomer() {
  localStorage.clear();
  localStorage.setItem("token", "mock-customer-token-456");
  localStorage.setItem("user", JSON.stringify({
    id: 2,
    name: "Customer User",
    email: "customer@example.com",
    roleName: "customer"
  }));
  console.log("✅ Logged in as CUSTOMER");
  window.location.href = "/customer/dashboard";
}

// ========================================
// STAFF ROLE
// ========================================
function loginAsStaff() {
  localStorage.clear();
  localStorage.setItem("token", "mock-staff-token-789");
  localStorage.setItem("user", JSON.stringify({
    id: 3,
    name: "Staff User",
    email: "staff@capitalcoffee.com",
    roleName: "staff"
  }));
  console.log("✅ Logged in as STAFF");
  window.location.href = "/staff/scan";
}

// ========================================
// MANAGER ROLE
// ========================================
function loginAsManager() {
  localStorage.clear();
  localStorage.setItem("token", "mock-manager-token-101");
  localStorage.setItem("user", JSON.stringify({
    id: 4,
    name: "Manager User",
    email: "manager@capitalcoffee.com",
    roleName: "manager"
  }));
  console.log("✅ Logged in as MANAGER");
  window.location.href = "/manager/checkout";
}

// ========================================
// SUPPLIER ROLE
// ========================================
function loginAsSupplier() {
  localStorage.clear();
  localStorage.setItem("token", "mock-supplier-token-202");
  localStorage.setItem("user", JSON.stringify({
    id: 5,
    name: "Supplier User",
    email: "supplier@example.com",
    roleName: "supplier"
  }));
  console.log("✅ Logged in as SUPPLIER");
  window.location.href = "/supplier/checkout";
}

// ========================================
// LOGOUT
// ========================================
function logout() {
  localStorage.clear();
  console.log("✅ Logged out");
  window.location.href = "/home";
}

// ========================================
// USAGE INSTRUCTIONS
// ========================================
console.log(`
╔═══════════════════════════════════════════════════════════╗
║         MOCK AUTHENTICATION HELPER                        ║
╚═══════════════════════════════════════════════════════════╝

Copy và paste một trong các lệnh sau vào Console:

🔐 Login as different roles:
   loginAsAdmin()      → /admin/dashboard
   loginAsCustomer()   → /customer/checkout
   loginAsStaff()      → /staff/scan
   loginAsManager()    → /manager/checkout
   loginAsSupplier()   → /supplier/checkout

🚪 Logout:
   logout()            → /home

📋 Check current user:
   console.log(JSON.parse(localStorage.getItem('user')))
`);
