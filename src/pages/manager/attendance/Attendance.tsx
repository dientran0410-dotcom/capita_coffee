import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarX2,
  ChevronRight,
  Clock,
  CloudSun,
  MapPin,
  Moon,
  RefreshCw,
  Sun,
  Users,
  X,
} from "lucide-react";
import ManagerFranchiseSelector from "../../../components/manager/ManagerFranchiseSelector";
import { useAuth } from "../../../context/AuthContext";
import { useManagerBranchSelection } from "../../../hooks/useManagerBranchSelection";
import {
  formatManagerBranchDisplay,
} from "../../../services/managerBranchService";
import { getShiftsByDate as getShiftsByDateService } from "../../../services/shiftService";

const getTodayDateLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const getInitialAttendanceDate = () => {
  try {
    const dateFromQuery = new URLSearchParams(window.location.search).get("date");
    if (dateFromQuery) return dateFromQuery;
  } catch {
    // Ignore query read errors.
  }
  return getTodayDateLocal();
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

const formatShiftId = (id: string) => {
  if (!id) return "--";
  return `SH-${id.substring(0, 5).toUpperCase()}`;
};

function getPeriod(startTime: unknown) {
  let hour = 0;
  if (Array.isArray(startTime)) {
    hour = parseInt(String(startTime[0] ?? "0"), 10);
  } else if (typeof startTime === "string") {
    hour = parseInt(startTime.split(":")[0] ?? "0", 10);
  }

  if (hour >= 5 && hour < 12) {
    return {
      label: "Morning",
      color: "#f97316",
      bg: "#fff7ed",
      icon: <Sun size={20} />,
    };
  }

  if (hour >= 12 && hour < 18) {
    return {
      label: "Afternoon",
      color: "#3b82f6",
      bg: "#eff6ff",
      icon: <CloudSun size={20} />,
    };
  }

  return {
    label: "Night",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    icon: <Moon size={20} />,
  };
}

const STATUS_PILL: Record<string, any> = {
  OPEN: { bg: "#dcfce7", color: "#15803d", dot: "#22c55e", label: "Open" },
  PREPARING: {
    bg: "#fef9c3",
    color: "#a16207",
    dot: "#eab308",
    label: "Preparing",
  },
  CLOSED: { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af", label: "Closed" },
};

function ShiftCard({
  shift,
  onClick,
  branchLabel,
  onDisabledClick,
}: Readonly<{
  shift: any;
  onClick: () => void;
  branchLabel: string;
  onDisabledClick: (message: string) => void;
}>) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const period = getPeriod(shift.startTime);

  const isAvailable = shift.status === "OPEN";
  const isClosed = shift.status === "CLOSED";
  const pillCfg = STATUS_PILL[shift.status] ?? STATUS_PILL.CLOSED;

  const handleCardClick = () => {
    if (isAvailable || isClosed) {
      onClick();
      return;
    }

    onDisabledClick(
      "Attendance is not open for this shift yet. It becomes available 30 minutes before start time."
    );
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => (isAvailable || isClosed) && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `2px solid ${
          hovered && (isAvailable || isClosed) ? period.color : "#e8eaed"
        }`,
        padding: "18px 20px",
        cursor: isAvailable || isClosed ? "pointer" : "not-allowed",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow:
          hovered && (isAvailable || isClosed)
            ? `0 8px 24px ${period.color}20`
            : "0 1px 4px rgba(0,0,0,.05)",
        transform: pressed
          ? "scale(.98)"
          : hovered && (isAvailable || isClosed)
          ? "translateY(-2px)"
          : "none",
        transition: "all .18s ease",
        opacity: isAvailable || isClosed ? 1 : 0.65,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: period.bg,
              color: period.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {period.icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>
              {formatShiftId(shift.id)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: period.color }}>
              {period.label} Shift
            </div>
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: pillCfg.bg,
            color: pillCfg.color,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: pillCfg.dot,
            }}
          />
          {pillCfg.label}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#374151",
          }}
        >
          <Clock size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#374151",
          }}
        >
          <MapPin size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 500,
            }}
          >
            {branchLabel}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#374151",
          }}
        >
          <Users size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
          {shift.staffCount ?? "0"} staff assigned
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "10px 0",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          background: isAvailable
            ? hovered
              ? period.color
              : "#fff7ed"
            : isClosed
            ? "#f3f4f6"
            : "#f9fafb",
          color: isAvailable ? (hovered ? "#fff" : period.color) : "#9ca3af",
          border: `1.5px solid ${
            isAvailable ? (hovered ? period.color : `${period.color}40`) : "#e5e7eb"
          }`,
          transition: "all .18s ease",
          marginTop: 4,
        }}
      >
        {isAvailable ? "Mark Attendance" : isClosed ? "View Attendance" : "Locked"}
        {hovered && isAvailable && <ChevronRight size={16} />}
      </div>
    </div>
  );
}

export default function Attendance() {
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

  const [date, setDate] = useState(getInitialAttendanceDate());
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isBranchActive = selectedBranch?.isActive ?? false;
  const branchDisplay = selectedBranch?.displayName || "";

  const load = (targetDate: string) => {
    if (!selectedBranchId) {
      setError("Please choose a franchise first.");
      setShifts([]);
      setLoading(false);
      return;
    }

    if (!isBranchActive) {
      setError("The selected franchise is not active yet.");
      setShifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getShiftsByDateService(targetDate, selectedBranchId)
      .then((data: any) => {
        const list = data?.content || (Array.isArray(data) ? data : []);
        setShifts(list);
      })
      .catch((err: any) => setError(err?.message || "Failed to load shifts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (loadingBranches) return;
    if (date) load(date);
  }, [date, selectedBranchId, isBranchActive, loadingBranches]);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}
          >
            Attendance
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Switch franchise to view the corresponding shift list for attendance.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 280 }}>
            <ManagerFranchiseSelector
              branches={branches}
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              loading={loadingBranches}
              helperText="Attendance only shows shifts from the selected franchise."
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <button
              onClick={() => setDate(getTodayDateLocal())}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600"
            >
              Today
            </button>
            <button
              onClick={() => load(date)}
              disabled={loadingBranches || !selectedBranchId || !isBranchActive}
              className="rounded-lg border bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {branchError && (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            borderRadius: 10,
          }}
        >
          {branchError}
        </div>
      )}

      {localError && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: 12,
            marginBottom: 20,
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <AlertCircle size={20} color="#d97706" />
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
            {localError}
          </span>
          <button
            onClick={() => setLocalError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 72, color: "#9ca3af" }}>
          <RefreshCw className="mr-2 inline animate-spin" size={20} /> Loading
          shifts...
        </div>
      ) : shifts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CalendarX2 size={48} style={{ color: "#d1d5db" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7280" }}>
            No shifts found for {date}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              branchLabel={formatManagerBranchDisplay(
                shift.branchId,
                branchDisplayMap,
                branchDisplay
              )}
              onClick={() => {
                const params = new URLSearchParams();
                if (selectedBranchId) {
                  params.set("franchiseId", selectedBranchId);
                }
                if (date) {
                  params.set("date", date);
                }

                const queryString = params.toString();
                navigate(
                  `/manager/attendance/${shift.id}${
                    queryString ? `?${queryString}` : ""
                  }`
                );
              }}
              onDisabledClick={(message: string) => setLocalError(message)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
