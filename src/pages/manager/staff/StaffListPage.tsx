import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, ChevronDown, Users } from "lucide-react";
import {
  getManagerStaffList,
  searchStaff,
  updateStaffStatus,
  type StaffProfile,
  type StaffListResponse,
} from "@/services/managerStaffService";

export default function ManagerStaffListPage() {
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"" | "ACTIVE" | "INACTIVE" | "SUSPENDED">("");
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    total: 0,
    totalPages: 0,
  });

  // Load staff list
  const loadStaffList = async (page = 0, search = "") => {
    try {
      setLoading(true);
      let response: StaffListResponse;

      if (search) {
        response = await searchStaff(search, page, pagination.size);
      } else {
        response = await getManagerStaffList(page, pagination.size, {
          status: selectedStatus || undefined,
        });
      }

      setStaffList(response.content || []);
      setPagination({
        page,
        size: pagination.size,
        total: response.totalElements || 0,
        totalPages: response.totalPages || 0,
      });
    } catch (error: any) {
      console.error("Error loading staff:", error);
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStaffList(0);
  }, [selectedStatus]);

  // Search handling
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Debounce search
    const timer = setTimeout(() => {
      loadStaffList(0, value);
    }, 300);
    return () => clearTimeout(timer);
  };

  // Handle status change
  const handleStatusChange = async (staffId: string, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") => {
    try {
      await updateStaffStatus(staffId, newStatus);
      toast.success(`Staff status updated to ${newStatus}`);
      loadStaffList(pagination.page);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update staff status");
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayData = searchTerm ? staffList : staffList;
  const totalRecords = pagination.total;
  const currentPage = pagination.page + 1; // Convert to 1-based

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff members for your franchise</p>
        </div>
        <a
          href="/manager/staff/create"
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
        >
          <Plus size={18} />
          Add New Staff
        </a>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="col-span-1 md:col-span-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={16} />
          <span>
            Showing {Math.max(0, pagination.page * pagination.size + 1)} to{" "}
            {Math.min((pagination.page + 1) * pagination.size, totalRecords)} of {totalRecords} staff members
          </span>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading staff...</div>
        ) : staffList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No staff found</div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayData.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {staff.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {staff.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {staff.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative group">
                          <button
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(staff.status)}`}
                          >
                            {staff.status}
                            <ChevronDown size={14} />
                          </button>

                          {/* Dropdown Menu */}
                          <div className="hidden group-hover:block absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            {["ACTIVE", "INACTIVE", "SUSPENDED"].map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  handleStatusChange(staff.id, status as "ACTIVE" | "INACTIVE" | "SUSPENDED")
                                }
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                  staff.status === status ? "font-bold" : ""
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <a
                          href={`/manager/staff/${staff.id}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                          Edit
                        </a>
                        <button
                          onClick={() => {
                            // Implement delete logic
                            if (window.confirm(`Delete ${staff.name}?`)) {
                              toast.success("Staff deleted");
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <button
                  onClick={() => loadStaffList(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => loadStaffList(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
