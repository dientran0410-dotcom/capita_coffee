import { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  BarChart3,
  CalendarDays,
  Clock,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import ManagerFranchiseSelector from "../../../components/manager/ManagerFranchiseSelector";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import { getAttendanceReport as getAttendanceReportApi } from "../../../services/attendanceService";

interface AttendanceReportItem {
  staffId: string;
  staffCode: string;
  staffName: string;
  assignedShifts: number;
  presentCount: number;
  absentCount: number;
  totalLateMins: number;
  totalEarlyMins: number;
  coveragePercentage: number;
}

const getCurrentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function AttendanceReport() {
  const { user } = useAuth();
  const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";

  const {
    branches,
    selectedBranch,
    selectedBranchId,
    loading: loadingBranches,
    error: branchError,
    setSelectedBranchId,
  } = useManagerBranchSelection(authFranchiseId as string);

  const [reportData, setReportData] = useState<AttendanceReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthStr, setSelectedMonthStr] = useState(getCurrentMonthStr());

  const isBranchActive = selectedBranch?.isActive ?? false;

  const loadReport = async () => {
    if (!selectedBranchId) {
      setError("Please choose a franchise first.");
      setReportData([]);
      setLoading(false);
      return;
    }

    if (!isBranchActive) {
      setError("The selected franchise is not active yet.");
      setReportData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [year, month] = selectedMonthStr.split("-");
      const response: any = await getAttendanceReportApi({
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        branchId: selectedBranchId,
      });

      const report =
        response?.result ??
        response?.data?.result ??
        response?.data ??
        response ??
        [];

      setReportData(Array.isArray(report) ? report : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load attendance report"
      );
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingBranches) return;
    if (!selectedMonthStr) return;
    loadReport();
  }, [selectedMonthStr, selectedBranchId, isBranchActive, loadingBranches]);

  const getCoverageColor = (pct: number) => {
    if (pct >= 95) return "bg-emerald-500";
    if (pct >= 80) return "bg-blue-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getCoverageText = (pct: number) => {
    if (pct >= 95) return "text-emerald-600";
    if (pct >= 80) return "text-blue-600";
    if (pct >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="space-y-6 pb-10">
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BarChart3 className="text-amber-500" /> Attendance Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Switch franchise to review monthly attendance coverage for that team.
          </p>
        </div>

        <div className="grid w-full gap-3 md:w-auto md:grid-cols-[minmax(280px,360px)_auto_auto]">
          <ManagerFranchiseSelector
            branches={branches}
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            loading={loadingBranches}
            helperText="The report updates based on the selected franchise."
          />

          <div className="self-end">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <CalendarDays className="h-4 w-4 text-amber-500" />
              </div>
              <input
                type="month"
                value={selectedMonthStr}
                onChange={(event) => setSelectedMonthStr(event.target.value)}
                className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            onClick={loadReport}
            disabled={loadingBranches || !selectedBranchId || !isBranchActive}
            className="flex items-center justify-center gap-2 self-end rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
          >
            <RefreshCw
              size={16}
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            />
            Refresh
          </button>
        </div>
      </div>

      {branchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {branchError}
        </div>
      )}

      {!loadingBranches && !selectedBranchId && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No franchise is available for this manager account.
        </div>
      )}

      {!loadingBranches && selectedBranchId && !isBranchActive && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          The selected franchise is not active yet, so its attendance report is unavailable.
        </div>
      )}

      {loading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
          <RefreshCw size={40} style={{ animation: "spin 1s linear infinite" }} />
          <p className="font-medium text-gray-500">
            Aggregating data for month {selectedMonthStr.split("-")[1]}...
          </p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
          <AlertCircle className="mt-1 shrink-0 text-red-500" size={24} />
          <div>
            <h3 className="mb-1 font-bold text-red-900">Failed to Load Report</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : reportData.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <CalendarDays size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-500">
            No attendance data available for {selectedMonthStr}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left">
              <thead className="border-b border-gray-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Employee
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    Total Shifts
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    Present / Absent
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    Late / Early Leave
                  </th>
                  <th className="w-[250px] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Coverage % (KPI)
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {reportData.map((staff, index) => (
                  <tr key={staff.staffId} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                          {staff.staffName ? staff.staffName.charAt(0) : "?"}
                        </div>
                        <div>
                          <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            {staff.staffName}
                            {index === 0 &&
                              staff.assignedShifts > 0 &&
                              staff.coveragePercentage === 100 && (
                                <span title="Outstanding">
                                  <Award size={14} className="text-amber-500" />
                                </span>
                              )}
                          </p>
                          <p className="mt-0.5 w-max rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                            {staff.staffCode}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="rounded-lg bg-gray-100 px-3 py-1 font-bold text-gray-700">
                        {staff.assignedShifts} shifts
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold">
                        <span className="text-emerald-600" title="Present">
                          {staff.presentCount}
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className="text-rose-500" title="Absent">
                          {staff.absentCount}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {staff.totalLateMins > 0 || staff.totalEarlyMins > 0 ? (
                        <div className="flex flex-col items-center gap-1 text-xs font-bold text-amber-600">
                          {staff.totalLateMins > 0 && (
                            <div className="flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5">
                              <Clock size={12} /> Late {staff.totalLateMins}m
                            </div>
                          )}
                          {staff.totalEarlyMins > 0 && (
                            <div className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-blue-600">
                              <Clock size={12} /> Early {staff.totalEarlyMins}m
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {staff.assignedShifts === 0 ? (
                        <span className="text-xs font-medium italic text-gray-400">
                          No data
                        </span>
                      ) : (
                        <div className="w-full">
                          <div className="mb-1 flex items-end justify-between">
                            <span
                              className={`text-sm font-black ${getCoverageText(
                                staff.coveragePercentage
                              )}`}
                            >
                              {staff.coveragePercentage}%
                            </span>
                            {staff.coveragePercentage < 70 && (
                              <TrendingDown size={14} className="mb-0.5 text-rose-500" />
                            )}
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${getCoverageColor(
                                staff.coveragePercentage
                              )}`}
                              style={{ width: `${staff.coveragePercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
