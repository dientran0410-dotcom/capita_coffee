import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus, Phone, MapPin, Calendar, Users, Mail } from "lucide-react";
import { toast } from "sonner";
import { getStaffById, updateStaff as updateStaffAPI, updateStaffStatus as updateStaffStatusAPI } from "@/services/staffService";
import { extractFranchiseList, getManagerFranchises } from "@/services/franchiseService";
import { resolveManagerSelectableFranchise } from "@/utils/managerFranchiseSelection";

// Helper to get manager user ID from authentication context
const getManagerUserId = (): string | null => {
    try {
        // Try 'user' first (main auth storage key)
        const authUser = localStorage.getItem("user");
        if (authUser) {
            const user = JSON.parse(authUser);
            const userId = user?.id || user?.userId || user?.staffId || null;
            console.log("Found manager ID from 'user' key:", userId);
            return userId;
        }

        // Fallback to 'auth_user' if available
        const altAuthUser = localStorage.getItem("auth_user");
        if (altAuthUser) {
            const user = JSON.parse(altAuthUser);
            const userId = user?.id || user?.userId || user?.staffId || null;
            console.log("Found manager ID from 'auth_user' key:", userId);
            return userId;
        }

        console.warn("No auth user data found in localStorage");
    } catch (e) {
        console.error("Failed to get manager user ID:", e);
    }
    return null;
};

const STATUS_CFG = {
    ACTIVE: {
        label:       "Working",
        badgeCls:    "bg-green-100 text-green-700 border-green-200",
        dot:         "bg-green-500",
        actionLabel: "Set Inactive",
        actionCls:   "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
        next:        "INACTIVE",
    },
    INACTIVE: {
        label:       "Inactive",
        badgeCls:    "bg-gray-100 text-gray-500 border-gray-200",
        dot:         "bg-gray-400",
        actionLabel: "Reactivate",
        actionCls:   "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
        next:        "ACTIVE",
    },
};

const inputCls    = "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm";
const disabledCls = "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm";
const labelCls    = "block text-sm font-medium text-gray-700 mb-2";

export default function UpdateStaff() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form,           setForm]           = useState({ name: "", email: "", phone: "", branchId: "", dateOfBirth: "", gender: "MALE" });
    const [branches,       setBranches]       = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [status,         setStatus]         = useState("ACTIVE");
    const [loading,        setLoading]        = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error,          setError]          = useState(null);
    const [confirmStatus,  setConfirmStatus]  = useState(false);
    const [statusLoading,  setStatusLoading]  = useState(false);

    // Fetch branches on mount
    useEffect(() => {
        (async () => {
            try {
                setLoadingBranches(true);
                const response = await getManagerFranchises();
                const branchList = extractFranchiseList(response).filter((branch: any) =>
                    resolveManagerSelectableFranchise(branch)
                );

                if (Array.isArray(branchList)) {
                    setBranches(
                        branchList.map((b: any) => ({
                            value: b.franchiseId,
                            label: `${b.franchiseName || b.name || "Unknown"} (${b.franchiseCode || b.id})`
                        }))
                    );
                }
            } catch (err) {
                console.error("Failed to fetch branches:", err);
            } finally {
                setLoadingBranches(false);
            }
        })();
    }, []);

    // Fetch staff data
    useEffect(() => {
        (async () => {
            try {
                setInitialLoading(true);
                const staffData = await getStaffById(id);
                const data = staffData as any;
                setForm({
                    name:        data?.name        || "",
                    email:       data?.email       || "",
                    phone:       data?.phone       || "",
                    branchId:    data?.branchId    || "",
                    dateOfBirth: data?.dateOfBirth || "",
                    gender:      data?.gender      || "MALE",
                });
                setStatus(data?.status ?? "ACTIVE");
            } catch (err) {
                setError("Unable to load staff information.");
                console.error(err);
            } finally {
                setInitialLoading(false);
            }
        })();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Get manager user ID from auth context
            const managerUserId = getManagerUserId();
            if (!managerUserId) {
                toast.error("Unable to determine your user ID. Please log in again.");
                setLoading(false);
                return;
            }

            // Prepare payload with required fields
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                gender: form.gender.toUpperCase(),
                dateOfBirth: form.dateOfBirth,
                managerUserId: managerUserId, // Include manager user ID
                branchId: form.branchId.trim(), // Include branch ID
            };
            console.log("Updating staff with payload:", JSON.stringify(payload, null, 2));
            await updateStaffAPI(id, payload);
            toast.success("Staff updated successfully!");
            navigate("/manager/staff");
        } catch (err: any) {
            console.error("Error updating staff:", err);
            toast.error(err?.message || "Failed to update staff.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        const cfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
        setStatusLoading(true);
        try {
            await updateStaffStatusAPI(id, cfg.next);
            setStatus(cfg.next);
        } catch (e) {
            alert("Error: " + (e as any)?.message);
        } finally {
            setStatusLoading(false);
            setConfirmStatus(false);
        }
    };

    if (initialLoading) return <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>;

    const cfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Update Staff Info</h1>
                    <p className="text-sm text-gray-500">Edit information: <b className="text-amber-600">{form.name}</b></p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
                <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Employee Status</div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.badgeCls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                        {cfg.label}
                    </span>
                </div>

                {confirmStatus ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Change to <b>{STATUS_CFG[cfg.next].label}</b>?</span>
                        <button onClick={handleToggleStatus} disabled={statusLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${cfg.actionCls}`}>
                            {statusLoading ? "..." : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmStatus(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100">
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setConfirmStatus(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${cfg.actionCls}`}>
                        {cfg.actionLabel}
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium">
                        ? {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-2.5 text-gray-400" size={17}/>
                            <input name="name" required value={form.name} onChange={handleChange} className={inputCls}/>
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Users className="absolute left-3 top-2.5 text-gray-400" size={17}/>
                            <select name="gender" required value={form.gender} onChange={handleChange} className={`${inputCls} bg-white appearance-none`}>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelCls}>Email <span className="text-xs text-gray-400 font-normal">(can't be changed)</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={17}/>
                            <input value={form.email} disabled className={disabledCls}/>
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={17}/>
                            <input
                                name="phone"
                                required
                                value={form.phone}
                                onChange={handleChange}
                                className={inputCls}
                                maxLength={10}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    target.value = target.value.replace(/\D/g, "");
                                    setForm({ ...form, phone: target.value });
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={17}/>
                            <input name="dateOfBirth" type="date" required value={form.dateOfBirth} onChange={handleChange} className={inputCls}/>
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelCls}>Branch</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={17}/>
                            {loadingBranches ? (
                                <select disabled className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none bg-gray-100 text-gray-500 cursor-not-allowed font-medium text-sm">
                                    <option>Loading branches...</option>
                                </select>
                            ) : (
                                <select
                                    name="branchId"
                                    value={form.branchId}
                                    onChange={handleChange}
                                    className={`${inputCls} bg-white appearance-none`}
                                >
                                    <option value="">Select a branch</option>
                                    {branches.map((b) => (
                                        <option key={b.value} value={b.value}>{b.label}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors">
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
