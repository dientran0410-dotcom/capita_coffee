import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  History,
} from "lucide-react";
import { getAllRedemption } from "../../../services/RedemptionService";

type RedeemStatus =
  | "COMPLETED"
  | "PENDING"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | "CLAIMED"
  | "USED"
  | "DELIVERED"
  | "SHIPPED"
  | "UNKNOWN";

interface RedeemRecord {
  id: string;
  customerId?: string;
  customerName?: string;
  reward: string;
  promotion: string;
  code: string;
  points: number;
  redeemedAt: string;
  expiresText: string;
  status: RedeemStatus;
}

const statusClasses: Record<RedeemStatus, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
  EXPIRED: "bg-zinc-100 text-zinc-500",
  CANCELLED: "bg-zinc-200 text-zinc-600",
  CLAIMED: "bg-emerald-100 text-emerald-700",
  USED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-cyan-100 text-cyan-700",
  SHIPPED: "bg-violet-100 text-violet-700",
  UNKNOWN: "bg-zinc-200 text-zinc-600",
};

const toUiStatus = (value: string | null | undefined): RedeemStatus => {
  const normalized = (value || "").toUpperCase();
  if (normalized in statusClasses) return normalized as RedeemStatus;
  return "UNKNOWN";
};

export default function RedeemManagement() {
  const [records, setRecords] = useState<RedeemRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<RedeemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRedemptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, searchQuery, statusFilter]);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const data = await getAllRedemption();

      const mapped: RedeemRecord[] = (data || []).map((item: any) => ({
        id: item.id || "",
        customerId: item.customerId || "",
        customerName: item.customerName || "Unknown",
        reward: item.rewardName || item.reward || "N/A",
        promotion: item.promotionName || item.promotion || "-",
        code: item.code || item.redemptionCode || "-",
        points: item.pointsUsed || item.points || 0,
        redeemedAt: item.redeemedAt || item.createdAt || "",
        expiresText: item.expiresAt || "No expiration",
        status: toUiStatus(item.status),
      }));

      setRecords(mapped);
    } catch (error) {
      console.error("Failed to fetch redemptions:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.reward.toLowerCase().includes(query) ||
          r.code.toLowerCase().includes(query) ||
          r.customerName?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedRecords = filteredRecords.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redemption Management</h1>
          <p className="text-sm text-gray-500">View and manage all customer redemptions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reward, code, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLAIMED">Claimed</option>
            <option value="USED">Used</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{displayedRecords.length}</span> of{" "}
        <span className="font-semibold text-gray-900">{filteredRecords.length}</span> redemptions
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading redemptions...</div>
        ) : displayedRecords.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No redemptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Reward
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Redeemed At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {record.customerName || "Unknown"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{record.reward}</td>
                    <td className="px-4 py-4 text-sm font-mono text-gray-600">{record.code}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-purple-600">
                      {record.points.toLocaleString()} pts
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(record.redeemedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          statusClasses[record.status]
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
