import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Edit,
  Lock,
  MapPin,
  RefreshCw,
  Trash2,
} from "lucide-react";
import ManagerFranchiseSelector from "../../../components/manager/ManagerFranchiseSelector";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import {
  formatManagerBranchDisplay,
} from "../../../services/managerBranchService";
import { deleteShift, getShiftsByDate } from "../../../services/shiftService";

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDate = (value: unknown) => {
  if (!value) return "";
  if (Array.isArray(value)) {
    return `${value[0]}-${String(value[1]).padStart(2, "0")}-${String(
      value[2]
    ).padStart(2, "0")}`;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(value)) {
      const separator = value.includes("/") ? "/" : "-";
      const [day, month, year] = value.split(separator);
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return String(value);
};

const displayDate = (value: unknown) => {
  const normalized = normalizeDate(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-");
    return `${day}/${month}/${year}`;
  }
  return normalized;
};

const formatTime = (time: unknown) => {
  if (!time) return "--";
  if (typeof time === "string") return time.substring(0, 5);
  if (Array.isArray(time)) {
    return `${String(time[0]).padStart(2, "0")}:${String(
      time[1] || 0
    ).padStart(2, "0")}`;
  }
  return "--";
};

export default function ShiftList() {
  const navigate = useNavigate();
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

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(getTodayDate());

  const branchDisplay = selectedBranch?.displayName || "";
  const isBranchActive = selectedBranch?.isActive ?? false;

  const fetchShiftsByDateAPI = async (dateToFetch: string) => {
    if (!selectedBranchId) {
      setShifts([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getShiftsByDate(dateToFetch, selectedBranchId);
      const list = data?.content || (Array.isArray(data) ? data : []);
      setShifts(list);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingBranches) {
      setLoading(false);
      return;
    }

    if (!isBranchActive || !selectedBranchId || !filterDate) {
      setShifts([]);
      setLoading(false);
      return;
    }

    fetchShiftsByDateAPI(filterDate);
  }, [filterDate, selectedBranchId, isBranchActive, loadingBranches]);

  const handleDelete = async (id: string, status: string) => {
    if (!isBranchActive) {
      alert("The selected franchise is not active yet.");
      return;
    }

    if (status !== "PREPARING") {
      alert("Only shifts in PREPARING status can be deleted.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this shift?")) {
      return;
    }

    try {
      await deleteShift(id);
      alert("Deleted successfully.");
      fetchShiftsByDateAPI(filterDate);
    } catch (error: any) {
      alert(error?.message || "Delete failed.");
    }
  };

  const navigateToCreateShift = () => {
    const basePath = "/manager/shifts/create";
    if (!selectedBranchId) {
      navigate(basePath);
      return;
    }

    navigate(`${basePath}?franchiseId=${encodeURIComponent(selectedBranchId)}`);
  };

  const shortenId = (id: string) =>
    id?.length > 8 ? `SH-${id.substring(0, 5).toUpperCase()}` : id;

  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PREPARING: "bg-blue-100 text-blue-700 border-blue-200",
      OPEN: "bg-green-100 text-green-700 border-green-200",
      CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
    };

    return (
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
          styles[status] || styles.CLOSED
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shift Management</h1>
        <button
          onClick={navigateToCreateShift}
          disabled={loadingBranches || !isBranchActive || !selectedBranchId}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-colors ${
            loadingBranches || !isBranchActive || !selectedBranchId
              ? "cursor-not-allowed bg-gray-300 text-gray-500"
              : "bg-amber-600 text-white hover:bg-amber-700"
          }`}
        >
          <Calendar className="h-4 w-4" /> Create New Shift
        </button>
      </div>

      {branchError && (
        <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
          {branchError}
        </div>
      )}

      {!loadingBranches && (!selectedBranchId || !isBranchActive) && (
        <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={20} />
          <p className="text-sm font-medium text-red-700">
            {selectedBranchId
              ? "The selected franchise is not active, so shifts cannot be viewed or managed yet."
              : "No franchise is available for this manager account."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="min-w-[280px] flex-1">
          <ManagerFranchiseSelector
            branches={branches}
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            loading={loadingBranches}
            helperText="Switch franchise here to view the corresponding shift list."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
            Search by Date <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={() => setFilterDate(getTodayDate())}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600"
            >
              Today
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            if (filterDate) fetchShiftsByDateAPI(filterDate);
          }}
          disabled={loadingBranches || !isBranchActive || !selectedBranchId}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin text-amber-500" : ""}
          />{" "}
          Refresh
        </button>
      </div>

      <div className="relative min-h-[300px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
            <RefreshCw size={28} className="mb-3 animate-spin text-amber-500" />
            <span className="text-sm font-bold text-gray-600">
              Searching data...
            </span>
          </div>
        )}

        <table className="w-full text-left">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                ID
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                Schedule
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                Branch
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {!loading && shifts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar size={40} className="text-gray-300" />
                    <p className="font-medium">
                      No shifts on{" "}
                      <b className="text-amber-600">
                        {displayDate(filterDate) || "this day"}
                      </b>
                      .
                    </p>
                    {isBranchActive && (
                      <button
                        onClick={navigateToCreateShift}
                        className="mt-1 text-sm font-bold text-amber-600 hover:underline"
                      >
                        + Click here to create new
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id} className="transition-colors hover:bg-amber-50/30">
                  <td className="px-6 py-4 text-sm font-bold text-amber-700">
                    {shortenId(shift.id)}
                  </td>
                  <td className="px-6 py-4">{renderStatusBadge(shift.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="font-bold text-gray-900">
                      {displayDate(shift.date)}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3 text-amber-500" />{" "}
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    <div
                      className="flex items-center gap-1.5"
                      title={formatManagerBranchDisplay(
                        shift.branchId,
                        branchDisplayMap,
                        branchDisplay
                      )}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="max-w-[250px] truncate font-bold text-gray-800">
                        {formatManagerBranchDisplay(
                          shift.branchId,
                          branchDisplayMap,
                          branchDisplay
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {shift.status === "PREPARING" && isBranchActive ? (
                        <>
                          <button
                            onClick={() =>
                              navigate(
                                `/manager/shifts/update/${shift.id}?franchiseId=${encodeURIComponent(
                                  shift.branchId || selectedBranchId
                                )}`
                              )
                            }
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-100"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(shift.id, shift.status)}
                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-100"
                            title="Delete shift"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-400">
                          <Lock className="h-3 w-3" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            Locked
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
