import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Calendar,
    CalendarDays,
    CheckCircle,
    Clock,
    Loader2,
    Mail,
    MapPin,
    RefreshCw,
    User2,
    AlertTriangle,
    TrendingUp,
    Building2,
} from "lucide-react";
import { useResolvedStaffIdentity } from "../../hooks/useResolvedStaffIdentity";
import { getStaffAttendanceHistory } from "../../services/attendanceService";
import { getStaffById, getCurrentStaffProfile } from "../../services/staffService";
import { useAuth } from "../../context/AuthContext";
import { useManagerBranchSelection } from "../../hooks/useManagerBranchSelection";
import { formatManagerBranchDisplay } from "../../services/managerBranchService";

type DashboardStats = {
    monthlyShifts: number;
    presentCount: number;
    lateCount: number;
    earlyLeaveCount: number;
    absentCount: number;
    onTimeRate: number;
    totalLateMinutes: number;
    totalEarlyLeaveMinutes: number;
    latestShiftDate: string;
    franchiseCount: number;
};

type AttendanceRecord = {
    date?: string | number[] | Date;
    attendanceStatus?: string;
    status?: string;
    branchId?: string;
    franchiseId?: string;
    lateMinutes?: number;
    earlyLeaveMinutes?: number;
    [key: string]: unknown;
};

type AuthUser = {
    email?: string;
    raw?: {
        email?: string;
        gmail?: string;
        fullName?: string;
        name?: string;
        staffCode?: string;
        franchiseId?: string;
        [key: string]: unknown;
    };
    fullName?: string;
    name?: string;
    username?: string;
    staffCode?: string;
    franchiseId?: string;
    [key: string]: unknown;
};

type StaffInfo = {
    staffCode?: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
};


const DEFAULT_STATS: DashboardStats = {
    monthlyShifts: 0,
    presentCount: 0,
    lateCount: 0,
    earlyLeaveCount: 0,
    absentCount: 0,
    onTimeRate: 0,
    totalLateMinutes: 0,
    totalEarlyLeaveMinutes: 0,
    latestShiftDate: "N/A",
    franchiseCount: 0,
};

const formatDate = (value: string | number[] | Date | unknown): string => {
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

const toComparableDate = (value: string | number[] | Date | unknown): number => {
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value;
        return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }
    return new Date(String(value)).getTime();
};

const formatMinutes = (minutes: number): string => {
    if (!minutes || minutes <= 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
};

const getBranchId = (record: AttendanceRecord): string => {
    const rawValue = record?.branchId ?? record?.franchiseId;
    if (typeof rawValue === "string" && rawValue.trim()) return rawValue.trim();
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) return String(rawValue);
    return "";
};

