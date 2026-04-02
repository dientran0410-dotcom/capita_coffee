import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { 
  searchCustomers,
  getAllCustomerProfiles,
  lockCustomerAccount,
  unlockCustomerAccount
} from "../../../services/customerService";
import {
  changeUserRole,
  deactivateUser,
  deleteUser,
} from "../../../services/UserManagementService";
import api from "../../../api/axios";
import { CreateCustomerForm } from "./CreateCustomerForm";
import { ChangeRoleModal } from "./ChangeRoleModal";
import AdminCustomerDetailPage from "./AdminCustomerDetailPage";
import ActionDropdown from "../../../components/ActionDropdown";
import type { Customer } from "../../../types/customer";

// ============================================================
// TEMPORARY FEATURE FLAG: Hide INACTIVE status from UI
// TODO: Remove this flag once backend status flow is fixed
// Reason: Current backend logic converts INACTIVE to LOCKED unexpectedly
// ============================================================
const SHOW_INACTIVE_STATUS = false;

// ============================================================
// Helper function to compute status counts
// ============================================================
const computeCustomerSummaryStats = (customers: Customer[]) => {
  const counts = {
    total: customers.length,
    active: 0,
    inactive: 0,
    locked: 0,
  };
  customers.forEach((c) => {
    if (c.status === "ACTIVE") counts.active++;
    else if (c.status === "INACTIVE") counts.inactive++;
    else if (c.status === "LOCKED") counts.locked++;
  });
  return counts;
};

// Helper to filter customers by status
const filterCustomersByStatus = (customers: Customer[], statusFilter: string): Customer[] => {
  if (statusFilter === "ALL" || statusFilter === "") {
    return customers;
  }
  return customers.filter(c => c.status === statusFilter);
};

// Helper to filter customers by role
const filterCustomersByRole = (customers: Customer[], roleFilter: string): Customer[] => {
  if (roleFilter === "ALL" || roleFilter === "") {
    return customers;
  }
  return customers.filter(c => c.role === roleFilter);
};

// Helper to search customers locally
const filterCustomersBySearch = (customers: Customer[], searchTerm: string): Customer[] => {
  if (!searchTerm) return customers;
  const lowerSearch = searchTerm.toLowerCase();
  return customers.filter(c =>
    (c.name || "").toLowerCase().includes(lowerSearch) ||
    (c.email || "").toLowerCase().includes(lowerSearch) ||
    (c.phone || "").toLowerCase().includes(lowerSearch)
  );
};

