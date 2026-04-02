import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    Clock,
    FileBarChart,
    Loader2,
    RefreshCw,
    TrendingUp,
} from "lucide-react";
import { useResolvedStaffIdentity } from "../../hooks/useResolvedStaffIdentity";
import { getStaffAttendanceHistory } from "../../services/attendanceService";

const formatMinutes = (minutes: number): string => {
    if (!minutes || minutes <= 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
};

export default function StaffReportView() {
    const {
        staffIds,
        loading: loadingStaffIdentity,
        error: staffIdentityError,
        refresh: refreshStaffIdentity,
    } = useResolvedStaffIdentity();

    const staffIdKey = useMemo(() => staffIds.join("|"), [staffIds]);

    const [reportData, setReportData] = useState({
        total: 0,
        onTime: 0,
        lateCount: 0,
        earlyLeaveCount: 0,
        issueShiftCount: 0,
        absent: 0,
        onTimeRate: 0,
        totalLateMinutes: 0,
        totalEarlyLeaveMinutes: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

    const fetchReportData = async () => {
        if (loadingStaffIdentity) {
            return;
        }

        if (staffIds.length === 0) {
            setReportData({
                total: 0,
                onTime: 0,
                lateCount: 0,
                earlyLeaveCount: 0,
                issueShiftCount: 0,
                absent: 0,
                onTimeRate: 0,
                totalLateMinutes: 0,
                totalEarlyLeaveMinutes: 0,
            });
            setLoading(false);
            setError(staffIdentityError || "Khong tim thay Staff ID trong phien dang nhap.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const [year, month] = filterMonth.split("-");

            console.info("[StaffReportView] Loading report", {
                staffIds,
                filterMonth,
            });

            let attendances: any[] = [];
            for (let i = 0; i < staffIds.length; i += 1) {
                const candidateId = staffIds[i];
                const response = await getStaffAttendanceHistory(
                    candidateId,
                    month ? parseInt(month, 10) : undefined,
                    year ? parseInt(year, 10) : undefined,
                    undefined
                );

                const list = Array.isArray(response) ? response : [];
                if (i === 0) attendances = list;
                if (list.length > 0) {
                    attendances = list;
                    break;
                }
            }

            if (attendances.length === 0) {
                console.warn("[StaffReportView] No report data for all staffId candidates:", {
                    staffIds,
                });
            }

            let total = 0;
            let onTime = 0;
            let lateCount = 0;
            let earlyLeaveCount = 0;
            let issueShiftCount = 0;
            let absent = 0;
            let totalLateMinutes = 0;
            let totalEarlyLeaveMinutes = 0;

            attendances.forEach((attendance: any) => {
                const status = String(attendance.attendanceStatus || attendance.status || "").toUpperCase();
                if (status === "UNMARKED") return;

                total += 1;

                if (status === "PRESENT") {
                    onTime += 1;
                } else if (status === "LATE") {
                    lateCount += 1;
                    issueShiftCount += 1;
                    totalLateMinutes += Number(attendance.lateMinutes || 0);
                } else if (status === "EARLY_LEAVE") {
                    earlyLeaveCount += 1;
                    issueShiftCount += 1;
                    totalEarlyLeaveMinutes += Number(attendance.earlyLeaveMinutes || 0);
                } else if (status === "ABSENT") {
                    absent += 1;
                }
            });

            const onTimeRate = total === 0 ? 0 : Math.round((onTime / total) * 100);

            setReportData({
                total,
                onTime,
                lateCount,
                earlyLeaveCount,
                issueShiftCount,
                absent,
                onTimeRate,
                totalLateMinutes,
                totalEarlyLeaveMinutes,
            });
        } catch (err: any) {
            console.error("Error loading report:", err);
            setError(err?.message || "Khong tai duoc bao cao hieu suat.");
            setReportData({
                total: 0,
                onTime: 0,
                lateCount: 0,
                earlyLeaveCount: 0,
                issueShiftCount: 0,
                absent: 0,
                onTimeRate: 0,
                totalLateMinutes: 0,
                totalEarlyLeaveMinutes: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loadingStaffIdentity) return;
        fetchReportData();
    }, [filterMonth, staffIdKey, loadingStaffIdentity]);

    const handleRefresh = async () => {
        await refreshStaffIdentity();
    };

    const isBusy = loading || loadingStaffIdentity;

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <FileBarChart size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Performance Report</h1>
                        <p className="text-sm font-medium text-gray-500">
                            Attendance statistics across all assigned franchises for {filterMonth}
                        </p>
                    </div>
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
            ) : reportData.total === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500 shadow-sm font-medium">
                    Not enough data to generate a report for {filterMonth}.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                    {/* LEFT: On-time rate */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
                        <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs">
                            On-Time Rate
                        </h3>

                        <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-gray-50">
                            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36">
                                <path
                                    className="text-green-500"
                                    strokeDasharray={`${reportData.onTimeRate}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                            </svg>
                            <span className="text-3xl font-black text-gray-900">
                                {reportData.onTimeRate}%
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 font-medium">
                            Based on marked attendance only
                        </p>
                    </div>

                    {/* RIGHT: Details */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs border-b border-gray-100 pb-3">
                            Attendance Details
                        </h3>

                        <div className="space-y-4">
                            <ProgressItem
                                label="On Time"
                                count={reportData.onTime}
                                total={reportData.total}
                                colorClass="bg-green-500"
                                textColor="text-green-600"
                                icon={<TrendingUp size={16} />}
                                extra={`${reportData.onTime} shifts`}
                            />

                            <ProgressItem
                                label="Late"
                                count={reportData.lateCount}
                                total={reportData.total}
                                colorClass="bg-orange-500"
                                textColor="text-orange-500"
                                icon={<Clock size={16} />}
                                extra={`${formatMinutes(reportData.totalLateMinutes)} total`}
                            />

                            <ProgressItem
                                label="Early Leave"
                                count={reportData.earlyLeaveCount}
                                total={reportData.total}
                                colorClass="bg-amber-500"
                                textColor="text-amber-600"
                                icon={<Clock size={16} />}
                                extra={`${formatMinutes(reportData.totalEarlyLeaveMinutes)} total`}
                            />

                            <ProgressItem
                                label="Absent"
                                count={reportData.absent}
                                total={reportData.total}
                                colorClass="bg-red-500"
                                textColor="text-red-600"
                                icon={<AlertTriangle size={16} />}
                                extra={`${reportData.absent} shifts`}
                            />
                        </div>

                        {/* Summary cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <SummaryCard
                                title="Total Late Time"
                                value={formatMinutes(reportData.totalLateMinutes)}
                                subtitle={`${reportData.lateCount} late shifts`}
                                icon={<Clock size={18} />}
                                iconClass="bg-orange-50 text-orange-500"
                            />

                            <SummaryCard
                                title="Total Early Leave Time"
                                value={formatMinutes(reportData.totalEarlyLeaveMinutes)}
                                subtitle={`${reportData.earlyLeaveCount} early shifts`}
                                icon={<Clock size={18} />}
                                iconClass="bg-amber-50 text-amber-600"
                            />

                            <SummaryCard
                                title="Issue Shifts"
                                value={`${reportData.issueShiftCount}`}
                                subtitle="Late or early leave"
                                icon={<AlertTriangle size={18} />}
                                iconClass="bg-red-50 text-red-500"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 text-sm font-bold text-gray-800 flex justify-between">
                            <span>Total evaluated shifts:</span>
                            <span>{reportData.total} shifts</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProgressItem({
    label,
    count,
    total,
    colorClass,
    textColor,
    icon,
    extra,
}: any) {
    const percent = total === 0 ? 0 : (count / total) * 100;

    return (
        <div>
            <div className="flex justify-between items-center gap-3 text-[13px] font-bold mb-1.5">
                <span className={`flex items-center gap-2 ${textColor}`}>
                    {icon} {label}
                </span>
                <div className="text-right">
                    <div className="text-gray-900">{count} shifts</div>
                    {extra && <div className="text-[11px] text-gray-400 font-semibold">{extra}</div>}
                </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`${colorClass} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function SummaryCard({ title, value, subtitle, icon, iconClass }: any) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {title}
                </span>
                <div className={`p-2 rounded-lg ${iconClass}`}>{icon}</div>
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 font-medium mt-1">{subtitle}</div>
        </div>
    );
}