export default function StaffDashboard() {
    const { user } = useAuth();
    const authFranchiseId = user?.franchiseId || (user as AuthUser)?.raw?.franchiseId || "";

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

    const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    
    // State lưu trữ thông tin thật của Staff lấy từ API
    const [realStaffCode, setRealStaffCode] = useState<string>("");
    const [realEmail, setRealEmail] = useState<string>("");
    const [realName, setRealName] = useState<string>("");

    // Gọi API lấy thông tin Staff chuẩn xác từ DB
    useEffect(() => {
        const fetchRealStaffProfile = async () => {
            try {
                // Ưu tiên getCurrentStaffProfile() để lấy thông tin staff hiện tại
                const staffInfo: StaffInfo | undefined = await getCurrentStaffProfile();
                if (staffInfo) {
                    console.log("✅ Staff Profile từ API:", staffInfo);
                    if (staffInfo.staffCode) {
                        const code = String(staffInfo.staffCode).trim();
                        if (code && code !== "undefined" && code !== "null") {
                            setRealStaffCode(code);
                        }
                    }
                    if (staffInfo.email) {
                        const email = String(staffInfo.email).trim();
                        if (email && email !== "undefined" && email !== "null") {
                            setRealEmail(email);
                        }
                    }
                    if (staffInfo.name) {
                        const name = String(staffInfo.name).trim();
                        if (name && name !== "undefined" && name !== "null") {
                            setRealName(name);
                        }
                    }
                } else {
                    console.warn("⚠️ getCurrentStaffProfile() trả về undefined, thử getStaffById...");
                    if (staffIds.length > 0) {
                        const fallbackStaffInfo: StaffInfo | undefined = await getStaffById(staffIds[0]);
                        if (fallbackStaffInfo) {
                            console.log("✅ Staff Profile từ getStaffById:", fallbackStaffInfo);
                            if (fallbackStaffInfo.staffCode) {
                                const code = String(fallbackStaffInfo.staffCode).trim();
                                if (code && code !== "undefined" && code !== "null") {
                                    setRealStaffCode(code);
                                }
                            }
                            if (fallbackStaffInfo.email) {
                                const email = String(fallbackStaffInfo.email).trim();
                                if (email && email !== "undefined" && email !== "null") {
                                    setRealEmail(email);
                                }
                            }
                            if (fallbackStaffInfo.name) {
                                const name = String(fallbackStaffInfo.name).trim();
                                if (name && name !== "undefined" && name !== "null") {
                                    setRealName(name);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("❌ Lỗi khi lấy Staff Profile:", err);
                // Fallback to context/localStorage data - không hiển thị lỗi
                const u = user as AuthUser;
                if (!realStaffCode && (u?.staffCode || u?.raw?.staffCode)) {
                    setRealStaffCode(String(u?.staffCode || u?.raw?.staffCode));
                }
                if (!realEmail && (u?.email || u?.raw?.email || u?.raw?.gmail)) {
                    const email = String(u?.email || u?.raw?.email || u?.raw?.gmail);
                    if (email && email !== "undefined") {
                        setRealEmail(email);
                    }
                }
                if (!realName && (u?.fullName || u?.raw?.fullName || u?.name || u?.raw?.name)) {
                    setRealName(String(u?.fullName || u?.raw?.fullName || u?.name || u?.raw?.name));
                }
            }
        };
        fetchRealStaffProfile();
    }, [staffIds, user]);

    const fallbackBranchDisplay = selectedBranch?.displayName || "";

    const getBranchDisplay = (branchId: string) => {
        return formatManagerBranchDisplay(branchId, branchDisplayMap, fallbackBranchDisplay);
    };

    const u = user as AuthUser;

    // Lấy Email: Ưu tiên API -> Context (Chỉ lấy username nếu nó có chứa ký tự @)
    const userEmail = realEmail || String(
        u?.email ||
        u?.raw?.email ||
        u?.raw?.gmail ||
        (u?.username && u.username.includes('@') ? u.username : null) || 
        "N/A"
    );

    // Lấy Tên: Ưu tiên API -> Context
    const userDisplayName = realName || String(
        u?.fullName ||
        u?.raw?.fullName ||
        u?.name ||
        u?.raw?.name ||
        u?.username ||
        "Staff User"
    );

    // Lấy Staff Code chuẩn xác
    const displayStaffCodes = useMemo(() => {
        if (realStaffCode) return realStaffCode;
        if (u?.staffCode) return u.staffCode;
        if (u?.raw?.staffCode) return u.raw.staffCode;
        return "Loading...";
    }, [realStaffCode, u]);

    const franchiseSummary = useMemo(() => {
        const uniqueBranchIds = Array.from(
            new Set(
                attendances
                    .map((item) => getBranchId(item))
                    .filter(Boolean)
            )
        );

        if (uniqueBranchIds.length === 0) {
            return fallbackBranchDisplay || "No franchise assigned";
        }

        if (uniqueBranchIds.length === 1) {
            return getBranchDisplay(uniqueBranchIds[0]);
        }

        return `${uniqueBranchIds.length} franchises assigned`;
    }, [attendances, branchDisplayMap, fallbackBranchDisplay]);

    const fetchAllData = async () => {
        if (loadingStaffIdentity) {
            return;
        }

        if (staffIds.length === 0) {
            setStats(DEFAULT_STATS);
            setAttendances([]);
            setLoading(false);
            setError(staffIdentityError || "Khong tim thay Staff ID trong phien dang nhap.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const [year, month] = filterMonth.split("-");

            let attendanceList: AttendanceRecord[] = [];

            for (let i = 0; i < staffIds.length; i += 1) {
                const candidateId = staffIds[i];
                const response = await getStaffAttendanceHistory(
                    candidateId,
                    month ? parseInt(month, 10) : undefined,
                    year ? parseInt(year, 10) : undefined,
                    undefined
                );

                const list = Array.isArray(response) ? (response as AttendanceRecord[]) : [];
                if (i === 0) attendanceList = list;
                if (list.length > 0) {
                    attendanceList = list;
                    break;
                }
            }

            setAttendances(attendanceList);

            let presentCount = 0;
            let lateCount = 0;
            let earlyLeaveCount = 0;
            let absentCount = 0;
            let totalLateMinutes = 0;
            let totalEarlyLeaveMinutes = 0;

            attendanceList.forEach((item: AttendanceRecord) => {
                const status = String(item.attendanceStatus || item.status || "").toUpperCase();

                if (status === "PRESENT" || status === "ON_TIME") {
                    presentCount += 1;
                } else if (status === "LATE") {
                    lateCount += 1;
                    totalLateMinutes += Number(item.lateMinutes || 0);
                } else if (status === "EARLY_LEAVE") {
                    earlyLeaveCount += 1;
                    totalEarlyLeaveMinutes += Number(item.earlyLeaveMinutes || 0);
                } else if (status === "ABSENT") {
                    absentCount += 1;
                }
            });

            const markedShiftCount = attendanceList.filter((item: AttendanceRecord) => {
                const status = String(item.attendanceStatus || item.status || "").toUpperCase();
                return status !== "UNMARKED";
            }).length;

            const onTimeRate =
                markedShiftCount === 0 ? 0 : Math.round((presentCount / markedShiftCount) * 100);

            const sortedByDate = [...attendanceList].sort(
                (a: AttendanceRecord, b: AttendanceRecord) => toComparableDate(b.date) - toComparableDate(a.date)
            );

            const latestShiftDate =
                sortedByDate.length > 0 ? formatDate(sortedByDate[0]?.date) : "N/A";

            const uniqueBranchIds = new Set(
                attendanceList.map((item: AttendanceRecord) => getBranchId(item)).filter(Boolean)
            );

            setStats({
                monthlyShifts: attendanceList.length,
                presentCount,
                lateCount,
                earlyLeaveCount,
                absentCount,
                onTimeRate,
                totalLateMinutes,
                totalEarlyLeaveMinutes,
                latestShiftDate,
                franchiseCount: uniqueBranchIds.size,
            });
        } catch (err) {
            const error = err as { message?: string } | null;
            console.error("Error loading dashboard:", err);
            setStats(DEFAULT_STATS);
            setAttendances([]);
            setError(error?.message || "Khong tai duoc tong quan cham cong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loadingStaffIdentity) return;
        fetchAllData();
    }, [filterMonth, staffIdKey, loadingStaffIdentity]);

    const handleRefresh = async () => {
        await refreshStaffIdentity();
    };

    const isBusy = loading || loadingStaffIdentity;

    const chartData = [
        { label: "On Time", value: stats.presentCount, color: "bg-green-500" },
        { label: "Late", value: stats.lateCount, color: "bg-orange-500" },
        { label: "Early Leave", value: stats.earlyLeaveCount, color: "bg-amber-500" },
        { label: "Absent", value: stats.absentCount, color: "bg-red-500" },
    ];

    const chartMax = Math.max(...chartData.map((item) => item.value), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Welcome back, {userDisplayName} 👋
                    </h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                        Here is your attendance summary for the selected month.
                    </p>
                </div>

                <div className="flex items-center gap-3">
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
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Profile / Identity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <InfoCard
                    icon={<User2 size={18} />}
                    title="Staff Account"
                    value={userDisplayName}
                    subValue={`Staff Code: ${displayStaffCodes}`}
                />
                <InfoCard
                    icon={<Mail size={18} />}
                    title="Email / Gmail"
                    value={userEmail}
                    subValue="Account used to sign in"
                />
                <InfoCard
                    icon={<Building2 size={18} />}
                    title="Assigned Franchise"
                    value={franchiseSummary}
                    subValue={`${stats.franchiseCount || 0} active franchise(s) this month`}
                />
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
                <>
                    {/* Top stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <StatCard
                            icon={<CalendarDays className="text-red-500" />}
                            title="Shifts (This Month)"
                            value={stats.monthlyShifts}
                            subtitle="All assigned shifts"
                            trendColor="bg-red-50"
                        />
                        <StatCard
                            icon={<CheckCircle className="text-green-500" />}
                            title="On-time Attendance"
                            value={stats.presentCount}
                            subtitle={`${stats.onTimeRate}% attendance success`}
                            trendColor="bg-green-50"
                        />
                        <StatCard
                            icon={<Clock className="text-orange-500" />}
                            title="Late Check-ins"
                            value={stats.lateCount}
                            subtitle={`${formatMinutes(stats.totalLateMinutes)} total late`}
                            trendColor="bg-orange-50"
                        />
                        <StatCard
                            icon={<AlertTriangle className="text-amber-500" />}
                            title="Early Leave"
                            value={stats.earlyLeaveCount}
                            subtitle={`${formatMinutes(stats.totalEarlyLeaveMinutes)} total early`}
                            trendColor="bg-amber-50"
                        />
                    </div>

                    {/* Charts + insights */}
                    <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
                        {/* Bar chart */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Attendance Overview</h3>
                                    <p className="text-sm text-gray-500 font-medium">
                                        Distribution of your attendance statuses
                                    </p>
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    {filterMonth}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 items-end h-64">
                                {chartData.map((item) => {
                                    const barHeight = (item.value / chartMax) * 100;
                                    return (
                                        <div key={item.label} className="flex flex-col items-center justify-end h-full gap-3">
                                            <span className="text-sm font-black text-gray-900">
                                                {item.value}
                                            </span>
                                            <div className="w-full h-full flex items-end">
                                                <div
                                                    className={`w-full rounded-2xl ${item.color} transition-all duration-500`}
                                                    style={{ height: `${Math.max(barHeight, item.value > 0 ? 12 : 4)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 text-center leading-tight">
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right panel */}
                        <div className="space-y-6">
                            {/* Attendance rate circle */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <h3 className="text-lg font-black text-gray-900">Attendance Rate</h3>
                                <p className="text-sm text-gray-500 font-medium mb-5">
                                    Based on marked attendance only
                                </p>

                                <div className="relative h-36 w-36 flex items-center justify-center rounded-full border-[10px] border-gray-50">
                                    <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-green-500"
                                            strokeDasharray={`${stats.onTimeRate}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />
                                    </svg>
                                    <span className="text-3xl font-black text-gray-900">
                                        {stats.onTimeRate}%
                                    </span>
                                </div>

                                <div className="mt-5 w-full space-y-3">
                                    <MiniInsightRow label="Latest Shift" value={stats.latestShiftDate} />
                                    <MiniInsightRow label="Absent Shifts" value={`${stats.absentCount}`} />
                                    <MiniInsightRow label="Franchises" value={`${stats.franchiseCount}`} />
                                </div>
                            </div>

                            {/* Quick insights */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={18} className="text-red-500" />
                                    <h3 className="text-lg font-black text-gray-900">Quick Insights</h3>
                                </div>

                                <div className="space-y-4">
                                    <InsightItem
                                        icon={<Clock size={16} />}
                                        label="Total Late Time"
                                        value={formatMinutes(stats.totalLateMinutes)}
                                        tone="orange"
                                    />
                                    <InsightItem
                                        icon={<Clock size={16} />}
                                        label="Total Early Leave Time"
                                        value={formatMinutes(stats.totalEarlyLeaveMinutes)}
                                        tone="amber"
                                    />
                                    <InsightItem
                                        icon={<MapPin size={16} />}
                                        label="Current Franchise View"
                                        value={franchiseSummary}
                                        tone="red"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ icon, title, value, subtitle, trendColor = "bg-red-50" }: {
    icon: React.ReactNode;
    title: string;
    value: number;
    subtitle: string;
    trendColor?: string;
}) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`p-4 ${trendColor} rounded-2xl shrink-0`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
                <p className="text-sm text-gray-500 font-medium mt-1 truncate">{subtitle}</p>
            </div>
        </div>
    );
}

function InfoCard({ icon, title, value, subValue }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    subValue: string;
}) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-gray-50 text-gray-600">{icon}</div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            </div>
            <p className="text-lg font-black text-gray-900 break-words">{value}</p>
            <p className="text-sm text-gray-500 font-medium mt-1 break-words">{subValue}</p>
        </div>
    );
}

function MiniInsightRow({ label, value }: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between text-sm font-bold border-b border-gray-100 pb-2">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-900">{value}</span>
        </div>
    );
}

function InsightItem({ icon, label, value, tone = "red" }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone?: string;
}) {
    const toneMap: Record<string, string> = {
        red: "bg-red-50 text-red-600",
        orange: "bg-orange-50 text-orange-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg ${toneMap[tone] || toneMap.red}`}>{icon}</div>
                <span className="text-sm font-bold text-gray-600">{label}</span>
            </div>
            <span className="text-sm font-black text-gray-900 text-right max-w-[55%] truncate" title={value}>
                {value}
            </span>
        </div>
    );
}