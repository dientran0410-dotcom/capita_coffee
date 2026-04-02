import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Building2,
    Calendar,
    Loader2,
    MapPin,
    RefreshCw,
} from "lucide-react";
import { useResolvedStaffIdentity } from "../../hooks/useResolvedStaffIdentity";
import { getStaffAttendanceHistory } from "../../services/attendanceService";
import { useAuth } from "../../context/AuthContext";
import { useManagerBranchSelection } from "../../hooks/useManagerBranchSelection";
import { formatManagerBranchDisplay } from "../../services/managerBranchService";

const formatDate = (value: any): string => {
    if (!value) return "N/A";
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value;
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }
    if (typeof value === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split("-");
            return `${day}/${month}/${year}`;
        }
        return value;
    }
    return String(value);
};

const formatTime = (value: any): string => {
    if (!value) return "--:--";
    if (Array.isArray(value) && value.length >= 2) {
        return `${String(value[0]).padStart(2, "0")}:${String(value[1]).padStart(2, "0")}`;
    }
    if (typeof value === "string") {
        return value.slice(0, 5);
    }
    return "--:--";
};

const getBranchId = (record: any): string => {
    const rawValue = record?.branchId ?? record?.franchiseId;
    if (typeof rawValue === "string" && rawValue.trim()) return rawValue.trim();
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) return String(rawValue);
    return "";
};

