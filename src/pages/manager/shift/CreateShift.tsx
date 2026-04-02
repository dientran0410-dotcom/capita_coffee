import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock,
  Layers,
  MapPin,
  PlusCircle,
  Trash2,
} from "lucide-react";
import ManagerFranchiseSelector from "../../../components/manager/ManagerFranchiseSelector";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import { http } from "../../../utils/axiosClient";

async function createShiftApi(payload: any) {
  return http("/shifts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export default function CreateShift() {
  const navigate = useNavigate();
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("single");

  const [singleData, setSingleData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    branchId: "",
  });

  const [bulkData, setBulkData] = useState({
    startDate: "",
    endDate: "",
    branchId: "",
    shifts: [{ startTime: "07:00", endTime: "12:00" }],
  });

  const isBranchActive = selectedBranch?.isActive ?? false;

  useEffect(() => {
    setSingleData((prev) =>
      prev.branchId === selectedBranchId
        ? prev
        : { ...prev, branchId: selectedBranchId }
    );
    setBulkData((prev) =>
      prev.branchId === selectedBranchId
        ? prev
        : { ...prev, branchId: selectedBranchId }
    );
  }, [selectedBranchId]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setSingleData((prev) => ({ ...prev, branchId }));
    setBulkData((prev) => ({ ...prev, branchId }));
    setError(null);
  };

  const handleSingleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSingleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setBulkData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShiftTimeChange = (
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const nextShifts = [...bulkData.shifts];
    nextShifts[index][field] = value;
    setBulkData((prev) => ({ ...prev, shifts: nextShifts }));
  };

  const addShiftTime = () => {
    setBulkData((prev) => ({
      ...prev,
      shifts: [...prev.shifts, { startTime: "", endTime: "" }],
    }));
  };

  const removeShiftTime = (index: number) => {
    setBulkData((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const getDatesBetween = (start: string, end: string) => {
    const dates: string[] = [];
    let current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const handleSingleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBranchId) {
      setError("Please select a franchise first.");
      return;
    }

    if (!isBranchActive) {
      setError("The selected franchise is not active yet.");
      return;
    }

    // THÊM KIỂM TRA GIỜ KẾT THÚC CHO CA LẺ
    if (singleData.startTime >= singleData.endTime) {
      setError("The end time must be after the start time.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createShiftApi({
        date: singleData.date,
        startTime: `${singleData.startTime}:00`,
        endTime: `${singleData.endTime}:00`,
        branchId: selectedBranchId,
      });

      alert("Shift created successfully.");
      navigate(`/manager/shifts?franchiseId=${encodeURIComponent(selectedBranchId)}`);
    } catch (err: any) {
      setError(err?.message || "Create shift failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBranchId) {
      setError("Please select a franchise first.");
      return;
    }

    if (!isBranchActive) {
      setError("The selected franchise is not active yet.");
      return;
    }

    if (bulkData.shifts.length === 0) {
      setError("Please add at least one shift time slot.");
      return;
    }

    // THÊM KIỂM TRA GIỜ KẾT THÚC CHO TẠO CA HÀNG LOẠT
    const hasInvalidTime = bulkData.shifts.some(
      (shift) => shift.startTime && shift.endTime && shift.startTime >= shift.endTime
    );
    if (hasInvalidTime) {
      setError("The end time must be after the start time for all shift slots.");
      return;
    }

    // SỬA LẠI CÂU LỖI CHO NGÀY KẾT THÚC MƯỢT MÀ HƠN BẰNG TIẾNG ANH
    if (new Date(bulkData.startDate) > new Date(bulkData.endDate)) {
      setError("The end date cannot be earlier than the start date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dates = getDatesBetween(bulkData.startDate, bulkData.endDate);
      const requests = dates.flatMap((date) =>
        bulkData.shifts
          .filter((shift) => shift.startTime && shift.endTime)
          .map((shift) =>
            createShiftApi({
              date,
              startTime: `${shift.startTime}:00`,
              endTime: `${shift.endTime}:00`,
              branchId: selectedBranchId,
            })
          )
      );

      await Promise.all(requests);
      alert(`Successfully created ${requests.length} shifts.`);
      navigate(`/manager/shifts?franchiseId=${encodeURIComponent(selectedBranchId)}`);
    } catch (err: any) {
      setError(err?.message || "Bulk create failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Shift</h1>
          <p className="text-sm text-gray-500">
            Choose a managed franchise, then create one or many shifts for it.
          </p>
        </div>
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

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
        <MapPin className="shrink-0 text-amber-600" size={20} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Working Franchise
          </p>
          <p className="text-sm font-bold text-gray-900">
            {selectedBranch?.displayName || "N/A"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <ManagerFranchiseSelector
            branches={branches}
            value={selectedBranchId}
            onChange={handleBranchChange}
            loading={loadingBranches}
            helperText="The selected franchise will be used for both single and bulk shift creation."
          />
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => {
              setMode("single");
              setError(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
              mode === "single"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarPlus size={18} /> Create Single Shift
          </button>
          <button
            onClick={() => {
              setMode("bulk");
              setError(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
              mode === "bulk"
                ? "bg-white text-amber-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers size={18} /> Create Auto Schedule
          </button>
        </div>

        <div className="mt-6">
          {error && (
            <div className="mb-6 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {!isBranchActive && selectedBranchId && (
            <div className="mb-6 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
              The selected franchise is not active, so new shifts cannot be created.
            </div>
          )}

          {mode === "single" && (
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Shift Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <CalendarPlus className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    required
                    disabled={!isBranchActive}
                    value={singleData.date}
                    onChange={handleSingleChange}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      name="startTime"
                      required
                      disabled={!isBranchActive}
                      value={singleData.startTime}
                      onChange={handleSingleChange}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      name="endTime"
                      required
                      disabled={!isBranchActive}
                      value={singleData.endTime}
                      onChange={handleSingleChange}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="submit"
                  disabled={loading || !isBranchActive || !selectedBranchId}
                  className={`w-full rounded-lg px-6 py-2.5 text-sm font-bold text-white transition-colors md:w-auto ${
                    loading || !isBranchActive || !selectedBranchId
                      ? "cursor-not-allowed bg-gray-400 opacity-70"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {loading ? "Creating..." : "Create Single Shift"}
                </button>
              </div>
            </form>
          )}

          {mode === "bulk" && (
            <form onSubmit={handleBulkSubmit} className="space-y-6">
              <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4">
                <CalendarDays
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={20}
                />
                <p className="text-sm leading-relaxed text-amber-800">
                  <b>Instructions:</b> Choose a date range, then define the shift
                  time slots to generate for the selected franchise.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    From Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    disabled={!isBranchActive}
                    value={bulkData.startDate}
                    onChange={handleBulkChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    To Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    disabled={!isBranchActive}
                    value={bulkData.endDate}
                    onChange={handleBulkChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">
                  Time Slots per Day
                </label>

                {bulkData.shifts.map((shift, index) => (
                  <div
                    key={`${shift.startTime}-${shift.endTime}-${index}`}
                    className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:flex-nowrap"
                  >
                    <div className="min-w-[120px] flex-1">
                      <label className="mb-1 block text-xs font-semibold text-gray-500">
                        Start Time
                      </label>
                      <input
                        type="time"
                        required
                        disabled={!isBranchActive}
                        value={shift.startTime}
                        onChange={(event) =>
                          handleShiftTimeChange(index, "startTime", event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-amber-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div className="min-w-[120px] flex-1">
                      <label className="mb-1 block text-xs font-semibold text-gray-500">
                        End Time
                      </label>
                      <input
                        type="time"
                        required
                        disabled={!isBranchActive}
                        value={shift.endTime}
                        onChange={(event) =>
                          handleShiftTimeChange(index, "endTime", event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-amber-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div className="pt-5">
                      <button
                        type="button"
                        onClick={() => removeShiftTime(index)}
                        disabled={bulkData.shifts.length === 1 || !isBranchActive}
                        className="rounded-lg p-2 text-red-500 transition-colors disabled:opacity-30 hover:bg-red-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addShiftTime}
                  disabled={!isBranchActive}
                  className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition-colors disabled:opacity-50 hover:text-blue-800"
                >
                  <PlusCircle size={18} /> Add another shift in the day
                </button>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-6">
                <button
                  type="submit"
                  disabled={loading || !isBranchActive || !selectedBranchId}
                  className={`w-full rounded-lg px-6 py-3 text-sm font-bold text-white shadow-md transition-colors md:w-auto ${
                    loading || !isBranchActive || !selectedBranchId
                      ? "cursor-not-allowed bg-gray-400 opacity-70"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {loading ? "Creating bulk schedule..." : "Generate Bulk Shifts"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}