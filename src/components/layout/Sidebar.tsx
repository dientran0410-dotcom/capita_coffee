import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  ClipboardList,
  Clock3,
  Coffee,
  FileText,
  Gift,
  LayoutDashboard,
  Package,
  Bell,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  History,
  Settings,
  LogOut,
  TicketCheck,
  Loader,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type UserRole = "admin" | "staff" | "supplier" | "manager" | "customer";

interface SideBarProps {
  userRole: UserRole;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const menuByRole: Record<UserRole, MenuItem[]> = {
    admin: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin/dashboard" },
      { id: "franchises", label: "Franchises", icon: <Building2 size={20} />, path: "/admin/franchises" },
      { id: "contracts", label: "Contracts", icon: <FileText size={20} />, path: "/admin/contracts" },
      { id: "orders", label: "Orders", icon: <ClipboardList size={20} />, path: "/admin/orders" },
      { id: "products", label: "Products", icon: <Package size={20} />, path: "/admin/products" },
    { id: "warehouseMapping", label: "Warehouse Mapping", icon: <Warehouse size={20} />, path: "/admin/warehouse-mapping" },
    { id: "warehouse", label: "Warehouse", icon: <Warehouse size={20} />, path: "/admin/warehouse" },
    { id: "suppliers", label: "Suppliers", icon: <Truck size={20} />, path: "/admin/suppliers" },
    { id: "coupons", label: "Coupons", icon: <Calendar size={20} />, path: "/admin/coupons" },
    { id: "promotions", label: "Promotions", icon: <Gift size={20} />, path: "/admin/promotions" },
    { id: "loyalty", label: "Loyalty", icon: <Users size={20} />, path: "/admin/loyalty" },
    { id: "rewards", label: "Rewards", icon: <Gift size={20} />, path: "/admin/rewards" },
    { id: "redeem", label: "Redeem", icon: <History size={20} />, path: "/admin/redeem" },
    { id: "users", label: "User Management", icon: <Users size={20} />, path: "/admin/users" },
    { id: "permissions", label: "Permission Management", icon: <Lock size={20} />, path: "/admin/permissions" },
    { id: "reports", label: "Reports", icon: <FileText size={20} />, path: "/admin/reports" },
    { id: "notification", label: "Notification", icon: <Bell size={20} />, path: "/admin/notification" },
  ],
  manager: [
    { id: "franchises", label: "Franchises", icon: <Building2 size={20} />, path: "/manager" },
    { id: "franchiseConfig", label: "Franchise Config", icon: <Settings size={20} />, path: "/manager/franchise-config" },
    { id: "staff", label: "Staff", icon: <Users size={20} />, path: "/manager/staff/list" },
    { id: "staffSchedules", label: "Staff Schedules", icon: <Calendar size={20} />, path: "/manager/staff/schedules" },
    { id: "shifts", label: "Shifts", icon: <Clock3 size={20} />, path: "/manager/shifts" },
    { id: "assignStaff", label: "Assign Staff", icon: <UserCheck size={20} />, path: "/manager/assign-staff" },
    { id: "attendance", label: "Attendance", icon: <UserCheck size={20} />, path: "/manager/attendance" },
    { id: "attendanceReport", label: "Attendance Report", icon: <FileText size={20} />, path: "/manager/attendance/report" },
    { id: "supplierRequest", label: "Supplier Request", icon: <Truck size={20} />, path: "/manager/supplier-request" },
    { id: "inventory", label: "Inventory", icon: <Warehouse size={20} />, path: "/manager/inventory" },
  ],
  staff: [
    // { id: "shop", label: "Shop", icon: <Coffee size={20} />, path: "/staff" },
    // { id: "cart", label: "Cart", icon: <Package size={20} />, path: "/staff/cart" },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/staff/portal" },
    { id: "order", label: "Order", icon: <Package size={20} />, path: "/staff/portal/order" },
    // { id: "pod", label: "POD", icon: <Coffee size={20} />, path: "/staff/portal/pod" },
    { id: "scan", label: "Scan QR", icon: <Package size={20} />, path: "/staff/portal/scan" },
    { id: "schedule", label: "Schedule", icon: <Calendar size={20} />, path: "/staff/portal/schedule" },
    { id: "attendance", label: "Attendance", icon: <ClipboardList size={20} />, path: "/staff/portal/attendance" },
    { id: "report", label: "Report", icon: <FileText size={20} />, path: "/staff/portal/report" },
  ],
  supplier: [
    { id: "products", label: "Products", icon: <Package size={20} />, path: "/supplier" },
    { id: "warehouseRequests", label: "Warehouse Requests", icon: <Warehouse size={20} />, path: "/supplier/warehouse-requests" },
    { id: "account", label: "Account Management", icon: <Settings size={20} />, path: "/supplier/account" },
  ],
  customer: [
    { id: "home", label: "Home", icon: <Coffee size={20} />, path: "/customer" },
    { id: "portal", label: "My Portal", icon: <History size={20} />, path: "/customer/portal/my-portal" },
    { id: "coupons", label: "Coupons", icon: <Calendar size={20} />, path: "/customer/portal/coupons" },
    { id: "appliedCoupons", label: "Applied Coupons", icon: <TicketCheck size={20} />, path: "/customer/portal/applied-coupons" },
    { id: "orders", label: "My Orders", icon: <FileText size={20} />, path: "/customer/portal/my-orders" },
    { id: "delivery", label: "Track Delivery", icon: <History size={20} />, path: "/customer/portal/track-delivery" },
    { id: "nearby", label: "Nearby Stores", icon: <History size={20} />, path: "/customer/portal/nearby-stores" },
    { id: "offers", label: "Reward Offers", icon: <Gift size={20} />, path: "/customer/portal/reward-offers" },
    { id: "history", label: "Redeem History", icon: <History size={20} />, path: "/customer/portal/redeem-history" },
    { id: "membership", label: "Member Ship", icon: <History size={20} />, path: "/customer/portal/membership" },
  ],
};

