import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  Search,
  XCircle,
} from "lucide-react";
import ManagerFranchiseSelector from "../../../components/manager/ManagerFranchiseSelector";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import { formatManagerBranchDisplay } from "../../../services/managerBranchService";
import type { StaffScheduleResponse } from "../../../services/staffScheduleService";
import { getSchedulesByStaffId } from "../../../services/staffScheduleService";
import { http } from "../../../utils/axiosClient";

// Staff data structure from API
interface StaffData {
  id: string;
  name: string;
  staffCode?: string;
  branchId: string;
  [key: string]: unknown;
}

// Paginated response structure
interface PaginatedResponse<T> {
  content?: T[];
  [key: string]: unknown;
}

// Schedule with branch display info
interface ScheduleWithBranch extends Omit<StaffScheduleResponse, 'startTime' | 'endTime'> {
  branch?: string;
  startTime: string | number[];
  endTime: string | number[];
}

async function getAllStaffs(page = 0, size = 100): Promise<PaginatedResponse<StaffData>> {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  return http(`/api/shift-service/staffs?${q.toString()}`);
}

function StatCard({ icon, label, value, bg }: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}>) {
  return (
    <div
      className="flex w-full items-center gap-2 rounded-lg p-3 sm:gap-3 sm:p-4"
      style={{ background: bg }}
    >
      <div className="shrink-0 rounded-md bg-white/30 p-2">{icon}</div>
      <div className="min-w-0 overflow-hidden">
        <div className="truncate text-xs text-gray-500 sm:text-sm">{label}</div>
        <div className="truncate text-xl font-bold sm:text-2xl">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const value = String(status || "");
  if (value === "COMPLETED" || value === "PRESENT") {
    return (
      <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700 sm:px-3 sm:text-xs">
        COMPLETED
      </span>
    );
  }
  if (value === "IN_PROGRESS") {
    return (
      <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 sm:px-3 sm:text-xs">
        IN_PROGRESS
      </span>
    );
  }
  if (value === "ABSENT" || value === "CANCELED") {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700 sm:px-3 sm:text-xs">
        ABSENT
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700 sm:px-3 sm:text-xs">
      SCHEDULED
    </span>
  );
}

const formatShiftId = (id: string | undefined): string => {
  if (!id) return "-";
  return `SH-${String(id).substring(0, 5).toUpperCase()}`;
};

const formatTime = (value: string | number[] | undefined): string => {
  if (!value) return "-";
  if (Array.isArray(value)) {
    return `${String(value[0]).padStart(2, "0")}:${String(value[1] || 0).padStart(
      2,
      "0"
    )}`;
  }
  return String(value).substring(0, 5);
};

export default function StaffSchedules() {
  const { user } = useAuth();
  const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";
  const navigate = useNavigate();

  const {
    branches,
    selectedBranch,
    selectedBranchId,
    branchDisplayMap,
    loading: loadingBranches,
    error: branchError,
    setSelectedBranchId,
  } = useManagerBranchSelection(authFranchiseId as string);

  const [staffs, setStaffs] = useState<StaffData[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffData | null>(null);
  const [schedules, setSchedules] = useState<ScheduleWithBranch[]>([]);
  const [loadingStaffs, setLoadingStaffs] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [query, setQuery] = useState("");

  const isBranchActive = selectedBranch?.isActive ?? false;

  useEffect(() => {
    setSelectedStaff(null);
    setSchedules([]);
    setQuery("");
  }, [selectedBranchId]);

  useEffect(() => {
    if (loadingBranches || !selectedBranchId || !isBranchActive) {
      setStaffs([]);
      setLoadingStaffs(false);
      return;
    }

    const loadStaffs = async () => {
      setLoadingStaffs(true);
      try {
        const data: PaginatedResponse<StaffData> = await getAllStaffs(0, 100);
        const list = data?.content || (Array.isArray(data) ? data : []);
        setStaffs(
          Array.isArray(list)
            ? list.filter(
                (staff: StaffData) =>
                  String(staff?.branchId || "").trim() === selectedBranchId
              )
            : []
        );
      } catch (error) {
        console.error("Error fetching staffs:", error);
        setStaffs([]);
      } finally {
        setLoadingStaffs(false);
      }
    };

    loadStaffs();
  }, [selectedBranchId, isBranchActive, loadingBranches]);

  useEffect(() => {
    if (!selectedStaff?.id || !selectedBranchId || !isBranchActive) {
      setSchedules([]);
      setLoadingSchedules(false);
      return;
    }

    const loadSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const data = await getSchedulesByStaffId(selectedStaff.id);
        setSchedules(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [selectedStaff, selectedBranchId, isBranchActive]);

  const total = schedules.length;
  const completed = schedules.filter(
    (item) => item.status === "COMPLETED" || item.status === "PRESENT"
  ).length;
  const absent = schedules.filter(
    (item) => item.status === "ABSENT" || item.status === "CANCELED"
  ).length;
  const scheduled = schedules.filter((item) => item.status === "SCHEDULED").length;

  const filteredStaffs = staffs.filter((staff) => {
    const term = query.toLowerCase();
    return (
      String(staff.name || "").toLowerCase().includes(term) ||
      String(staff.staffCode || "").toLowerCase().includes(term)
    );
  });

  const goToAttendance = (schedule: ScheduleWithBranch) => {
    if (!schedule?.shiftId) return;

    const params = new URLSearchParams();
    if (selectedBranchId) params.set("franchiseId", selectedBranchId);
    if (schedule?.date) params.set("date", schedule.date);

    const queryString = params.toString();
    navigate(
      `/manager/attendance/${encodeURIComponent(schedule.shiftId)}${
        queryString ? `?${queryString}` : ""
      }`
    );
  };

  return (
    <div className="w-full max-w-full overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Staff Schedules</h1>
      </div>

      {branchError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {branchError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm">
            <label className="mb-3 block text-sm font-semibold text-gray-500">
              Select Franchise
            </label>

            <ManagerFranchiseSelector
              branches={branches}
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              loading={loadingBranches}
              helperText="Switch franchise to load the corresponding staff list."
            />

            {!loadingBranches && !selectedBranchId && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                No franchise is available for this manager account.
              </div>
            )}

            {!loadingBranches && selectedBranchId && !isBranchActive && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                The selected franchise is not active yet.
              </div>
            )}

            <label className="mb-3 mt-5 block text-sm font-semibold text-gray-500">
              Select Staff Member
            </label>

            <div className="flex items-center gap-2 rounded-lg border bg-gray-50/50 p-2">
              <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="Search by name or code"
                value={query}
                disabled={!selectedBranchId || !isBranchActive}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-3 max-h-[35vh] overflow-y-auto pr-1 lg:max-h-[60vh]">
              {loadingStaffs && (
                <div className="py-2 text-sm text-gray-500">Loading staff list...</div>
              )}

              {!loadingStaffs &&
                filteredStaffs.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`my-1 w-full rounded-lg border px-3 py-2 text-left transition-colors sm:py-3 ${
                      selectedStaff?.id === staff.id
                        ? "border-sky-200 bg-sky-50 shadow-sm"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="truncate text-sm font-semibold text-gray-800">
                      {staff.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-gray-500">
                      {staff.staffCode || staff.id}
                    </div>
                  </button>
                ))}

              {!loadingStaffs && filteredStaffs.length === 0 && (
                <div className="py-4 text-center text-sm text-gray-500">
                  No staff found
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="border-b pb-4 sm:border-0 sm:pb-0">
                <div className="text-sm text-gray-500">
                  {selectedStaff ? "Showing schedules for" : "Status"}
                </div>
                <div className="text-lg font-bold text-gray-900 sm:text-xl">
                  {selectedStaff ? selectedStaff.name : "Please select a staff"}
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard
                  icon={<Calendar className="h-5 w-5 text-sky-600" />}
                  label="Total Shifts"
                  value={total}
                  bg="#f0f9ff"
                />
                <StatCard
                  icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                  label="Completed"
                  value={completed}
                  bg="#ecfdf5"
                />
                <StatCard
                  icon={<Calendar className="h-5 w-5 text-gray-600" />}
                  label="Scheduled"
                  value={scheduled}
                  bg="#f8fafc"
                />
                <StatCard
                  icon={<XCircle className="h-5 w-5 text-red-600" />}
                  label="Absent"
                  value={absent}
                  bg="#fff1f2"
                />
              </div>
            </div>

            <div className="mt-6 w-full overflow-hidden rounded-lg border border-gray-200">
              <div className="w-full overflow-x-auto">
                {loadingSchedules && (
                  <div className="p-6 text-center text-gray-500">
                    Loading schedules...
                  </div>
                )}

                {!loadingSchedules && !selectedStaff && (
                  <div className="bg-gray-50/30 p-8 text-center text-gray-400">
                    Please select a staff from the list to view schedules.
                  </div>
                )}

                {!loadingSchedules && selectedStaff && schedules.length === 0 && (
                  <div className="bg-gray-50/30 p-8 text-center text-gray-400">
                    No schedules assigned to this staff.
                  </div>
                )}

                {!loadingSchedules && schedules.length > 0 && (
                  <table className="min-w-[750px] w-full table-auto text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 sm:py-4">
                          Date
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 sm:py-4">
                          Shift ID
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 sm:py-4">
                          Start
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 sm:py-4">
                          End
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 sm:py-4">
                          Branch
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 sm:py-4">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 sm:py-4">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {schedules.map((schedule) => (
                        <tr
                          key={schedule.id}
                          className="bg-white transition-colors hover:bg-gray-50/80"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800 sm:py-4">
                            {schedule.date}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 sm:py-4">
                            {formatShiftId(schedule.shiftId)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-800 sm:py-4">
                            {formatTime(schedule.startTime)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-800 sm:py-4">
                            {formatTime(schedule.endTime)}
                          </td>
                          <td className="max-w-[220px] truncate px-4 py-3 text-sm text-gray-600 sm:py-4">
                            {formatManagerBranchDisplay(
                              schedule.branchId,
                              branchDisplayMap,
                              schedule.branch
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm sm:py-4">
                            <StatusBadge status={schedule.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm sm:py-4">
                            <button
                              onClick={() => goToAttendance(schedule)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-gray-50 hover:text-sky-600"
                            >
                              <Calendar size={14} />
                              <span className="hidden sm:inline">Attendance</span>
                              <span className="sm:hidden">View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
