import { useEffect, useMemo, useState } from "react";
import { X, AlertCircle, CheckCircle, Loader, Eye, EyeOff } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { createAccount } from "../../../services/UserManagementService";
import { getAdminFranchises } from "../../../services/franchiseService";
import { createStaff as createStaffAPI } from "../../../services/staffService";
import { useAuth } from "../../../context/AuthContext";
import { extractUserId } from "../../../utils/authHelpers";
import type { FranchiseSummary } from "../../../types/franchise";
import type { CreateAccountRequest } from "../../../types/user";

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  franchiseId: string;
  onSuccess?: () => void;
}

type AdminCreateAccountForm = CreateAccountRequest & {
  gender: string;
  dateOfBirth: string;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
};

const maxDob = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
};

const extractCreatedAccountUserId = (response: unknown): string => {
  const payload = toRecord(response);
  const data = toRecord(payload.data);
  const result = toRecord(payload.result);
  const dataData = toRecord(data.data);
  const dataResult = toRecord(data.result);
  const resultData = toRecord(result.data);
  const resultResult = toRecord(result.result);

  return pickString(
    data.id,
    data.userId,
    result.id,
    result.userId,
    dataData.id,
    dataData.userId,
    dataResult.id,
    dataResult.userId,
    resultData.id,
    resultData.userId,
    resultResult.id,
    resultResult.userId
  );
};