const roleLabel: Record<UserRole, string> = {
  admin: "Admin Panel",
  manager: "Manager Panel",
  staff: "Staff Portal",
  supplier: "Supplier Portal",
  customer: "Customer Portal",
};

const SideBar = ({ userRole }: SideBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = useMemo(() => menuByRole[userRole] ?? [], [userRole]);

  const isActive = (path: string) => {
    // For exact match routes (base routes without sub-pages)
    if (path === "/manager" || path === "/staff" || path === "/supplier" || path === "/customer") {
      return location.pathname === path;
    }
    // For routes with sub-pages
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-click
    
    setIsLoggingOut(true);
    try {
      await logout(); // Wait for logout to complete
      console.log('[Sidebar] Logout successful, redirecting to home');
      navigate("/home");
    } catch (error) {
      console.error('[Sidebar] Logout error:', error);
      // Still redirect even if logout fails
      navigate("/home");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-6">
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-emerald-600 to-emerald-800 text-white shadow-md">
            <Coffee size={24} fill="currentColor" strokeWidth={0} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Capital Coffee</h2>
            <p className="text-xs text-gray-500">{roleLabel[userRole]}</p>
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex w-full items-start gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className={active ? "text-white" : "text-gray-500"}>{item.icon}</span>
                <span className="flex-1 text-left whitespace-normal wrap-break-word leading-5">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            isLoggingOut
              ? "bg-red-200 text-red-600 cursor-not-allowed opacity-60"
              : "bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md"
          }`}
        >
          {isLoggingOut ? (
            <Loader size={20} className="animate-spin" />
          ) : (
            <LogOut size={20} />
          )}
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>

      <div className="border-t border-gray-200 bg-white p-4 text-center text-xs text-gray-500">
        <p>Capital Coffee Management</p>
        <p className="mt-1">(c) 2026 Capital Coffee</p>
      </div>
    </aside>
  );
};

export default SideBar;
