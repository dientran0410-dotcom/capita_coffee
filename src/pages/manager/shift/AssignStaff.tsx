import React, { useEffect, useState } from "react";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  UserCheck,
  UserPlus,
} from "lucide-react";
import ManagerFranchiseSelector from "../../../components/manager/ManagerFranchiseSelector";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import {
  formatManagerBranchDisplay,
} from "../../../services/managerBranchService";
import {
  assignStaffToShift,
  fetchStaffByShift,
  getShiftsByDate,
} from "../../../services/shiftService";
import { http } from "../../../utils/axiosClient";

// Type definitions
interface Staff {
  id: string;
  staffId?: string;
  name?: string;
  staffName?: string;
  email?: string;
  staffCode?: string;
  gender?: string;
  status?: string;
  branchId?: string;
}

interface Shift {
  id: string;
  date: string | number[];
  startTime: string | number[];
  endTime: string | number[];
  status: string;
  branchId: string;
}

interface ShiftResponse {
  content?: Shift[];
}

interface StaffResponse {
  content?: Staff[];
}

async function getAllStaffs(page = 0, size = 100): Promise<StaffResponse | Staff[]> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return http(`/api/shift-service/staffs?${query.toString()}`);
}

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const formatTime = (time: unknown) => {
  if (!time) return "-";
  if (typeof time === "string") return time.substring(0, 5);
  if (Array.isArray(time)) {
    return `${String(time[0]).padStart(2, "0")}:${String(
      time[1] || 0
    ).padStart(2, "0")}`;
  }
  return "-";
};