export function CreateCustomerModal({
  isOpen,
  onClose,
  franchiseId,
  onSuccess,
}: CreateCustomerModalProps) {
  const { currentUser } = useAuth();
  type InternalRole =
    | "MANAGER"
    | "SUPPLIER"
    | "WAREHOUSE_MANAGER"
    | "INVENTORY_MANAGER";

  const ROLE_OPTIONS: Array<{ value: InternalRole; label: string }> = useMemo(
    () => [
      { value: "MANAGER", label: "Manager" },
      { value: "SUPPLIER", label: "Supplier" },
      { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
      { value: "INVENTORY_MANAGER", label: "Inventory Manager" },
    ],
    []
  );

  /**
   * Helper: Determine if a role requires franchiseId
   * Assumption: All operational roles tied to a specific franchise require franchiseId
   * - MANAGER: manages a specific franchise
   * - SUPPLIER: supplies to specific franchises
   * - WAREHOUSE_MANAGER: manages warehouse for a specific franchise
   * - INVENTORY_MANAGER: manages inventory for a specific franchise
   */
  const requiresFranchise = (role: InternalRole): boolean =>
    ["MANAGER", "SUPPLIER", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER"].includes(
      role
    );

  /**
   * Helper: Determine if a role requires staff profile creation
   * Currently only MANAGER requires staff profile creation
   * (STAFF role removed in new business logic)
   */
  const requiresStaffProfile = (role: InternalRole): boolean =>
    role === "MANAGER";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [franchises, setFranchises] = useState<FranchiseSummary[]>([]);
  const [franchisesLoading, setFranchisesLoading] = useState(false);
  const [franchisesError, setFranchisesError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AdminCreateAccountForm>({
    email: "",
    name: "",
    address: "",
    phone: "",
    password: "",
    franchiseId: franchiseId || undefined,
    roleName: "MANAGER",
    gender: "OTHER",
    dateOfBirth: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (nextRole: InternalRole) => {
    setError(null);
    setFormData((prev) => {
      const next: CreateAccountRequest = { ...prev, roleName: nextRole };

      if (requiresFranchise(nextRole)) {
        const existing = prev.franchiseId?.trim();
        const fallback = franchiseId?.trim();
        return {
          ...next,
          gender: prev.gender,
          dateOfBirth: prev.dateOfBirth,
          franchiseId: existing || fallback || undefined,
        };
      }

      return {
        ...next,
        gender: prev.gender,
        dateOfBirth: prev.dateOfBirth,
        franchiseId: undefined,
      };
    });
  };

  // Load franchises when modal opens (for the franchise dropdown).
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const load = async () => {
      try {
        setFranchisesLoading(true);
        setFranchisesError(null);

        const resp = await getAdminFranchises();
        const list = Array.isArray((resp as any)?.data) ? (resp as any).data : resp;
        setFranchises((list && Array.isArray(list) ? (list as FranchiseSummary[]) : []) ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setFranchisesError(e?.message || "Failed to load franchises");
        setFranchises([]);
      } finally {
        if (mounted) setFranchisesLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // After franchises load, ensure current franchiseId exists in the dropdown.
  useEffect(() => {
    if (!isOpen) return;
    const role = formData.roleName as InternalRole;
    if (!requiresFranchise(role)) return;
    if (franchisesLoading) return;

    const current = formData.franchiseId?.trim();
    const exists = current ? franchises.some((f) => f.franchiseId === current) : false;

    if (current && exists) return;
    const first = franchises[0]?.franchiseId;
    if (first) {
      setFormData((prev) => ({ ...prev, franchiseId: first }));
    }
  }, [franchises, franchisesLoading, isOpen, formData.roleName, formData.franchiseId]);

  // ESC key handler to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.name || !formData.phone || !formData.password) {
      setError("Please fill in all required fields (Email, Full Name, Phone, Password)");
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const role = formData.roleName as InternalRole;
    if (formData.roleName === "CUSTOMER") {
      setError("CUSTOMER role is not supported in this admin create flow.");
      return;
    }

    if (requiresFranchise(role)) {
      const selected = formData.franchiseId?.trim();
      if (!selected) {
        setError("Please select a franchise for this role.");
        return;
      }
    }

    if (requiresStaffProfile(role) && (!formData.gender || !formData.dateOfBirth)) {
      setError("Gender and Date of Birth are required for staff/manager account creation.");
      return;
    }

    let accountCreated = false;
    let staffCreated = false;

    try {
      setLoading(true);
      setError(null);

      const payload: CreateAccountRequest = {
        ...formData,
        franchiseId: requiresFranchise(role) ? formData.franchiseId : undefined,
      };

      const response = await createAccount(payload);
      const accountUserId = extractCreatedAccountUserId(response);
      const creatorUserId = extractUserId(currentUser);
      const isAccountCreated = response.success === true || accountUserId.length > 0;

      console.log("[CreateCustomerModal] Response:", response);

      if (!isAccountCreated) {
        setError(response.message || "Failed to create account");
        return;
      }
      accountCreated = true;

      if (requiresStaffProfile(role)) {
        if (!accountUserId) {
          throw new Error("Account created response missing user id.");
        }

        await createStaffAPI({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          branchId: formData.franchiseId?.trim(),
          userId: accountUserId,
          managerUserId: creatorUserId || accountUserId,
        });
        staffCreated = true;
      }

      if (isAccountCreated) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setFormData({
            email: "",
            name: "",
            address: "",
            phone: "",
            password: "",
            franchiseId: franchiseId || undefined,
            roleName: "MANAGER",
            gender: "OTHER",
            dateOfBirth: "",
          });
          setConfirmPassword("");
          setSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      console.error("[CreateCustomerModal] Error:", err);
      const errorMsg = err?.response?.data?.message ||
        err?.response?.data?.result?.userId ||
        err?.response?.data?.result?.phone ||
        err?.response?.data?.result?.dateOfBirth ||
        err?.response?.data?.result?.gender ||
        err?.message ||
        "Error creating account/staff profile";
      setError(
        accountCreated && !staffCreated
          ? `Account created but staff profile creation failed: ${errorMsg}`
          : errorMsg
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-md flex items-center justify-center z-[100000] !m-0"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New Account
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Account created successfully!</p>
                <p className="text-xs text-green-700 mt-1">User can now login with the email and password set above.</p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-600">*</span>
            </label>
            <Input
              type="email"
              name="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading || success}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-600">*</span>
            </label>
            <Input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading || success}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-600">*</span>
            </label>
            <Input
              type="tel"
              name="phone"
              placeholder="0912345678"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading || success}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading || success}
                required
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 pr-10 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || success}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} color="currentColor" /> : <Eye size={20} color="currentColor" />}
              </button>
            </div>
            {formData.password && formData.password.length < 6 && (
              <p className="text-xs text-red-600 mt-1">Password must be at least 6 characters</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || success}
                required
                className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 pr-10 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading || success}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} color="currentColor" /> : <Eye size={20} color="currentColor" />}
              </button>
            </div>
            {confirmPassword && formData.password !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <Input
              type="text"
              name="address"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleInputChange}
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="roleName"
              value={(formData.roleName as InternalRole) || "STAFF"}
              onChange={(e) => handleRoleChange(e.target.value as InternalRole)}
              disabled={loading || success}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {requiresFranchise(formData.roleName as InternalRole) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Franchise <span className="text-red-600">*</span>
              </label>
              <select
                name="franchiseId"
                value={formData.franchiseId || ""}
                onChange={(e) => {
                  const next = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    franchiseId:
                      next && next.trim().length > 0 ? next : undefined,
                  }));
                }}
                disabled={franchisesLoading || loading || success}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
              >
                {franchisesLoading ? (
                  <option value="" disabled>
                    Loading franchises...
                  </option>
                ) : (
                  <>
                    <option value="" disabled>
                      Select a franchise
                    </option>
                    {franchises.map((f) => (
                      <option key={f.franchiseId} value={f.franchiseId}>
                        {f.franchiseName} ({f.franchiseCode})
                      </option>
                    ))}
                  </>
                )}
              </select>
              {franchisesError && (
                <p className="text-xs text-red-600 mt-1">{franchisesError}</p>
              )}
            </div>
          )}

          {requiresStaffProfile(formData.roleName as InternalRole) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-600">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-600">*</span>
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  max={maxDob()}
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  required
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleSubmit}
            disabled={loading || success}
            className="flex-1 bg-amber-600 hover:bg-amber-700"
          >
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Creating..." : success ? "Created!" : "Create Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