export default function StaffAttendanceView() {
    const { user } = useAuth();
    const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";

    const {
        branchDisplayMap,
        selectedBranch,
    } = useManagerBranchSelection(authFranchiseId as string);

    const { staffIds, loading: loadingStaffIdentity, error: staffIdentityError, refresh: refreshStaffIdentity } =
        useResolvedStaffIdentity();

    const staffIdKey = useMemo(() => staffIds.join("|"), [staffIds]);

    const [attendances, setAttendances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedBranchId, setSelectedBranchId] = useState("ALL");

    const fallbackBranchDisplay = selectedBranch?.displayName || "";

    const getBranchDisplay = (branchId: string) => {
        return formatManagerBranchDisplay(branchId, branchDisplayMap, fallbackBranchDisplay);
    };

    const branchOptions = useMemo(() => {
        const seen = new Set<string>();

        return attendances
            .map((record) => getBranchId(record))
            .filter((branchValue) => {
                if (!branchValue || seen.has(branchValue)) return false;
                seen.add(branchValue);
                return true;
            })
            .map((branchValue) => ({
                value: branchValue,
                label: getBranchDisplay(branchValue),
            }));
    }, [attendances, branchDisplayMap, fallbackBranchDisplay]);

    const visibleAttendances = useMemo(() => {
        if (selectedBranchId === "ALL") return attendances;
        return attendances.filter((record) => getBranchId(record) === selectedBranchId);
    }, [attendances, selectedBranchId]);

    const fetchMyAttendance = async () => {
        if (loadingStaffIdentity) return;

        if (staffIds.length === 0) {
            setAttendances([]);
            setLoading(false);
            setError(staffIdentityError || "Khong tim thay Staff ID trong phien dang nhap.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const [year, month] = filterMonth.split("-");

            console.info("[StaffAttendanceView] Loading attendance", {
                staffIds,
                filterMonth,
            });

            let resolvedData: any[] = [];

            for (let i = 0; i < staffIds.length; i += 1) {
                const candidateId = staffIds[i];
                const response = await getStaffAttendanceHistory(
                    candidateId,
                    month ? parseInt(month, 10) : undefined,
                    year ? parseInt(year, 10) : undefined,
                    undefined
                );

                const list = Array.isArray(response) ? response : [];
                if (i === 0) resolvedData = list;
                if (list.length > 0) {
                    resolvedData = list;
                    break;
                }
            }

            setAttendances(resolvedData);

            if (resolvedData.length === 0) {
                console.warn("[StaffAttendanceView] No attendance data for all staffId candidates:", {
                    staffIds,
                });
            }
        } catch (err: any) {
            console.error("Error loading attendance:", err);
            setAttendances([]);
            setError(err?.message || "Khong tai duoc du lieu cham cong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loadingStaffIdentity) return;
        fetchMyAttendance();
    }, [filterMonth, staffIdKey, loadingStaffIdentity]);

    useEffect(() => {
        if (selectedBranchId === "ALL") return;
        const hasSelectedBranch = branchOptions.some((option) => option.value === selectedBranchId);
        if (!hasSelectedBranch) {
            setSelectedBranchId("ALL");
        }
    }, [branchOptions, selectedBranchId]);

    const handleRefresh = async () => {
        await refreshStaffIdentity();
    };

    const isBusy = loading || loadingStaffIdentity;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Attendance History</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Showing attendance across all franchises assigned to your account.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isBusy || staffIds.length === 0}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={18} className={isBusy ? "animate-spin text-red-600" : ""} />
                        <span className="text-sm font-bold hidden sm:inline">Refresh</span>
                    </button>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                        <Calendar className="text-gray-400" size={18} />
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                        <Building2 className="text-gray-400" size={18} />
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                        >
                            <option value="ALL">All franchises</option>
                            {branchOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5" />
                    {error}
                </div>
            )}

            {isBusy ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-red-600 h-8 w-8" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Shift</th>
                                    <th className="p-4">Franchise</th>
                                    <th className="p-4">Check-in</th>
                                    <th className="p-4">Check-out</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {visibleAttendances.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No attendance data for this month
                                            {selectedBranchId !== "ALL" ? " and selected franchise." : "."}
                                        </td>
                                    </tr>
                                ) : (
                                    visibleAttendances.map((record: any, index) => {
                                        const dateDisplay = formatDate(record.date);
                                        const startStr = formatTime(record.startTime);
                                        const endStr = formatTime(record.endTime);
                                        const shiftDisplay = `Shift ${startStr} - ${endStr}`;
                                        const branchId = getBranchId(record);
                                        const branchDisplay = getBranchDisplay(branchId);

                                        const addMinutesToTime = (timeStr: string, minutesToAdd: number) => {
                                            if (!timeStr || timeStr === "--:--") return "--:--";
                                            const [h, m] = timeStr.split(":").map(Number);
                                            const dateObj = new Date();
                                            dateObj.setHours(h, m + minutesToAdd, 0);
                                            return dateObj.toTimeString().slice(0, 5);
                                        };

                                        const rawStatus = String(
                                            record.attendanceStatus || record.status || "UNMARKED"
                                        ).toUpperCase();

                                        let statusDisplay = rawStatus;
                                        let badgeClass = "bg-gray-100 text-gray-700";
                                        let checkInDisplay = startStr;
                                        let checkOutDisplay = endStr;

                                        if (rawStatus === "PRESENT") {
                                            badgeClass = "bg-green-100 text-green-700";
                                            statusDisplay = "ON TIME";
                                        } else if (rawStatus === "EARLY_LEAVE") {
                                            badgeClass = "bg-yellow-100 text-yellow-700";
                                            const mins = record.earlyLeaveMinutes || 0;
                                            statusDisplay = mins ? `EARLY LEAVE (${mins}m)` : "EARLY LEAVE";
                                            checkOutDisplay = addMinutesToTime(endStr, -mins);
                                        } else if (rawStatus === "LATE") {
                                            badgeClass = "bg-orange-100 text-orange-700";
                                            const mins = record.lateMinutes || 0;
                                            statusDisplay = mins ? `LATE (${mins}m)` : "LATE";
                                            checkInDisplay = addMinutesToTime(startStr, mins);
                                        } else if (rawStatus === "ABSENT") {
                                            badgeClass = "bg-red-100 text-red-700";
                                            statusDisplay = "ABSENT";
                                            checkInDisplay = "--:--";
                                            checkOutDisplay = "--:--";
                                        } else if (rawStatus === "UNMARKED") {
                                            checkInDisplay = "--:--";
                                            checkOutDisplay = "--:--";
                                            statusDisplay = "NOT MARKED";
                                        }

                                        return (
                                            <tr
                                                key={record.shiftId || `${dateDisplay}-${index}`}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="p-4 font-bold text-gray-900 whitespace-nowrap">
                                                    {dateDisplay}
                                                </td>

                                                <td className="p-4 text-gray-700 whitespace-nowrap">
                                                    {shiftDisplay}
                                                </td>

                                                <td className="p-4 text-gray-700">
                                                    <div
                                                        className="flex items-center gap-1.5"
                                                        title={branchDisplay}
                                                    >
                                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                        <span className="max-w-[260px] truncate font-bold text-gray-800">
                                                            {branchDisplay}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-gray-700 font-medium whitespace-nowrap">
                                                    {checkInDisplay}
                                                </td>

                                                <td className="p-4 text-gray-700 font-medium whitespace-nowrap">
                                                    {checkOutDisplay}
                                                </td>

                                                <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
                                                    >
                                                        {statusDisplay}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}