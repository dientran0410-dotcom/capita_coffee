import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Building2,
    Calendar,
    CalendarDays,
    Clock,
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
    if (typeof value === "string") return value.slice(0, 5);
    return "--:--";
};

const toComparableDate = (value: any): number => {
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value;
        return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }
    return new Date(value).getTime();
};

const getBranchId = (record: any): string => {
    const rawValue = record?.branchId ?? record?.franchiseId;
    if (typeof rawValue === "string" && rawValue.trim()) return rawValue.trim();
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) return String(rawValue);
    return "";
};

export default function StaffScheduleView() {
    const { user } = useAuth();
    const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";

    const {
        branchDisplayMap,
        selectedBranch,
    } = useManagerBranchSelection(authFranchiseId as string);

    const {
        staffIds,
        loading: loadingStaffIdentity,
        error: staffIdentityError,
        refresh: refreshStaffIdentity,
    } = useResolvedStaffIdentity();

    const staffIdKey = useMemo(() => staffIds.join("|"), [staffIds]);

    const [myShifts, setMyShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [filterDate, setFilterDate] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState("ALL");

    const fallbackBranchDisplay = selectedBranch?.displayName || "";

    const getBranchDisplay = (branchId: string) => {
        return formatManagerBranchDisplay(branchId, branchDisplayMap, fallbackBranchDisplay);
    };

    const branchOptions = useMemo(() => {
        const seen = new Set<string>();

        return myShifts
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
    }, [myShifts, branchDisplayMap, fallbackBranchDisplay]);

    const visibleShifts = useMemo(() => {
        if (selectedBranchId === "ALL") return myShifts;
        return myShifts.filter((record) => getBranchId(record) === selectedBranchId);
    }, [myShifts, selectedBranchId]);

    const fetchMySchedules = async () => {
        if (loadingStaffIdentity) {
            return;
        }

        if (staffIds.length === 0) {
            setMyShifts([]);
            setLoading(false);
            setError(staffIdentityError || "Khong tim thay Staff ID trong phien dang nhap.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const [year, month] = filterMonth.split("-");
            const exactDateParam = filterDate || undefined;

            console.info("[StaffScheduleView] Loading schedules", {
                staffIds,
                filterMonth,
                filterDate: exactDateParam || "(none)",
            });

            let schedules: any[] = [];
            for (let i = 0; i < staffIds.length; i += 1) {
                const candidateId = staffIds[i];
                const response = await getStaffAttendanceHistory(
                    candidateId,
                    exactDateParam ? undefined : month ? parseInt(month, 10) : undefined,
                    exactDateParam ? undefined : year ? parseInt(year, 10) : undefined,
                    exactDateParam
                );

                const list = Array.isArray(response) ? response : [];
                if (i === 0) schedules = list;
                if (list.length > 0) {
                    schedules = list;
                    break;
                }
            }

            const sortedShifts = [...schedules].sort(
                (a: any, b: any) => toComparableDate(a.date) - toComparableDate(b.date)
            );

            setMyShifts(sortedShifts);

            if (sortedShifts.length === 0) {
                console.warn("[StaffScheduleView] No schedule data for all staffId candidates:", {
                    staffIds,
                });
            }
        } catch (err: any) {
            console.error("Error loading schedules:", err);
            setMyShifts([]);
            setError(err?.message || "Khong tai duoc lich lam viec.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loadingStaffIdentity) return;
        fetchMySchedules();
    }, [filterMonth, filterDate, staffIdKey, loadingStaffIdentity]);

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
                    <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Showing shifts across all franchises assigned to your account.
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
                            onChange={(e) => {
                                setFilterMonth(e.target.value);
                                setFilterDate("");
                            }}
                            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm relative">
                        <CalendarDays className="text-red-400" size={18} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => {
                                setFilterDate(e.target.value);
                                if (e.target.value) setFilterMonth(e.target.value.substring(0, 7));
                            }}
                            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                        />
                        {filterDate && (
                            <button
                                onClick={() => setFilterDate("")}
                                className="text-gray-400 hover:text-red-500 font-bold ml-1"
                                title="Clear date filter"
                            >
                                x
                            </button>
                        )}
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
            ) : visibleShifts.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-2xl border border-gray-100 text-gray-500 shadow-sm">
                    No schedules found for{" "}
                    {filterDate
                        ? `date ${filterDate}`
                        : selectedBranchId !== "ALL"
                        ? "selected franchise in this month"
                        : `month ${filterMonth}`}
                </div>
            ) : (
                <div className="grid gap-4">
                    {visibleShifts.map((shift: any, index) => {
                        const dateLabel = formatDate(shift.date);
                        const start = formatTime(shift.startTime);
                        const end = formatTime(shift.endTime);
                        const branchId = getBranchId(shift);
                        const branchDisplay = getBranchDisplay(branchId);

                        return (
                            <div
                                key={shift.shiftId || `${dateLabel}-${index}`}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-red-200 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 bg-red-50 text-red-600 rounded-xl flex flex-col items-center justify-center shrink-0 border border-red-100">
                                        <span className="text-lg font-black leading-none">
                                            {dateLabel !== "N/A" ? dateLabel.split("/")[0] : "--"}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            {dateLabel !== "N/A" ? dateLabel.split("/")[1] : "--"}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg">
                                            Shift {start} - {end}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mt-1 flex-wrap">
                                            <Clock size={14} className="text-red-400" />
                                            {dateLabel}
                                            <span className="px-2 bg-gray-100 rounded text-xs font-bold">
                                                {shift.shiftStatus || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 max-w-full md:max-w-[320px]"
                                    title={branchDisplay}
                                >
                                    <MapPin size={16} className="text-gray-400 shrink-0" />
                                    <span className="truncate">{branchDisplay}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}