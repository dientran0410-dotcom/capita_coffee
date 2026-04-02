import { useEffect, useState } from "react";
import {
  ChevronDown,
  Clock,
  RefreshCw,
  Search,
  Users,
  MapPin,
} from "lucide-react";
import ManagerFranchiseSelector from "../../../components/manager/ManagerFranchiseSelector";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import { getStaffAttendanceHistory as getStaffAttendanceHistoryApi } from "../../../services/attendanceService";
import { formatManagerBranchDisplay } from "../../../services/managerBranchService";
import { http } from "../../../utils/axiosClient";

async function getAllStaffs(page = 0, size = 1000) {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return http(`/api/shift-service/staffs?${q.toString()}`);
}

const getTodayDateLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatTime = (time: any) => {
  if (!time) return "-";
  if (Array.isArray(time)) {
    return `${String(time[0]).padStart(2, "0")}:${String(time[1] || 0).padStart(
      2,
      "0"
    )}`;
  }
  return String(time).substring(0, 5);
};

const formatDateUI = (value: any) => {
  if (!value) return "-";
  if (Array.isArray(value)) {
    return `${String(value[2]).padStart(2, "0")}/${String(value[1]).padStart(
      2,
      "0"
    )}/${value[0]}`;
  }

  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${day}/${month}/${year}` : String(value);
};

export default function StaffAttendanceHistory() {
  const { user } = useAuth();
  const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";

  const {
    branches,
    selectedBranch,
    selectedBranchId,
    branchDisplayMap,
    loading: loadingBranches,
    error: branchError,
    setSelectedBranchId,
  } = useManagerBranchSelection(authFranchiseId as string);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState("MONTH");
  const [monthStr, setMonthStr] = useState(getCurrentMonthStr());
  const [exactDate, setExactDate] = useState(getTodayDateLocal());
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStaffs, setLoadingStaffs] = useState(false);

  const isBranchActive = selectedBranch?.isActive ?? false;

  useEffect(() => {
    setSelectedStaff("");
    setHistory([]);
    setSearchTerm("");
    setIsDropdownOpen(false);
  }, [selectedBranchId]);

  useEffect(() => {
    if (loadingBranches || !selectedBranchId || !isBranchActive) {
      setStaffList([]);
      setLoadingStaffs(false);
      return;
    }

    const loadStaffs = async () => {
      setLoadingStaffs(true);
      try {
        const res: any = await getAllStaffs();
        const list = res?.content || res || [];
        setStaffList(
          Array.isArray(list)
            ? list.filter(
                (staff: any) =>
                  String(staff?.branchId || "").trim() === selectedBranchId
              )
            : []
        );
      } catch (err) {
        console.error(err);
        setStaffList([]);
      } finally {
        setLoadingStaffs(false);
      }
    };

    loadStaffs();
  }, [selectedBranchId, isBranchActive, loadingBranches]);

  useEffect(() => {
    if (!selectedStaff || !selectedBranchId || !isBranchActive) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);

      try {
        let response: any;
        if (filterType === "MONTH") {
          const [year, month] = monthStr.split("-");
          response = await getStaffAttendanceHistoryApi(
            selectedStaff,
            parseInt(month, 10),
            parseInt(year, 10),
            undefined,
            selectedBranchId
          );
        } else {
          response = await getStaffAttendanceHistoryApi(
            selectedStaff,
            undefined,
            undefined,
            exactDate,
            selectedBranchId
          );
        }

        const items =
          response?.content ??
          response?.result ??
          response?.data?.result ??
          response?.data ??
          response ??
          [];

        setHistory(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error(err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedStaff, filterType, monthStr, exactDate, selectedBranchId, isBranchActive]);

  const renderStatus = (
    status: string,
    lateMins: number,
    earlyMins: number
  ) => {
    if (status === "PRESENT") {
      return (
        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          Present
        </span>
      );
    }
    if (status === "LATE") {
      return (
        <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          Late {lateMins}m
        </span>
      );
    }
    if (status === "EARLY_LEAVE") {
      return (
        <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          Early leave {earlyMins}m
        </span>
      );
    }
    if (status === "ABSENT") {
      return (
        <span className="rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
          Absent
        </span>
      );
    }
    return (
      <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
        Not marked
      </span>
    );
  };

  const filteredStaffs = staffList.filter((staff) => {
    const term = searchTerm.toLowerCase();
    const name = String(staff.name || "").toLowerCase();
    const code = String(staff.staffCode || "").toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  const selectedStaffInfo =
    staffList.find((staff) => staff.id === selectedStaff) || null;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Search className="text-amber-500" /> Staff Attendance History Lookup
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a franchise, then inspect each staff member's shift attendance by
          month or by day.
        </p>
      </div>

      {branchError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {branchError}
        </div>
      )}

      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ManagerFranchiseSelector
          branches={branches}
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          loading={loadingBranches}
          helperText="Only staff and attendance history from the selected franchise will be shown."
        />

        {!loadingBranches && !selectedBranchId && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            No franchise is available for this manager account.
          </div>
        )}

        {!loadingBranches && selectedBranchId && !isBranchActive && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            The selected franchise is not active yet, so attendance history is unavailable.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              1. Search Employee <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 text-amber-500" size={18} />
              <input
                type="text"
                disabled={!selectedBranchId || !isBranchActive}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder={
                  loadingStaffs
                    ? "Loading staff list..."
                    : "Type name or staff ID..."
                }
                value={
                  isDropdownOpen
                    ? searchTerm
                    : selectedStaffInfo
                    ? `${selectedStaffInfo.name} (${selectedStaffInfo.staffCode})`
                    : ""
                }
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  if (!selectedBranchId || !isBranchActive) return;
                  setIsDropdownOpen(true);
                  setSearchTerm("");
                }}
                onBlur={() => {
                  setTimeout(() => setIsDropdownOpen(false), 200);
                }}
              />
              <ChevronDown
                className="pointer-events-none absolute right-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>

            {isDropdownOpen && selectedBranchId && isBranchActive && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                {loadingStaffs ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    Loading employees...
                  </div>
                ) : filteredStaffs.length === 0 ? (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    No employees found.
                  </div>
                ) : (
                  filteredStaffs.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex cursor-pointer items-center justify-between border-b border-gray-50 px-4 py-2.5 transition-colors last:border-none hover:bg-amber-50"
                      onClick={() => {
                        setSelectedStaff(staff.id);
                        setSearchTerm("");
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-800">{staff.name}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">{staff.email}</p>
                      </div>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">
                        {staff.staffCode}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              2. Filter Data By
            </label>
            <div className="flex items-center gap-3">
              <div className="flex shrink-0 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setFilterType("MONTH")}
                  disabled={!selectedBranchId || !isBranchActive}
                  className={`rounded-md px-3 py-1.5 text-sm font-bold transition-all ${
                    filterType === "MONTH"
                      ? "bg-white text-amber-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Month
                </button>
                <button
                  onClick={() => setFilterType("DATE")}
                  disabled={!selectedBranchId || !isBranchActive}
                  className={`rounded-md px-3 py-1.5 text-sm font-bold transition-all ${
                    filterType === "DATE"
                      ? "bg-white text-amber-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Date
                </button>
              </div>

              <div className="min-w-[120px] flex-1">
                {filterType === "MONTH" ? (
                  <input
                    type="month"
                    value={monthStr}
                    disabled={!selectedBranchId || !isBranchActive}
                    onChange={(event) => setMonthStr(event.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                ) : (
                  <input
                    type="date"
                    value={exactDate}
                    disabled={!selectedBranchId || !isBranchActive}
                    onChange={(event) => setExactDate(event.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!selectedStaff ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-slate-50 p-16 text-center text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">
            Please choose a franchise and select an employee above to view history.
          </p>
        </div>
      ) : (
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
              <RefreshCw size={28} className="mb-3 animate-spin text-amber-500" />
            </div>
          )}

          <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50 px-6 py-4">
            <h2 className="text-sm font-bold text-gray-800">
              Shift List ({history.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left">
              <thead className="border-b border-gray-100 bg-white">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">
                    Work Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">
                    Time
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-400">
                    Attendance Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-gray-500">
                      No shift data available in this time period.
                    </td>
                  </tr>
                ) : (
                  history.map((shift, index) => (
                    <tr
                      key={shift.id || shift.shiftId || index}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {formatDateUI(shift.date)}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {shift.shiftStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        <div className="flex w-max items-center gap-1.5 rounded bg-blue-50 px-2.5 py-1 text-blue-700">
                          <Clock size={14} /> {formatTime(shift.startTime)} -{" "}
                          {formatTime(shift.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-400" />
                          {formatManagerBranchDisplay(shift.branchId, branchDisplayMap)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {renderStatus(
                          shift.attendanceStatus,
                          shift.lateMinutes,
                          shift.earlyLeaveMinutes
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
