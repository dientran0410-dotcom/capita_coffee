// Simple in-memory mock "database" for customer data.
// Intended for demo/mock behavior only.

export const mockCustomers = [
  {
    id: "CUS-001",
    name: "Nguyễn Văn A",
    email: "nguyena@email.com",
    phone: "0912345678",
    address: "123 Lê Lợi, Quận 1, TP.HCM",
    status: "active",
    lastOrder: "2026-03-10",
    totalSpent: 15000000,
    membershipTier: "Gold",
    loyaltyPoints: 1200,
    totalOrders: 18,
    memberSince: "2023-04-15",
  },
  {
    id: "CUS-002",
    name: "Trần Thị B",
    email: "tranb@email.com",
    phone: "0987654321",
    address: "456 Nguyễn Huệ, Quận 1, TP.HCM",
    status: "active",
    lastOrder: "2026-03-08",
    totalSpent: 8500000,
    membershipTier: "Silver",
    loyaltyPoints: 720,
    totalOrders: 12,
    memberSince: "2023-07-02",
  },
  {
    id: "CUS-003",
    name: "Lê Minh C",
    email: "leminc@email.com",
    phone: "0933333333",
    address: "789 Trần Phú, Quận 5, TP.HCM",
    status: "inactive",
    lastOrder: "2026-01-15",
    totalSpent: 3200000,
    membershipTier: "Bronze",
    loyaltyPoints: 240,
    totalOrders: 5,
    memberSince: "2024-01-12",
  },
  {
    id: "CUS-004",
    name: "Phạm Hòa D",
    email: "phamd@email.com",
    phone: "0944444444",
    address: "10 Phạm Ngọc Thạch, Quận 3, TP.HCM",
    status: "active",
    lastOrder: "2026-03-12",
    totalSpent: 22100000,
    membershipTier: "Platinum",
    loyaltyPoints: 2480,
    totalOrders: 32,
    memberSince: "2022-09-30",
  },
  {
    id: "CUS-005",
    name: "Hoàng Linh E",
    email: "linhh@email.com",
    phone: "0955555555",
    address: "22 Lý Tự Trọng, Quận 1, TP.HCM",
    status: "locked",
    lastOrder: "2025-12-20",
    totalSpent: 1500000,
    membershipTier: "Bronze",
    loyaltyPoints: 90,
    totalOrders: 2,
    memberSince: "2025-05-05",
  },
];

export function getCustomers(user: any) {
  return new Promise((resolve) => {
    // Admin can see all customers; a customer only sees their own record
    const customers =
      user?.role === "ADMIN"
        ? mockCustomers
        : user?.role === "CUSTOMER"
        ? mockCustomers.filter((c) => c.id === user.id)
        : [];

    resolve({ data: { customers, totalItems: customers.length } });
  });
}

export function getCustomerById(customerId: any) {
  return new Promise((resolve) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    resolve({ data: customer || null });
  });
}

export function updateCustomer(customerId: any, updates: any) {
  return new Promise((resolve) => {
    const index = mockCustomers.findIndex((c) => c.id === customerId);
    if (index !== -1) {
      mockCustomers[index] = { ...mockCustomers[index], ...updates };
      resolve({ data: mockCustomers[index] });
    } else {
      resolve({ data: null });
    }
  });
}

export function deleteCustomer(customerId: any) {
  return new Promise((resolve) => {
    const index = mockCustomers.findIndex((c) => c.id === customerId);
    if (index !== -1) {
      mockCustomers.splice(index, 1);
      resolve({ data: { success: true } });
    } else {
      resolve({ data: { success: false } });
    }
  });
}
