import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { http } from "../../../utils/axiosClient";
import { useAuth } from "../../../context/AuthContext";
import {
    formatManagerBranchDisplay,
    resolveManagerBranchDisplayMap,
} from "../../../services/managerBranchService";

async function getShiftById(id) {
    return http(`/shifts/${id}`);
}

async function fetchStaffByShift(shiftId) {
    return http(`/shifts/${shiftId}/staff`);
}

async function fetchAttendanceByShift(shiftId) {
    return http(`/shifts/${shiftId}/attendance`);
}

async function bulkMarkAttendance(shiftId, attendances) {
    return http(`/shifts/${shiftId}/attendance/bulk`, {
        method: 'POST',
        body: JSON.stringify({ attendances }),
    });
}
import { CalendarDays, Clock, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

const STATUS_CFG = {
    PRESENT: { label: "Present (On Time)", bg: "#dcfce7", text: "#15803d", border: "#86efac", dot: "#22c55e", icon: "" },
    LATE: { label: "Late", bg: "#fef9c3", text: "#a16207", border: "#fde047", dot: "#eab308", icon: "" },
    ABSENT: { label: "Absent", bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5", dot: "#ef4444", icon: "" },
    EARLY_LEAVE: { label: "Early Leave", bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd", dot: "#3b82f6", icon: "" },
};

const SHIFT_STATUS_CFG = {
    OPEN: { label: "Open", bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
    PREPARING: { label: "Preparing", bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
    CLOSED: { label: "Closed", bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
};

const STATUSES = Object.keys(STATUS_CFG);
const ACLRS = ["#f97316","#3b82f6","#22c55e","#8b5cf6","#ef4444","#eab308","#06b6d4","#ec4899"];
const avatarBg = (n) => ACLRS[(n?.charCodeAt(0) ?? 0) % ACLRS.length];

const formatTime = (time) => {
    if (!time) return "-";
    if (typeof time === "string") return time.substring(0, 5);
    if (Array.isArray(time)) return `${String(time[0]).padStart(2, '0')}:${String(time[1] || 0).padStart(2, '0')}`;
    return "-";
};

const formatDateUI = (d) => {
    if (!d) return "-";
    let year, month, day;
    if (Array.isArray(d)) { year = d[0]; month = String(d[1]).padStart(2, '0'); day = String(d[2]).padStart(2, '0'); }
    else if (typeof d === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { [year, month, day] = d.split('-'); } else return d.replace(/-/g, '/');
    } else return String(d);
    return `${day}/${month}/${year}`;
};

const formatShiftId = (id) => id ? `SH-${id.substring(0, 5).toUpperCase()}` : "-";

function Avatar({ name = "?", size = 38, inactive = false }) {
    return <div style={{ width: size, height: size, borderRadius: Math.round(size * .32), background: inactive ? "#e5e7eb" : avatarBg(name), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: inactive ? "#9ca3af" : "#fff", fontWeight: 800, fontSize: size * .38, boxShadow: inactive ? "none" : `0 2px 8px ${avatarBg(name)}50` }}>{name.charAt(0)}</div>;
}

function StatusBadge({ status }) {
    const c = STATUS_CFG[status];
    if (!c) return null;
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, border: `1.5px solid ${c.border}` }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }}/>{c.label}</span>;
}

export default function ShiftAttendance() {
    const params = useParams();
    const shiftId = params.shiftId || params.id;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";
    const franchiseIdFromQuery = searchParams.get("franchiseId") || "";
    const dateFromQuery = searchParams.get("date") || "";

    const [shift, setShift] = useState(null);
    const [staff, setStaff] = useState([]);
    const [att, setAtt] = useState<Record<string, { action: string | null }>>({});
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveState, setSaveState] = useState("idle");
    const [filter, setFilter] = useState("ALL");
    const [branchDisplayMap, setBranchDisplayMap] = useState<Record<string, string>>({});

    useEffect(() => {
        let mounted = true;

        resolveManagerBranchDisplayMap(authFranchiseId as string).then((displayMap) => {
            if (!mounted) return;
            setBranchDisplayMap(displayMap || {});
        });

        return () => {
            mounted = false;
        };
    }, [authFranchiseId]);

    const loadData = useCallback(async () => {
        if (!shiftId) return setError("Shift ID not found in URL!");
        setLoading(true); setError(null);
        try {
            const [shiftInfo, staffData, recData] = await Promise.all([
                getShiftById(shiftId),
                fetchStaffByShift(shiftId),
                fetchAttendanceByShift(shiftId)
            ]);

            const staffList = Array.isArray(staffData?.content) ? staffData.content : (Array.isArray(staffData) ? staffData : []);
            let recList = Array.isArray(recData?.content) ? recData.content : (Array.isArray(recData) ? recData : []);

            if (shiftInfo.status === "CLOSED") {
                const existingRecIds = recList.map(r => r.staffId);
                const autoAbsents = staffList
                    .filter(s => s.status !== "INACTIVE" && !existingRecIds.includes(s.id))
                    .map(s => ({ staffId: s.id, status: "ABSENT", lateMinutes: 0, earlyLeaveMinutes: 0, isAuto: true }));
                recList = [...recList, ...autoAbsents];
            }

            setShift(shiftInfo); setStaff(staffList); setRecords(recList);

            const map = {};
            recList.forEach(r => {
                const actionUI = r.status || "";
                map[r.staffId] = { action: actionUI };
            });
            staffList.forEach(s => { if (!map[s.id]) map[s.id] = { action: null }; });
            setAtt(map);
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    }, [shiftId]);

    useEffect(() => { loadData(); }, [loadData]);

    const isOpen = shift?.status === "OPEN" || shift?.status === "PREPARING";

    const activeStaff   = staff.filter(s => s.status !== "INACTIVE");
    const inactiveStaff = staff.filter(s => s.status === "INACTIVE");

    const handleMarkAction = (staffId, actionType) => {
        if (!isOpen) return;
        if (staff.find(s => s.id === staffId)?.status === "INACTIVE") return;
        setAtt(p => ({ ...p, [staffId]: { action: p[staffId]?.action === actionType ? null : actionType } }));
        setSaveState("idle");
    };

    async function handleSave() {
        if (!isOpen) return;
        const activeIds = new Set(activeStaff.map(s => s.id));
        const payload = Object.entries(att)
            .filter(([staffId, v]) => v?.action && activeIds.has(staffId))
            .map(([staffId, v]) => {
                const sendStatus = v.action === "LATE" ? "PRESENT" : v.action;
                return { staffId, status: sendStatus };
            });

        if (!payload.length) return;
        setSaveState("saving");
        try {
            await bulkMarkAttendance(shiftId, payload);
            setSaveState("saved");
            await loadData();
            setTimeout(() => setSaveState("idle"), 3000);
        }
        catch (e) { setError(e.message); setSaveState("error"); setTimeout(() => setSaveState("idle"), 3000); }
    }

    const markedCount = Object.entries(att).filter(([id, v]) => v?.action && activeStaff.some(s => s.id === id)).length;
    const pct = activeStaff.length ? Math.round((markedCount / activeStaff.length) * 100) : 0;
    const counts = Object.entries(att)
        .filter(([id]) => activeStaff.some(s => s.id === id))
        .reduce((a, [, v]) => { if (v?.action) a[v.action] = (a[v.action] || 0) + 1; return a; }, {});

    const filteredStaff =
        filter === "ALL"      ? staff :
        filter === "INACTIVE" ? inactiveStaff :
        filter === "UNMARKED" ? activeStaff.filter(s => !att[s.id]?.action) :
        filter === "PRESENT"  ? activeStaff.filter(s => att[s.id]?.action === "PRESENT" || att[s.id]?.action === "LATE") :
                                activeStaff.filter(s => att[s.id]?.action === filter);

    const shiftCfg = SHIFT_STATUS_CFG[shift?.status] ?? SHIFT_STATUS_CFG.CLOSED;

    const pendingCount = Object.entries(att).filter(([id, v]) => {
        if (!activeStaff.some(s => s.id === id)) return false;
        const rec = records.find(r => r.staffId === id);
        if (!rec && v.action) return true;
        if (!rec) return false;
        const beIsCheckedIn = rec.status === "PRESENT" || rec.status === "LATE";
        const feIsCheckedIn = v.action  === "PRESENT"  || v.action  === "LATE";
        if (beIsCheckedIn && feIsCheckedIn) return false;
        return rec.status !== v.action;
    }).length;

    const SAVE_CFG = {
        idle: { label: `Save Attendance${pendingCount > 0 ? ` (${pendingCount})` : ""}`, bg: "#f97316" },
        saving: { label: "Saving...", bg: "#fb923c" },
        saved: { label: "Saved", bg: "#22c55e" },
        error: { label: "Retry", bg: "#ef4444" },
    };

    const effectiveFranchiseId = franchiseIdFromQuery || shift?.branchId || "";
    const backQuery = new URLSearchParams();
    if (effectiveFranchiseId) backQuery.set("franchiseId", effectiveFranchiseId);
    if (dateFromQuery) backQuery.set("date", dateFromQuery);
    const backPath = `/manager/attendance${backQuery.toString() ? `?${backQuery.toString()}` : ""}`;

    if (error) return <div className="p-10 text-center text-red-600 bg-red-50 rounded-xl border border-red-200"><h2 className="text-xl font-bold mb-2">An error occurred</h2><p>{error}</p><button onClick={() => navigate(backPath)} className="mt-4 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg">Go back</button></div>;

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }} className="pb-10">
            <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} } .att-row { transition: background .12s; } .att-row:hover { background: #fafbfc !important; } .status-btn { transition: all .13s ease; cursor: pointer; } .status-btn:hover { transform: translateY(-1px); } .status-btn:active { transform: scale(.97); }`}</style>

            <div className="flex items-center gap-2 text-sm font-medium mb-6">
                <button onClick={() => navigate(backPath)} className="text-gray-400 hover:text-amber-600 transition-colors">Shift List</button>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-bold">Mark Attendance</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 pointer-events-none">
                    <CheckCircle2 size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-gray-900 m-0">Shift: {formatShiftId(shift?.id)}</h1>
                        {shift && <StatusBadge status={shift.status} />}
                    </div>
                    {shift && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-100">
                                <CalendarDays size={16} />{formatDateUI(shift.date)}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
                                <Clock size={16} />{formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-sm font-bold border border-slate-200">
                                <MapPin size={16} />
                                {formatManagerBranchDisplay(shift.branchId, branchDisplayMap)}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative z-10 flex-shrink-0">
                    {isOpen ? (
                        <button onClick={handleSave} disabled={pendingCount === 0 || saveState === "saving"}
                            className="px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{ background: SAVE_CFG[saveState].bg }}>
                            {SAVE_CFG[saveState].label}
                        </button>
                    ) : (
                        <div className="px-5 py-2.5 rounded-xl text-sm font-bold border flex items-center gap-2" style={{ background: shiftCfg.bg, color: shiftCfg.text, borderColor: `${shiftCfg.dot}40` }}>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: shiftCfg.dot }}></div>
                            {shift?.status === "CLOSED" ? "Shift closed - Cannot edit" : "Shift not started yet"}
                        </div>
                    )}
                </div>
            </div>

            {inactiveStaff.length > 0 && (
                <div className="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-500 mt-0.5" />
                    <div>
                        <div className="text-sm font-bold text-red-700">
                            {inactiveStaff.length} staff members have left - cannot mark attendance
                        </div>
                        <div className="text-xs text-red-500 mt-1">
                            {inactiveStaff.map(s => s.name).join(", ")}
                        </div>
                    </div>
                </div>
            )}

            {loading ? <div className="py-20 text-center text-gray-500 font-medium">Loading attendance data...</div> : (
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>

                    <div style={{ padding: "14px 20px", background: "#fafafa", borderBottom: "1px solid #f0f2f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            {STATUSES.map(k => <div key={k} style={{ fontSize: 12, color: "#6b7280" }}>{STATUS_CFG[k].label}: <b style={{ color: "#111827" }}>{counts[k] || 0}</b></div>)}
                            <div style={{ fontSize: 12, color: "#6b7280" }}>Unmarked: <b style={{ color: "#f97316" }}>{activeStaff.length - markedCount}</b></div>
                            {inactiveStaff.length > 0 && <div style={{ fontSize: 12, color: "#b91c1c" }}>Inactive: <b>{inactiveStaff.length}</b></div>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#f97316" }}>{markedCount}/{activeStaff.length} ({pct}%) Complete</span>
                    </div>

                    <div style={{ height: 4, background: "#f3f4f6" }}><div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22c55e" : "#f97316", transition: "width .5s" }}/></div>

                    <div style={{ padding: "10px 20px", borderBottom: "1px solid #f0f2f5", display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[
                            { key: "ALL",      label: `All (${staff.length})` },
                            ...STATUSES.map(k => ({ key: k, label: `${STATUS_CFG[k].label} (${counts[k]||0})` })),
                            ...(inactiveStaff.length > 0 ? [{ key: "INACTIVE", label: `Inactive (${inactiveStaff.length})` }] : []),
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                                background: filter === tab.key ? (tab.key === "INACTIVE" ? "#fee2e2" : "#f97316") : "#f3f4f6",
                                color: filter === tab.key ? (tab.key === "INACTIVE" ? "#b91c1c" : "#fff") : "#6b7280",
                            }}>{tab.label}</button>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr", padding: "12px 20px", background: "#f8f9fb", borderBottom: "1px solid #e5e7eb" }}>
                        {["#", "Staff Member", isOpen ? "Action" : "Result"].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>{h}</div>)}
                    </div>

                    {filteredStaff.map((s, i) => {
                        const curAction = att[s.id]?.action;
                        const rec       = records.find(r => r.staffId === s.id);
                        const inactive  = s.status === "INACTIVE";

                        return (
                            <div key={s.id || `staff-${i}`} className="att-row" style={{
                                display: "grid", gridTemplateColumns: "44px 1fr 1fr",
                                padding: "16px 20px", borderBottom: "1px solid #f3f4f6",
                                background: inactive ? "#fff8f8" : "transparent",
                            }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#d1d5db" }}>{i+1}</span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <Avatar name={s.name || s.staffName} size={42} inactive={inactive}/>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 14, color: inactive ? "#9ca3af" : "#111827", display: "flex", alignItems: "center", gap: 6 }}>
                                            {s.name || s.staffName || "Employee"}
                                            {inactive && (
                                                <span style={{ fontSize: 10, fontWeight: 600, color: "#b91c1c", background: "#fee2e2", padding: "1px 7px", borderRadius: 10, border: "1px solid #fca5a5" }}>
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>{s.email || "No Email"}</div>

                                        {rec && !inactive && (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                                                {rec.lateMinutes === 0 && (rec.status === "PRESENT" || rec.status === "EARLY_LEAVE") && <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700, background: "#dcfce7", padding: "2px 8px", borderRadius: 12 }}>Check-in On Time</span>}
                                                {rec.lateMinutes > 0 && <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 700, background: "#fee2e2", padding: "2px 8px", borderRadius: 12 }}>Late {rec.lateMinutes} min</span>}
                                                {rec.earlyLeaveMinutes === 0 && (rec.status === "PRESENT" || rec.status === "LATE") && rec.updatedAt && !rec.isAuto && <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700, background: "#dcfce7", padding: "2px 8px", borderRadius: 12 }}>Check-out On Time</span>}
                                                {rec.earlyLeaveMinutes > 0 && <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 700, background: "#dbeafe", padding: "2px 8px", borderRadius: 12 }}>Left Early {rec.earlyLeaveMinutes} min</span>}
                                                {rec.status === "ABSENT" && <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 700, background: "#fee2e2", padding: "2px 8px", borderRadius: 12 }}>{rec.isAuto ? "Absent (Auto-closed by system)" : "Absent"}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                    {inactive ? (
                                        <span style={{ fontSize: 12, color: "#fca5a5", fontStyle: "italic", fontWeight: 600 }}>
                                            Cannot mark attendance
                                        </span>
                                    ) : isOpen ? (
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="status-btn" onClick={() => handleMarkAction(s.id, "PRESENT")} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "2px solid", background: (curAction === "PRESENT" || curAction === "LATE") ? "#dcfce7" : "#f9fafb", color: (curAction === "PRESENT" || curAction === "LATE") ? "#15803d" : "#6b7280", borderColor: (curAction === "PRESENT" || curAction === "LATE") ? "#86efac" : "#e5e7eb" }}>Check In</button>
                                            <button className="status-btn" onClick={() => handleMarkAction(s.id, "EARLY_LEAVE")} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "2px solid", background: curAction === "EARLY_LEAVE" ? "#dbeafe" : "#f9fafb", color: curAction === "EARLY_LEAVE" ? "#1d4ed8" : "#6b7280", borderColor: curAction === "EARLY_LEAVE" ? "#93c5fd" : "#e5e7eb" }}>Check Out</button>
                                            <button className="status-btn" onClick={() => handleMarkAction(s.id, "ABSENT")} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "2px solid", background: curAction === "ABSENT" ? "#fee2e2" : "#f9fafb", color: curAction === "ABSENT" ? "#b91c1c" : "#6b7280", borderColor: curAction === "ABSENT" ? "#fca5a5" : "#e5e7eb" }}>Absent</button>
                                        </div>
                                    ) : (
                                        rec?.status ? <StatusBadge status={rec.status}/> : <span style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic", fontWeight: 600 }}>Cannot edit</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