export default function AdminCustomerListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ========== PAGINATED DATA (for table display) ==========
  const [paginatedCustomers, setPaginatedCustomers] = useState<Customer[]>([]);
  
  // ========== FULL DATASET (for stats computation) ==========
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  
  // ========== FILTERING & SEARCH STATE ==========
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [error, setError] = useState<string | null>(null);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ========== EFFECT 1: Load full customer list for stats ==========
  useEffect(() => {
    const loadStatsData = async () => {
      try {
        setStatsLoading(true);
        
        console.log('[AdminCustomerListPage] Loading all customers for stats calculation');
        
        const res = await getAllCustomerProfiles();
        
        console.log('[AdminCustomerListPage] getAllCustomerProfiles result:', {
          success: res.success,
          dataLength: res.data?.length
        });
        
        if (res.success && res.data) {
          // Log detailed account status information
          console.log('[AdminCustomerListPage] All customers loaded:', {
            totalCount: res.data.length,
            statusBreakdown: {
              active: res.data.filter(c => c.status === "ACTIVE").length,
              inactive: res.data.filter(c => c.status === "INACTIVE").length,
              locked: res.data.filter(c => c.status === "LOCKED").length,
              suspended: res.data.filter(c => c.status === "SUSPENDED").length,

            },
            sampleAccounts: res.data.slice(0, 3).map(c => ({
              id: c.id,
              name: c.name,
              status: c.status,
              email: c.email
            }))
          });
          setAllCustomers(res.data);
        } else {
          console.warn('[AdminCustomerListPage] Failed to load all customers for stats');
          setAllCustomers([]);
        }
      } catch (error) {
        console.error('[AdminCustomerListPage] Error loading all customers:', error);
        setAllCustomers([]);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      loadStatsData();
    }
  }, [user, refreshTrigger]);

  // ========== EFFECT 1.5: Reset pagination when filters change ==========
  // Whenever search, status, or role filter changes, reset to page 1
  // This happens BEFORE Effect 2 loads data, so Effect 2 will use currentPage=1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  // ========== EFFECT 2: Load paginated data for table ==========
  // Strategy: 
  // 1. Call API with all filters including role (in case backend supports it)
  // 2. Apply role filter locally (as safety net if backend doesn't support)
  // 3. Paginate on the filtered result, NOT on raw API result
  useEffect(() => {
    const loadPaginatedData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[AdminCustomerListPage] Loading paginated customers:', {
          searchTerm,
          statusFilter,
          roleFilter,
          currentPage,
          itemsPerPage
        });

        // Try to pass roleFilter to API (for backend support)
        const res = await searchCustomers({
          name: searchTerm,
          status: statusFilter === "ALL" ? "" : statusFilter,
          role: roleFilter === "ALL" ? "" : roleFilter,
          page: 1, // Always fetch first page to get full data for local filtering
          size: 10000, // Large pagesize to get more data (adjust if needed)
        });

        console.log('[AdminCustomerListPage] searchCustomers result:', {
          success: res.success,
          contentLength: res.data?.content?.length,
          totalElements: res.data?.totalElements,
          totalPages: res.data?.totalPages
        });

        if (res.success && res.data?.content) {
          // Get items from this page
          let items = res.data.content || [];
          
          // IMPORTANT: Apply role filter locally as well (API may not support it yet)
          if (roleFilter !== "ALL") {
            items = items.filter(c => c.role === roleFilter);
          }
          
          console.log('[AdminCustomerListPage] After local role filtering:', {
            filteredCount: items.length,
            originalCount: res.data.content?.length
          });
          
          // Now apply pagination on the filtered items
          const totalFilteredItems = items.length;
          const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
          
          // Extract current page subset
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const pageItems = items.slice(startIndex, endIndex);
          
          console.log('[AdminCustomerListPage] Pagination applied:', {
            totalFilteredItems,
            totalPages,
            currentPage,
            pageItemsCount: pageItems.length,
            startIndex,
            endIndex
          });
          
          setPaginatedCustomers(pageItems);
          setTotalPages(totalPages);
          setTotalItems(totalFilteredItems);
        } else {
          console.warn('[AdminCustomerListPage] Search API returned success: false', res);
          setPaginatedCustomers([]);
          setError('Failed to load customers: API returned false');
          setTotalPages(1);
          setTotalItems(0);
        }
      } catch (error) {
        console.error('[AdminCustomerListPage] Error loading paginated customers:', {
          status: error?.response?.status,
          message: error?.response?.data?.message || error?.message,
          userRole: user?.role
        });
        setError("Failed to load customers. Please try again.");
        setPaginatedCustomers([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPaginatedData();
    }
  }, [user, searchTerm, statusFilter, roleFilter, currentPage, refreshTrigger]);

  // ============ ACTION HANDLERS ============

  const handleDeactivateClick = async (customerId: string) => {
    if (!confirm("Are you sure you want to deactivate this customer?")) return;
    try {
      setIsActionLoading(true);
      console.log("[AdminCustomerListPage] ===== DEACTIVATE START =====");
      console.log("[AdminCustomerListPage] Deactivating customer:", customerId);
      
      const response = await deactivateUser(customerId);
      console.log("[AdminCustomerListPage] Deactivate response:", response);
      
      if (response.success) {
        console.log("[AdminCustomerListPage] Deactivate SUCCESS - setting status to INACTIVE");
        
        // Update both datasets
        setAllCustomers((prev) => {
          const updated = prev.map((c) => {
            if (c.id === customerId) {
              console.log("[AdminCustomerListPage] Updating allCustomers:", customerId, "from", c.status, "to INACTIVE");
              return { ...c, status: "INACTIVE" };
            }
            return c;
          });
          console.log("[AdminCustomerListPage] After allCustomers update, customer:", updated.find(c => c.id === customerId));
          return updated;
        });
        
        setPaginatedCustomers((prev) => {
          const updated = prev.map((c) => {
            if (c.id === customerId) {
              console.log("[AdminCustomerListPage] Updating paginatedCustomers:", customerId, "from", c.status, "to INACTIVE");
              return { ...c, status: "INACTIVE" };
            }
            return c;
          });
          console.log("[AdminCustomerListPage] After paginatedCustomers update, customer:", updated.find(c => c.id === customerId));
          return updated;
        });
        console.log("[AdminCustomerListPage] ===== DEACTIVATE END =====");
        alert("Customer deactivated successfully");
      } else {
        console.error("[AdminCustomerListPage] Deactivate FAILED:", response.message);
        alert(response.message || "Failed to deactivate customer");
      }
    } catch (error) {
      console.error("[AdminCustomerListPage] Error deactivating customer:", error);
      alert("Failed to deactivate customer");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteClick = async (customerId: string) => {
    // Find customer to check status
    const customer = paginatedCustomers.find(c => c.id === customerId);
    
    // Check if customer must be deactivated first
    if (customer && customer.status === "ACTIVE") {
      alert("This customer account is currently active. You must deactivate the account before deleting.\n\nPlease click 'Lock Account' or 'Deactivate' first.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone."))
      return;
    try {
      setIsActionLoading(true);
      const response = await deleteUser(customerId);
      if (response.success) {
        // Update both datasets
        setAllCustomers((prev) => prev.filter((c) => c.id !== customerId));
        setPaginatedCustomers((prev) => prev.filter((c) => c.id !== customerId));
        alert("Customer deleted successfully");
      } else {
        alert(response.message || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ============ LOCK ACCOUNT ============
  const handleLockClick = async (customerId: string) => {
    if (!confirm("Are you sure you want to lock this customer account?")) return;
    try {
      setIsActionLoading(true);
      console.log("[AdminCustomerListPage] ===== LOCK START =====");
      console.log("[AdminCustomerListPage] Locking customer:", customerId);
      
      const response = await lockCustomerAccount(customerId, "Locked from admin panel");
      console.log("[AdminCustomerListPage] Lock response:", response);
      
      if (response.success) {
        console.log("[AdminCustomerListPage] Lock SUCCESS - setting status to LOCKED");
        
        // Update both datasets with LOCKED status
        setAllCustomers((prev) => {
          const updated = prev.map((c) => {
            if (c.id === customerId) {
              console.log("[AdminCustomerListPage] Updating allCustomers:", customerId, "from", c.status, "to LOCKED");
              return { ...c, status: "LOCKED" };
            }
            return c;
          });
          console.log("[AdminCustomerListPage] After allCustomers update, customer:", updated.find(c => c.id === customerId));
          return updated;
        });
        
        setPaginatedCustomers((prev) => {
          const updated = prev.map((c) => {
            if (c.id === customerId) {
              console.log("[AdminCustomerListPage] Updating paginatedCustomers:", customerId, "from", c.status, "to LOCKED");
              return { ...c, status: "LOCKED" };
            }
            return c;
          });
          console.log("[AdminCustomerListPage] After paginatedCustomers update, customer:", updated.find(c => c.id === customerId));
          return updated;
        });
        console.log("[AdminCustomerListPage] ===== LOCK END =====");
        alert("Customer account locked successfully");
      } else {
        console.error("[AdminCustomerListPage] Lock FAILED:", response.message);
        alert(response.message || "Failed to lock customer account");
      }
    } catch (error) {
      console.error("[AdminCustomerListPage] Error locking customer:", error);
      alert("Failed to lock customer account");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ============ UNLOCK ACCOUNT ============
  const handleUnlockClick = async (customerId: string) => {
    if (!confirm("Are you sure you want to unlock this customer account?")) return;
    try {
      setIsActionLoading(true);
      const response = await unlockCustomerAccount(customerId, "Unlocked from admin panel");
      if (response.success) {
        // Update both datasets back to ACTIVE status
        setAllCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, status: "ACTIVE" } : c))
        );
        setPaginatedCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, status: "ACTIVE" } : c))
        );
        alert("Customer account unlocked successfully");
      } else {
        alert(response.message || "Failed to unlock customer account");
      }
    } catch (error) {
      console.error("Error unlocking customer:", error);
      alert("Failed to unlock customer account");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ============ REACTIVATE ACCOUNT ============
  const handleReactivateClick = async (customerId: string) => {
    if (!confirm("Are you sure you want to reactivate this customer account?")) return;
    try {
      setIsActionLoading(true);
      const response = await api.patch(`/api/auth-service/users/${customerId}/activate`);
      if (response.data?.success) {
        // Update both datasets back to ACTIVE status
        setAllCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, status: "ACTIVE" } : c))
        );
        setPaginatedCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, status: "ACTIVE" } : c))
        );
        alert("Customer account reactivated successfully");
      } else {
        alert(response.data?.message || "Failed to reactivate customer account");
      }
    } catch (error) {
      console.error("Error reactivating customer:", error);
      alert("Failed to reactivate customer account");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ============ STATS COMPUTATION (from FULL dataset, not current page) ============
  
  // Get filtered full dataset based on current search and status filter
  const filteredFullDataset = filterCustomersBySearch(
    filterCustomersByStatus(allCustomers, statusFilter),
    searchTerm
  );
  
  // Compute stats from full filtered dataset (NOT current page)
  const counts = computeCustomerSummaryStats(filteredFullDataset);
  
  // Debug logging
  useEffect(() => {
    console.log("[AdminCustomerListPage] Stats recalculated:", {
      totalCustomers: allCustomers.length,
      filteredDataset: filteredFullDataset.length,
      counts: counts,
      statusFilter: statusFilter,
      searchTerm: searchTerm,
    });
  }, [counts, allCustomers.length, filteredFullDataset.length, statusFilter, searchTerm]);

  // ============ STATUS BADGE & LABEL ============

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      LOCKED: "bg-red-100 text-red-800",
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  // Status label mapping for display
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: "Active",
      // TEMPORARILY HIDDEN: Inactive label - see SHOW_INACTIVE_STATUS flag
      // INACTIVE: "Inactive",
      LOCKED: "Locked",
    };
    const result = labels[status] || status;
    if (process.env.NODE_ENV === 'development' && (status === "INACTIVE" || status === "LOCKED")) {
      console.log(`[AdminCustomerListPage] getStatusLabel('${status}') =>  '${result}'`);
    }
    return result;
  };

  // Role badge styling
  const getRoleBadge = (role: string | undefined) => {
    const variants: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-800",
      MANAGER: "bg-purple-100 text-purple-800",
      SUPPLIER: "bg-green-100 text-green-800",
      WAREHOUSE_MANAGER: "bg-blue-100 text-blue-800",
      INVENTORY_MANAGER: "bg-cyan-100 text-cyan-800",
      CUSTOMER: "bg-blue-100 text-blue-800",
    };
    return variants[role || "CUSTOMER"] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage user information and status
          </p>
        </div>
        </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {counts.total}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {counts.active}
          </p>
        </div>
        {/* TEMPORARILY HIDDEN: Inactive card - see SHOW_INACTIVE_STATUS flag */}
        {/* <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-600 mt-2">
            {counts.inactive}
          </p>
        </div> */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Locked</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {counts.locked}
          </p>
        </div>
      </div>

      {/* Create User Form */}
      <CreateCustomerForm
        franchiseId={user?.franchiseId || ""}
        onSuccess={() => {
          setCurrentPage(1);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex gap-4 flex-wrap items-end">
          {/* Search Input */}
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                const newFilter = e.target.value;
                console.log('[AdminCustomerListPage] Status filter changed:', {
                  from: statusFilter,
                  to: newFilter,
                  allCustomersCount: allCustomers.length,
                  allCustomersByStatus: {
                    active: allCustomers.filter(c => c.status === "ACTIVE").length,
                    // TEMPORARILY HIDDEN: inactive count - see SHOW_INACTIVE_STATUS flag
                    // inactive: allCustomers.filter(c => c.status === "INACTIVE").length,
                    locked: allCustomers.filter(c => c.status === "LOCKED").length,
                  }
                });
                setStatusFilter(newFilter);
                setCurrentPage(1); // Reset to page 1
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              {/* TEMPORARILY HIDDEN: Inactive filter option - see SHOW_INACTIVE_STATUS flag */}
              {SHOW_INACTIVE_STATUS && <option value="INACTIVE">Inactive</option>}
              <option value="LOCKED">Locked</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                const newFilter = e.target.value;
                console.log('[AdminCustomerListPage] Role filter changed:', {
                  from: roleFilter,
                  to: newFilter,
                });
                setRoleFilter(newFilter);
                setCurrentPage(1); // Reset to page 1
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
              <option value="INVENTORY_MANAGER">Inventory Manager</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">
            Loading users...
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No users found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // paginatedCustomers is already filtered by search + status + role + paginated
                  // No additional filtering needed here
                  if (paginatedCustomers.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center p-8 text-gray-600">
                          {loading
                            ? "Loading users..."
                            : "No users found matching the filters"}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  return paginatedCustomers.map((customer) => {
                  // Debug logging for each row
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[AdminCustomerListPage] Rendering row for ${customer.id}:`, {
                      id: customer.id,
                      name: customer.name,
                      status: customer.status,
                      role: customer.role,
                      statusLabel: customer.status === "ACTIVE" ? "Active" : 
                                     customer.status === "INACTIVE" ? "Inactive" :
                                     customer.status === "LOCKED" ? "Locked" :
                                     customer.status === "SUSPENDED" ? "Suspended" : customer.status
                    });
                  }
                  return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {customer.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell className="text-sm">{customer.email}</TableCell>
                    <TableCell className="text-sm">{customer.phone}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getRoleBadge(
                          customer.role
                        )}`}
                      >
                        {customer.role || "CUSTOMER"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                          customer.status
                        )}`}
                      >
                        {getStatusLabel(customer.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionDropdown
                          actions={[
                            {
                              label: "View",
                              onClick: () =>
                                navigate(
                                  `/admin/users/${customer.id}/view`,
                                  { state: { customer } }
                                ),
                              type: "detail",
                              disabled: isActionLoading,
                            },
                            {
                              label: "Edit",
                              onClick: () =>
                                navigate(
                                  `/admin/users/${customer.id}/edit`,
                                  { state: { customer } }
                                ),
                              type: "detail",
                              disabled: isActionLoading,
                            },
                            {
                              label: "Change Role",
                              onClick: () => {
                                setSelectedCustomer(customer);
                                setIsChangeRoleModalOpen(true);
                              },
                              type: "detail",
                              disabled: isActionLoading,
                            },
                            // ✅ LOCK ACTION - Available for non-locked accounts
                            ...(customer.status !== "LOCKED" ? [
                              {
                                label: "Lock Account",
                                onClick: () => handleLockClick(customer.id),
                                type: "danger",
                                disabled: isActionLoading,
                              },
                            ] : []),
                            // ✅ UNLOCK ACTION - Available only for locked accounts
                            ...(customer.status === "LOCKED" ? [
                              {
                                label: "Unlock Account",
                                onClick: () => handleUnlockClick(customer.id),
                                type: "default",
                                disabled: isActionLoading,
                              },
                            ] : []),
                            // TEMPORARILY HIDDEN: Reactivate action - see SHOW_INACTIVE_STATUS flag
                            // Note: INACTIVE status support is kept in code for future backend changes
                            ...(SHOW_INACTIVE_STATUS && customer.status === "INACTIVE" ? [
                              {
                                label: "Reactivate",
                                onClick: () => handleReactivateClick(customer.id),
                                type: "default",
                                disabled: isActionLoading,
                              },
                            ] : []),
                            {
                              label: "Delete",
                              onClick: () => handleDeleteClick(customer.id),
                              type: "danger",
                              disabled: isActionLoading || customer.status === "ACTIVE",
                            },
                          ]}
                        />
                    </TableCell>
                  </TableRow>
                  );
                });
                })()}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Page{" "}
                  <span className="font-medium">{currentPage}</span>
                  {" of "}
                  <span className="font-medium">{totalPages}</span>
                  {" | "}
                  Total{" "}
                  <span className="font-medium">{totalItems}</span>
                  {" items"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }).map(
                      (_, i) => {
                        const pageNum =
                          currentPage > 3 ? currentPage - 2 + i : i + 1;
                        return pageNum <= totalPages ? (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={
                              currentPage === pageNum
                                ? "bg-amber-600"
                                : ""
                            }
                          >
                            {pageNum}
                          </Button>
                        ) : null;
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => {
          setIsChangeRoleModalOpen(false);
          setSelectedCustomer(null);
        }}
        customerId={selectedCustomer?.id || ""}
        customerName={selectedCustomer?.name || ""}
        currentRole={selectedCustomer?.role || "CUSTOMER"}
        onSuccess={() => {
          // Reload customers list after role change
          if (user) {
            setCurrentPage(1);
            setRefreshTrigger((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
}