const formatDateUI = (value: unknown) => {
  if (!value) return "-";
  if (Array.isArray(value)) {
    return `${String(value[2]).padStart(2, "0")}/${String(value[1]).padStart(
      2,
      "0"
    )}/${value[0]}`;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return String(value).replace(/-/g, "/");
};

const renderGender = (gender: string) => {
  if (!gender) return null;
  if (gender === "MALE") {
    return (
      <span className="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
        Male
      </span>
    );
  }
  if (gender === "FEMALE") {
    return (
      <span className="rounded border border-pink-100 bg-pink-50 px-1.5 py-0.5 text-[10px] font-bold text-pink-600">
        Female
      </span>
    );
  }
  return (
    <span className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
      Other
    </span>
  );
};

export default function AssignStaff() {
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

  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [shiftDetails, setShiftDetails] = useState<Shift | null>(null);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const isBranchActive = selectedBranch?.isActive ?? false;
  const branchDisplay = selectedBranch?.displayName || "";

  useEffect(() => {
    if (loadingBranches || !selectedBranchId || !isBranchActive) {
      return;
    }

    getAllStaffs()
      .then((data) => {
        const staffResponse = data as StaffResponse | Staff[];
        const list = Array.isArray(staffResponse)
          ? staffResponse
          : (staffResponse?.content || []);
        setAllStaff(
          Array.isArray(list)
            ? list.filter(
                (staff: Staff) =>
                  String(staff?.branchId || "").trim() === selectedBranchId
              )
            : []
        );
      })
      .catch(console.error);
  }, [selectedBranchId, isBranchActive, loadingBranches, reloadKey]);

  useEffect(() => {
    if (
      loadingBranches ||
      !filterDate ||
      filterDate.length !== 10 ||
      !selectedBranchId ||
      !isBranchActive
    ) {
      return;
    }

    getShiftsByDate(filterDate, selectedBranchId)
      .then((shiftData: ShiftResponse | Shift[]) => {
        const list = Array.isArray(shiftData)
          ? shiftData
          : (shiftData?.content || []);
        const filtered = list.filter(
          (item: Shift) => item.status === "PREPARING" || item.status === "OPEN"
        );
        setShifts(filtered);
        setSelectedShift("");
      })
      .catch(console.error);
  }, [filterDate, selectedBranchId, isBranchActive, loadingBranches, reloadKey]);

  useEffect(() => {
    if (!selectedShift) {
      return;
    }

    const shiftDetail = shifts.find((item) => item.id === selectedShift) || null;

    Promise.resolve()
      .then(() => {
        setShiftDetails(shiftDetail);
        setLoading(true);
        return fetchStaffByShift(selectedShift);
      })
      .then((assigned) => {
        const staffResponse = assigned as StaffResponse | Staff[];
        const list = Array.isArray(staffResponse)
          ? staffResponse
          : (staffResponse?.content || []);
        setAssignedStaff(Array.isArray(list) ? list : []);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [selectedShift, shifts, reloadKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setReloadKey((prev) => prev + 1);
  };

  const handleAssign = async (staffId: string) => {
    try {
      await assignStaffToShift(selectedShift, { staffId });
      const assigned = await fetchStaffByShift(selectedShift);
      const staffResponse = assigned as StaffResponse | Staff[];
      const list = Array.isArray(staffResponse)
        ? staffResponse
        : (staffResponse?.content || []);
      setAssignedStaff(Array.isArray(list) ? list : []);
    } catch (err) {
      const error = err as Error;
      alert(`Error adding staff: ${error?.message || "Unknown error"}`);
    }
  };

  const assignedIds = assignedStaff.map((staff) => staff.id || staff.staffId);
  const availableStaff = allStaff.filter(
    (staff) =>
      !assignedIds.includes(staff.id) &&
      (staff.status !== "INACTIVE" && staff.status !== "inactive")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <UserCheck className="text-amber-500" /> Assign Staff to Shift
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a franchise first, then assign its staff to the selected shift.
        </p>
      </div>

      {branchError && (
        <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
          {branchError}
        </div>
      )}

      {!loadingBranches && !selectedBranchId && (
        <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
          No franchise is available for this manager account.
        </div>
      )}

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <ManagerFranchiseSelector
            branches={branches}
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            loading={loadingBranches}
            helperText="Switch franchise to load only the shifts and staff belonging to that franchise."
          />
        </div>

        {!isBranchActive && selectedBranchId && (
          <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
            The selected franchise is not active, so staff cannot be assigned to shifts.
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            1. Select Work Date
          </label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <CalendarDays className="h-5 w-5 text-amber-500" />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                className="w-[200px] rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={() => setFilterDate(getTodayDate())}
              className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-600 transition-colors hover:bg-amber-100"
            >
              Today
            </button>
            <button
              onClick={handleRefresh}
              disabled={!selectedBranchId || !isBranchActive || loading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            2. Select Shift
          </label>
          <select
            value={selectedShift}
            onChange={(event) => setSelectedShift(event.target.value)}
            disabled={!selectedBranchId || !isBranchActive || shifts.length === 0}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-400 md:w-1/2"
          >
            <option value="">
              {shifts.length === 0
                ? `-- No available shifts on ${formatDateUI(filterDate)} --`
                : "-- Click to select shift --"}
            </option>
            {shifts.map((shift, index) => (
              <option key={shift.id || `shift-${index}`} value={shift.id}>
                {formatTime(shift.startTime)} - {formatTime(shift.endTime)} | Status:{" "}
                {shift.status}
              </option>
            ))}
          </select>

          {shiftDetails && (
            <div className="mt-4 flex flex-wrap gap-6 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm">
              <div className="flex items-center gap-2 text-amber-800">
                <Calendar size={16} /> <b>Date:</b> {formatDateUI(shiftDetails.date)}
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <Clock size={16} /> <b>Time:</b> {formatTime(shiftDetails.startTime)} -{" "}
                {formatTime(shiftDetails.endTime)}
              </div>
              <div className="flex items-center gap-2 text-amber-800">
                <MapPin size={16} /> <b>Branch:</b>{" "}
                {formatManagerBranchDisplay(
                  shiftDetails.branchId,
                  branchDisplayMap,
                  branchDisplay
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedShift && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-slate-50 px-5 py-4">
              <h2 className="font-bold text-gray-800">
                Available Staff ({availableStaff.length})
              </h2>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2">
              {availableStaff.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  No more staff available.
                </p>
              ) : (
                availableStaff.map((staff, index) => (
                  <div
                    key={staff.id || `available-${index}`}
                    className="flex items-center justify-between rounded-lg border-b border-gray-50 p-3 last:border-0 hover:bg-slate-50"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        {staff.name || staff.staffName}
                        {renderGender(staff.gender)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {staff.email || staff.staffCode || "No email yet"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAssign(staff.id)}
                      className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white"
                    >
                      <UserPlus size={14} /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
              <h2 className="font-bold text-emerald-800">
                Assigned ({assignedStaff.length})
              </h2>
              {loading && (
                <span className="animate-pulse text-xs text-emerald-600">
                  Loading...
                </span>
              )}
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2">
              {assignedStaff.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  No one assigned to this shift yet.
                </p>
              ) : (
                assignedStaff.map((staff, index) => (
                  <div
                    key={staff.id || staff.staffId || `assigned-${index}`}
                    className="flex items-center justify-between rounded-lg border-b border-gray-50 bg-white p-3 last:border-0 hover:bg-emerald-50/30"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        {staff.name || staff.staffName || "Name unknown"}
                        {renderGender(staff.gender)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {staff.email || staff.staffCode || "No email yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={14} /> Assigned
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
