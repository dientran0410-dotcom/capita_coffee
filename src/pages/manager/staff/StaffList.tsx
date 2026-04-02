import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Edit, Search, Mail, Phone, MapPin, RefreshCw, UserPlus, Trash2 } from "lucide-react";
import { getAllStaffs, updateStaffStatus as updateStaffStatusAPI, deleteStaff as deleteStaffAPI } from "@/services/staffService";
import { useAuth } from "@/context/AuthContext";

// IMPORT HOOK VÀ COMPONENT ĐỂ CHỌN CHI NHÁNH TƯƠNG TỰ CÁC TRANG KHÁC
import ManagerFranchiseSelector from "@/components/manager/ManagerFranchiseSelector";
import { useManagerBranchSelection } from "@/hooks/useManagerBranchSelection";
import { formatManagerBranchDisplay } from "@/services/managerBranchService";

// Types
interface StaffData {
    id: string;
    staffCode?: string;
    name: string;
    email?: string;
    phone?: string;
    gender: string;
    status: "ACTIVE" | "INACTIVE";
    branchId: string;
    [key: string]: unknown;
}

interface StatusCellProps {
    staffId: string;
    initialStatus: "ACTIVE" | "INACTIVE";
    onChanged?: (newStatus: "ACTIVE" | "INACTIVE") => void;
}

interface StatusConfig {
    label: string;
    badgeCls: string;
    dot: string;
    actionLabel: string;
    actionCls: string;
    next: "ACTIVE" | "INACTIVE";
}

interface StatusCfgMap {
    ACTIVE: StatusConfig;
    INACTIVE: StatusConfig;
}

interface DeleteConfirmModalState {
    staffId: string;
    staffName: string;
}

interface ApiResponse<T> {
    content?: T[];
    [key: string]: unknown;
}

const STATUS_CFG: StatusCfgMap = {
    ACTIVE: {
        label: "Working",
        badgeCls: "bg-green-100 text-green-700 border-green-200",
        dot: "bg-green-500",
        actionLabel: "Set Inactive",
        actionCls: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
        next: "INACTIVE",
    },
    INACTIVE: {
        label: "Inactive",
        badgeCls: "bg-gray-100 text-gray-500 border-gray-200",
        dot: "bg-gray-400",
        actionLabel: "Reactivate",
        actionCls: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
        next: "ACTIVE",
    },
};

function StatusCell({ staffId, initialStatus, onChanged }: StatusCellProps) {
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(initialStatus ?? "ACTIVE");
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.ACTIVE;

    async function doToggle() {
        setLoading(true);
        try {
            await updateStaffStatusAPI(staffId, cfg.next);
            setStatus(cfg.next);
            onChanged?.(cfg.next);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "Unknown error";
            alert("Error: " + errorMessage);
        } finally {
            setLoading(false);
            setConfirm(false);
        }
    }

    return (
        <div className="flex flex-col gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border w-fit ${cfg.badgeCls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
            </span>

            {confirm ? (
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={doToggle}
                        disabled={loading}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border transition-colors disabled:opacity-50 ${cfg.actionCls}`}
                    >
                        {loading ? "..." : "Confirm"}
                    </button>
                    <button
                        onClick={() => setConfirm(false)}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setConfirm(true)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border transition-colors w-fit ${cfg.actionCls}`}
                >
                    {cfg.actionLabel}
                </button>
            )}
        </div>
    );
}

