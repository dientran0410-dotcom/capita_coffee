import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Clock, MapPin } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import { http } from "../../../utils/axiosClient";

async function getShiftById(id: string) {
  return http(`/shifts/${id}`);
}

async function updateShiftApi(id: string, payload: any) {
  return http(`/shifts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

const formatTimeForInput = (time: unknown) => {
  if (!time) return "";
  if (typeof time === "string") return time.substring(0, 5);
  if (Array.isArray(time)) {
    return `${String(time[0]).padStart(2, "0")}:${String(
      time[1] || 0
    ).padStart(2, "0")}`;
  }
  return "";
};

const shortenId = (value: string) =>
  value && value.length > 8 ? `SH-${value.substring(0, 5).toUpperCase()}` : value;

export default function UpdateShift() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";

  const {
    branches,
    loading: loadingBranches,
    error: branchError,
    selectedBranchId,
    setSelectedBranchId,
  } = useManagerBranchSelection(authFranchiseId as string);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shift, setShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    branchId: "",
  });

  useEffect(() => {
    const fetchShift = async () => {
      if (!id) {
        setError("Shift ID not found.");
        setInitialLoading(false);
        return;
      }

      try {
        const data: any = await getShiftById(id);
        setShift(data);
        setFormData({
          date: data?.date || "",
          startTime: formatTimeForInput(data?.startTime),
          endTime: formatTimeForInput(data?.endTime),
          branchId: data?.branchId || "",
        });
      } catch (err: any) {
        setError(err?.message || "Could not load shift data.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchShift();
  }, [id]);

  const managedBranch = useMemo(() => {
    if (!shift?.branchId) return null;
    return branches.find((branch) => branch.branchId === shift.branchId) ?? null;
  }, [branches, shift]);

  useEffect(() => {
    if (!shift?.branchId || loadingBranches) return;

    if (!managedBranch) {
      setError("You do not have permission to update shifts from another franchise.");
      return;
    }

    if (selectedBranchId !== shift.branchId) {
      setSelectedBranchId(shift.branchId);
    }

    if (!managedBranch.isActive) {
      setError("This franchise is not active, so the shift cannot be updated.");
      return;
    }

    setError(null);
  }, [
    managedBranch,
    loadingBranches,
    selectedBranchId,
    setSelectedBranchId,
    shift,
  ]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      setError("Shift ID not found.");
      return;
    }

    if (!managedBranch) {
      setError("You do not have permission to update this shift.");
      return;
    }

    if (!managedBranch.isActive) {
      setError("This franchise is not active.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateShiftApi(id, {
        date: formData.date,
        startTime:
          formData.startTime.length === 5
            ? `${formData.startTime}:00`
            : formData.startTime,
        endTime:
          formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
        branchId: managedBranch.branchId,
      });

      alert("Shift updated successfully.");
      navigate(
        `/manager/shifts?franchiseId=${encodeURIComponent(managedBranch.branchId)}`
      );
    } catch (err: any) {
      setError(err?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || loadingBranches) {
    return <div className="p-10 text-center text-gray-500">Loading shift data...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            Update Shift <span className="text-amber-600">{shortenId(id as string)}</span>
          </h1>
          <p className="text-sm text-gray-500">
            The shift stays locked to the franchise it was originally created for.
          </p>
        </div>
      </div>

      {branchError && (
        <div className="rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
          {branchError}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
        <MapPin className="shrink-0 text-amber-600" size={20} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Franchise
          </p>
          <p className="text-sm font-bold text-gray-900">
            {managedBranch?.displayName || shift?.branchId || "N/A"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-6 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Shift Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <CalendarPlus className="h-5 w-5 text-blue-500" />
              </div>
              <input
                type="date"
                name="date"
                required
                disabled={!managedBranch?.isActive}
                value={formData.date}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Clock className="h-5 w-5 text-emerald-500" />
                </div>
                <input
                  type="time"
                  name="startTime"
                  required
                  disabled={!managedBranch?.isActive}
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                End Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Clock className="h-5 w-5 text-rose-500" />
                </div>
                <input
                  type="time"
                  name="endTime"
                  required
                  disabled={!managedBranch?.isActive}
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Franchise
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MapPin className="h-5 w-5 text-amber-500" />
              </div>
              <input
                type="text"
                value={managedBranch?.displayName || shift?.branchId || ""}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm font-semibold text-gray-800"
              />
            </div>
            <p className="ml-1 mt-1.5 text-xs text-gray-400">
              Franchise is locked to prevent moving a shift into another branch by accident.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !managedBranch?.isActive}
              className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors ${
                loading || !managedBranch?.isActive
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