export default function StaffList() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";

    // SỬ DỤNG HOOK QUẢN LÝ CHI NHÁNH NHƯ TRANG STAFF SCHEDULE
    const {
        branches,
        selectedBranch,
        selectedBranchId,
        branchDisplayMap,
        loading: loadingBranches,
        error: branchError,
        setSelectedBranchId,
    } = useManagerBranchSelection(authFranchiseId as string);
    const isBranchActive = selectedBranch?.isActive ?? false;

    const [staffs, setStaffs] = useState<StaffData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<DeleteConfirmModalState | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchStaffs = async (branchId: string) => {
        if (!branchId) {
            setStaffs([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await getAllStaffs(0, 1000, branchId) as unknown as ApiResponse<StaffData>;
            const list = data?.content || (Array.isArray(data) ? data : []);
            
            // Lọc ép ở Frontend để chắc chắn chỉ hiện nhân viên của chi nhánh đang chọn
            const filteredByBranch = list.filter(
                (staff: StaffData) => String(staff?.branchId || "").trim() === branchId
            );
            
            setStaffs(filteredByBranch);
        } catch {
            setStaffs([]);
        } finally {
            setLoading(false);
        }
    };

    // Lắng nghe khi người dùng đổi chi nhánh từ Dropdown
    useEffect(() => {
        if (selectedBranchId) {
            fetchStaffs(selectedBranchId);
        } else if (!loadingBranches) {
            setStaffs([]);
            setLoading(false);
        }
    }, [selectedBranchId, location.pathname, loadingBranches]);

    // Refresh khi quay lại tab
    useEffect(() => {
        const handleFocus = () => {
            if (!loading && selectedBranchId) {
                setTimeout(() => fetchStaffs(selectedBranchId), 500);
            }
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [loading, selectedBranchId]);

    const handleDeleteStaff = async () => {
        if (!deleteConfirmModal) return;

        setDeleteLoading(true);
        try {
            await deleteStaffAPI(deleteConfirmModal.staffId);
            // Xóa staff khỏi list
            setStaffs((prev) => prev.filter((s) => s.id !== deleteConfirmModal.staffId));
            // Đóng modal
            setDeleteConfirmModal(null);
        } catch (error: unknown) {
            const errorObj = error as Record<string, unknown>;
            const errorMessage =
                (errorObj?.fieldErrors as Record<string, unknown>)?.status ||
                errorObj?.message ||
                (errorObj?.response as Record<string, unknown>)?.data ||
                "Failed to delete staff";
            alert("Error: " + errorMessage);
        } finally {
            setDeleteLoading(false);
        }
    };

    const activeCount = staffs.filter((s) => s.status === "ACTIVE").length;
    const inactiveCount = staffs.filter((s) => s.status === "INACTIVE").length;

    const filtered = staffs.filter((s) => {
        const matchSearch =
            !searchTerm ||
            (s.staffCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.name || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const renderGender = (g: string) => {
        if (g === "MALE")
            return (
                <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Male
                </span>
            );
        if (g === "FEMALE")
            return (
                <span className="text-pink-600 font-medium text-xs bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                    Female
                </span>
            );
        return (
            <span className="text-gray-500 font-medium text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                Other
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
                <button
                    onClick={() => {
                        if (!selectedBranchId) {
                            alert("Please select a franchise first.");
                            return;
                        }
                        if (!isBranchActive) {
                            alert("The selected franchise is not active yet.");
                            return;
                        }
                        navigate("/manager/staff/create");
                    }}
                    disabled={loadingBranches || !selectedBranchId || !isBranchActive}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2 shadow-sm transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UserPlus className="h-4 w-4" /> Create New Staff
                </button>
            </div>

            {/* BỘ CHỌN CHI NHÁNH (FRANCHISE SELECTOR) */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <label className="mb-3 block text-sm font-semibold text-gray-500">
                    Select Franchise to view Staff List
                </label>
                <ManagerFranchiseSelector
                    branches={branches}
                    value={selectedBranchId}
                    onChange={setSelectedBranchId}
                    loading={loadingBranches}
                    helperText="Select a franchise to view, manage, and create staff."
                />
                
                {branchError && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {branchError}
                    </div>
                )}

                {!loadingBranches && selectedBranchId && !isBranchActive && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        The selected franchise is not active, so new staff cannot be created.
                    </div>
                )}
            </div>

            {selectedBranchId && (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Total Staff", value: staffs.length, cls: "bg-white border-gray-200 text-gray-800" },
                            { label: "Working", value: activeCount, cls: "bg-green-50 border-green-200 text-green-700" },
                            { label: "Inactive", value: inactiveCount, cls: "bg-gray-50 border-gray-200 text-gray-500" },
                        ].map((c) => (
                            <div key={c.label} className={`rounded-xl border px-5 py-4 shadow-sm ${c.cls}`}>
                                <div className="text-2xl font-extrabold">{c.value}</div>
                                <div className="text-xs font-semibold text-gray-400 mt-0.5">{c.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-end justify-between">
                        <div className="flex-1 min-w-[240px] max-w-md">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Search Staff</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Name or Staff ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { key: "ALL" as const, label: `All (${staffs.length})` },
                                { key: "ACTIVE" as const, label: `Working (${activeCount})` },
                                { key: "INACTIVE" as const, label: `Inactive (${inactiveCount})` },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                        statusFilter === tab.key
                                            ? "bg-amber-500 text-white border-amber-500"
                                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => fetchStaffs(selectedBranchId)}
                            disabled={loading || !selectedBranchId}
                            className="px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin text-amber-500" : ""} />
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
                                <RefreshCw size={26} className="animate-spin text-amber-500" />
                                <span className="text-sm font-bold text-gray-500">Loading staff data...</span>
                            </div>
                        )}

                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    {["Staff ID", "Employee", "Contact", "Branch", "Status", ""].map((h, i) => (
                                        <th
                                            key={i}
                                            className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider ${
                                                i === 5 ? "text-right" : ""
                                            }`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!loading && filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search size={36} className="text-gray-200" />
                                                <p className="font-medium text-sm">No staff found in this franchise.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                                    {staff.staffCode || "-"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    {staff.name}
                                                    {renderGender(staff.gender)}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                                    <Mail className="h-3 w-3" /> {staff.email || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-gray-300" /> {staff.phone || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-300" />
                                                    <span className={staff.branchId ? "text-gray-900 font-medium" : "text-gray-400 italic"}>
                                                        {staff.branchId
                                                            ? formatManagerBranchDisplay(staff.branchId, branchDisplayMap)
                                                            : "No branch assigned"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusCell
                                                    staffId={staff.id}
                                                    initialStatus={staff.status}
                                                    onChanged={(newStatus: "ACTIVE" | "INACTIVE") =>
                                                        setStaffs((prev) =>
                                                            prev.map((s) =>
                                                                s.id === staff.id ? { ...s, status: newStatus } : s
                                                            )
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/manager/staff/update/${staff.id}`)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (staff.status !== "INACTIVE") {
                                                                alert("Staff must be set to Inactive before deletion");
                                                                return;
                                                            }
                                                            setDeleteConfirmModal({ staffId: staff.id, staffName: staff.name });
                                                        }}
                                                        disabled={staff.status !== "INACTIVE"}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            staff.status === "INACTIVE"
                                                                ? "text-red-600 hover:bg-red-50 cursor-pointer"
                                                                : "text-gray-300 cursor-not-allowed opacity-50"
                                                        }`}
                                                        title={staff.status === "INACTIVE" ? "Delete" : "Set staff to Inactive first to delete"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Staff</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete staff <strong>{deleteConfirmModal.staffName}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirmModal(null)}
                                disabled={deleteLoading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteStaff}
                                disabled={deleteLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




