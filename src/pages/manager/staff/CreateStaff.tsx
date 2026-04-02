import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createStaff as createStaffAPI,
  createAccountForStaff,
} from "@/services/staffService";
import { getManagerFranchises } from "@/services/franchiseService";
import { apiUtils } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { resolveManagerSelectableFranchise } from "@/utils/managerFranchiseSelection";

const maxDob = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
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

const resolveActiveFlag = (value: unknown): boolean =>
  resolveManagerSelectableFranchise(value);

const readStorageRecord = (key: string): Record<string, unknown> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return toRecord(JSON.parse(raw));
  } catch {
    return {};
  }
};

const pickArrayRecords = (...values: unknown[]): Record<string, unknown>[] => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object"
      );
    }
  }
  return [];
};

const parseManagerFranchiseList = (response: unknown): Record<string, unknown>[] => {
  const level0 = toRecord(response);
  const level1Data = toRecord(level0.data);
  const level1Result = toRecord(level0.result);
  const level2DataData = toRecord(level1Data.data);
  const level2DataResult = toRecord(level1Data.result);
  const level2ResultData = toRecord(level1Result.data);
  const level2ResultResult = toRecord(level1Result.result);

  return pickArrayRecords(
    level0.content,
    level1Data.content,
    level1Result.content,
    level2DataData.content,
    level2DataResult.content,
    level2ResultData.content,
    level2ResultResult.content,
    level0.data,
    level0.result,
    response
  );
};

const parseFranchiseDetail = (response: unknown): Record<string, unknown> => {
  const level0 = toRecord(response);
  const level1Data = toRecord(level0.data);
  const level1Result = toRecord(level0.result);
  const level2DataData = toRecord(level1Data.data);
  const level2DataResult = toRecord(level1Data.result);
  const level2ResultData = toRecord(level1Result.data);
  const level2ResultResult = toRecord(level1Result.result);

  const candidates = [
    level2DataData,
    level2DataResult,
    level2ResultData,
    level2ResultResult,
    level1Data,
    level1Result,
    level0,
  ];

  for (const candidate of candidates) {
    if (
      pickString(
        candidate.franchiseId,
        candidate.id,
        candidate.franchiseCode,
        candidate.code,
        candidate.franchiseName,
        candidate.name
      )
    ) {
      return candidate;
    }
  }

  return level0;
};

const parseFieldErrors = (value: unknown): FieldErrors => {
  const source = toRecord(value);
  const parsed: FieldErrors = {};

  for (const [key, rawValue] of Object.entries(source)) {
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      parsed[key] = rawValue.trim();
    }
  }

  return parsed;
};

const extractBackendErrorPayload = (error: unknown): Record<string, unknown> => {
  const errorRecord = toRecord(error);
  const responseData = toRecord(toRecord(errorRecord.response).data);
  const rawResponseData = toRecord(toRecord(toRecord(errorRecord.raw).response).data);

  const candidates = [responseData, rawResponseData, errorRecord];

  for (const candidate of candidates) {
    if (
      pickString(candidate.message, candidate.error) ||
      Object.keys(toRecord(candidate.result)).length > 0 ||
      Object.keys(toRecord(candidate.fieldErrors)).length > 0
    ) {
      return candidate;
    }
  }

  return errorRecord;
};

const extractDuplicateFieldError = (error: unknown): string | null => {
  const payload = extractBackendErrorPayload(error);
  const message = pickString(payload.message, payload.error);

  // Check for duplicate phone constraint error
  if (message.includes("users_phone_key") || message.includes("duplicate key value")) {
    return "phone";
  }

  // Check for duplicate email constraint error
  if (message.includes("users_email_key")) {
    return "email";
  }

  return null;
};

const extractCreatedAccountUserId = (response: unknown): string => {
  const payload = toRecord(response);
  const data = toRecord(payload.data);
  const result = toRecord(payload.result);

  return pickString(data.id, data.userId, result.id, result.userId);
};

const resolveManagerContext = (
  authUser: unknown
): {
  managerUserId: string;
  franchiseId: string;
  franchiseCode: string;
} => {
  const userRecord = toRecord(authUser);
  const userRaw = toRecord(userRecord.raw);
  const userRawUser = toRecord(userRaw.user);

  const userStorage = readStorageRecord("user");
  const userStorageRaw = toRecord(userStorage.raw);
  const userStorageRawUser = toRecord(userStorageRaw.user);

  const authUserStorage = readStorageRecord("auth_user");
  const authUserStorageRaw = toRecord(authUserStorage.raw);
  const authUserStorageRawUser = toRecord(authUserStorageRaw.user);

  const managerUserId = pickString(
    userRecord.id,
    userRecord.userId,
    userRecord.staffId,
    userRaw.id,
    userRaw.userId,
    userRaw.staffId,
    userRawUser.id,
    userRawUser.userId,
    userRawUser.staffId,
    userStorage.id,
    userStorage.userId,
    userStorage.staffId,
    userStorageRaw.id,
    userStorageRaw.userId,
    userStorageRaw.staffId,
    userStorageRawUser.id,
    userStorageRawUser.userId,
    userStorageRawUser.staffId,
    authUserStorage.id,
    authUserStorage.userId,
    authUserStorage.staffId,
    authUserStorageRaw.id,
    authUserStorageRaw.userId,
    authUserStorageRaw.staffId,
    authUserStorageRawUser.id,
    authUserStorageRawUser.userId,
    authUserStorageRawUser.staffId
  );

  const franchiseId = pickString(
    userRecord.franchiseId,
    userRaw.franchiseId,
    userRawUser.franchiseId,
    userStorage.franchiseId,
    userStorageRaw.franchiseId,
    userStorageRawUser.franchiseId,
    authUserStorage.franchiseId,
    authUserStorageRaw.franchiseId,
    authUserStorageRawUser.franchiseId
  );

  const franchiseCode = pickString(
    userRecord.franchiseCode,
    userRecord.code,
    userRaw.franchiseCode,
    userRaw.code,
    userRawUser.franchiseCode,
    userRawUser.code,
    userStorage.franchiseCode,
    userStorage.code,
    userStorageRaw.franchiseCode,
    userStorageRaw.code,
    userStorageRawUser.franchiseCode,
    userStorageRawUser.code,
    authUserStorage.franchiseCode,
    authUserStorage.code,
    authUserStorageRaw.franchiseCode,
    authUserStorageRaw.code,
    authUserStorageRawUser.franchiseCode,
    authUserStorageRawUser.code
  );

  return { managerUserId, franchiseId, franchiseCode };
};

interface FieldErrors {
  [key: string]: string;
}

type BranchOption = {
  value: string;
  label: string;
  franchiseName?: string;
  franchiseCode?: string;
  isActive: boolean;
};

export default function CreateStaff() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingFranchiseInfo, setLoadingFranchiseInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [managerUserId, setManagerUserId] = useState("");
  const [managerFranchiseId, setManagerFranchiseId] = useState("");
  const [managerFranchiseCode, setManagerFranchiseCode] = useState("");
  const [franchiseDisplayName, setFranchiseDisplayName] = useState("");
  const [isFranchiseActive, setIsFranchiseActive] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: "",
    dateOfBirth: "",
    gender: "MALE",
  });

  const lockedByManager = useMemo(() => branches.length === 1, [branches.length]);

  useEffect(() => {
    const ctx = resolveManagerContext(user);
    setManagerUserId(ctx.managerUserId);
    setManagerFranchiseId(ctx.franchiseId);
    setManagerFranchiseCode(ctx.franchiseCode);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingBranches(true);
        const response = await getManagerFranchises();
        const branchList = parseManagerFranchiseList(response).filter((item) =>
          resolveManagerSelectableFranchise(item)
        );

        if (!mounted) return;

        const mappedBranches: BranchOption[] = branchList.map((b) => {
          const value = String(b?.franchiseId ?? b?.id ?? "").trim();
          const franchiseName = pickString(b?.franchiseName, b?.name);
          const franchiseCode = pickString(b?.franchiseCode, b?.code);
          const isActive = resolveActiveFlag(b);
          const label =
            franchiseName && franchiseCode
              ? `[${franchiseCode}] ${franchiseName}`
              : franchiseName || (franchiseCode ? `[${franchiseCode}]` : "Branch");

          return {
            value,
            label,
            franchiseName,
            franchiseCode,
            isActive,
          };
        });

        const cleanBranches = mappedBranches.filter(
          (item) => item.value.length > 0
        );
        setBranches(cleanBranches);

        const matchedManagerFranchise = managerFranchiseId
          ? cleanBranches.find((item) => item.value === managerFranchiseId)
          : undefined;
        const resolvedManagerFranchise =
          matchedManagerFranchise || cleanBranches[0];

        if (resolvedManagerFranchise?.value) {
          setManagerFranchiseId(resolvedManagerFranchise.value);
        }
        if (resolvedManagerFranchise?.franchiseCode) {
          setManagerFranchiseCode(resolvedManagerFranchise.franchiseCode);
        }
        if (resolvedManagerFranchise?.label) {
          setFranchiseDisplayName(resolvedManagerFranchise.label);
        }
        if (resolvedManagerFranchise) {
          setIsFranchiseActive(resolvedManagerFranchise.isActive);
        }

        setForm((prev) => {
          const preferredBranchId = pickString(prev.branchId, resolvedManagerFranchise?.value);
          if (!preferredBranchId || prev.branchId === preferredBranchId) {
            return prev;
          }
          return { ...prev, branchId: preferredBranchId };
        });

        if (cleanBranches.length === 0 && !managerFranchiseId) {
          toast.error("No branches available. Please contact administrator.");
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load branches:", err);
        toast.error("Failed to load branches");
      } finally {
        if (mounted) setLoadingBranches(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [managerFranchiseId]);

  useEffect(() => {
    let mounted = true;
    const effectiveFranchiseId = form.branchId || managerFranchiseId;

    if (!effectiveFranchiseId) {
      setFranchiseDisplayName("");
      setIsFranchiseActive(true);
      return;
    }

    const matchedBranch = branches.find(
      (item) => item.value === effectiveFranchiseId
    );
    if (matchedBranch?.label) {
      setFranchiseDisplayName(matchedBranch.label);
    }
    if (matchedBranch?.franchiseCode) {
      setManagerFranchiseCode(matchedBranch.franchiseCode);
    }
    if (matchedBranch) {
      setIsFranchiseActive(matchedBranch.isActive);
    }

    (async () => {
      try {
        setLoadingFranchiseInfo(true);
        const response = await apiUtils.get(
          `/api/franchise-service/franchises/${encodeURIComponent(
            effectiveFranchiseId
          )}`
        );
        const payload = parseFranchiseDetail(response);
        const franchiseName = pickString(payload?.franchiseName, payload?.name);
        const franchiseCode = pickString(
          payload?.franchiseCode,
          payload?.code
        );
        const isActive = resolveActiveFlag(payload);
        if (franchiseCode) {
          setManagerFranchiseCode(franchiseCode);
        }
        const display =
          franchiseCode && franchiseName
            ? `[${franchiseCode}] ${franchiseName}`
            : franchiseName ||
              (franchiseCode ? `[${franchiseCode}]` : "") ||
              matchedBranch?.label ||
              (managerFranchiseCode ? `[${managerFranchiseCode}]` : "Not mapped");

        if (mounted) {
          setFranchiseDisplayName(display);
          setIsFranchiseActive(isActive);
        }
      } catch {
        if (!mounted) return;
        setFranchiseDisplayName(
          matchedBranch?.label ||
            (managerFranchiseCode ? `[${managerFranchiseCode}]` : "Not mapped")
        );
        setIsFranchiseActive(matchedBranch?.isActive ?? true);
      } finally {
        if (mounted) setLoadingFranchiseInfo(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [managerFranchiseId, managerFranchiseCode, form.branchId, branches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.dateOfBirth) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!form.branchId) {
      toast.error("Please select a branch");
      return;
    }

    const effectiveManagerUserId =
      managerUserId || resolveManagerContext(user).managerUserId;
    const effectiveFranchiseId =
      form.branchId.trim() || managerFranchiseId;

    if (!effectiveManagerUserId) {
      toast.error("Unable to determine manager user id. Please login again.");
      return;
    }

    if (!effectiveFranchiseId) {
      toast.error("Unable to map franchise id from manager account.");
      return;
    }

    if (!isFranchiseActive) {
      toast.error("The selected franchise is not active, so staff cannot be created.");
      return;
    }

    setLoading(true);
    setFieldErrors({});
    setError(null);

    let accountCreated = false;
    let staffCreated = false;

    try {
      const accountPayload = {
        email: form.email.trim(),
        name: form.name.trim(),
        address: franchiseDisplayName || "N/A",
        phone: form.phone.trim(),
        franchiseId: effectiveFranchiseId,
        roleName: "STAFF",
      };

      const accountResponse = await createAccountForStaff(accountPayload);
      const accountUserId = extractCreatedAccountUserId(accountResponse);
      const isAccountCreated =
        accountResponse?.success === true ||
        accountResponse?.statusCode === 0 ||
        accountUserId.length > 0;

      if (!isAccountCreated || !accountUserId) {
        throw new Error(
          accountResponse?.message ||
            "Account created response missing user id."
        );
      }
      accountCreated = true;

      const staffPayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender.toUpperCase(),
        dateOfBirth: form.dateOfBirth,
        managerUserId: effectiveManagerUserId,
        branchId: form.branchId.trim(),
        userId: accountUserId,
      };

      await createStaffAPI(staffPayload);
      staffCreated = true;

      toast.success("Account and staff created successfully!");
      setTimeout(() => {
        navigate("/manager/staff");
      }, 500);
    } catch (err: unknown) {
      const payload = extractBackendErrorPayload(err);
      const resultErrors = parseFieldErrors(payload.result);
      const responseFieldErrors = parseFieldErrors(payload.fieldErrors);
      const extractedFieldErrors =
        Object.keys(responseFieldErrors).length > 0
          ? responseFieldErrors
          : resultErrors;

      // Check for duplicate field errors
      const duplicateField = extractDuplicateFieldError(err);
      let message: string;

      if (duplicateField) {
        const finalFieldErrors = { ...extractedFieldErrors };
        if (duplicateField === "phone") {
          finalFieldErrors.phone = "Phone number is already in use";
          message = "Phone number is already in use";
        } else if (duplicateField === "email") {
          finalFieldErrors.email = "Email is already in use";
          message = "Email is already in use";
        } else {
          message = "Field information is duplicated";
        }
        setFieldErrors(finalFieldErrors);
      } else {
        const firstFieldError = Object.values(extractedFieldErrors)[0];
        message = pickString(
          payload.message,
          payload.error,
          typeof firstFieldError === "string" ? firstFieldError : "",
          err instanceof Error ? err.message : "",
          "Failed to create staff/account. Please try again."
        );

        if (Object.keys(extractedFieldErrors).length > 0) {
          setFieldErrors(extractedFieldErrors);
        }
      }

      if (!accountCreated && (duplicateField || Object.keys(extractedFieldErrors).length > 0)) {
        setError(message);
        toast.error(message);
        return;
      }

      if (accountCreated && !staffCreated) {
        const failureMessage = `Account created but staff creation failed: ${message}`;
        setError(failureMessage);
        toast.error(failureMessage);
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-400 transition-all text-sm";
  const labelCls = "block text-sm font-medium text-gray-700 mb-2";
  const hasSelectedBranchOption = branches.some((b) => b.value === form.branchId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Staff</h1>
          <p className="text-sm text-gray-500">
            Create staff and linked account in one flow.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Franchise Mapping
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {loadingFranchiseInfo
                ? "Loading franchise..."
                : franchiseDisplayName || managerFranchiseCode || "Not mapped"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Franchise Code: {managerFranchiseCode || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {!loadingBranches && form.branchId && !isFranchiseActive && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          The selected franchise is not active, so new staff cannot be created.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6"
      >
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-2.5 text-gray-400" size={17} />
              <input
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className={inputCls}
                placeholder="Nguyen Van A"
              />
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 text-gray-400" size={17} />
              <select
                name="gender"
                required
                value={form.gender}
                onChange={handleChange}
                className={`${inputCls} bg-white appearance-none`}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={17} />
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className={inputCls}
                placeholder="abc@gmail.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 text-gray-400" size={17} />
              <input
                name="phone"
                required
                value={form.phone}
                onChange={handleChange}
                className={inputCls}
                placeholder="09xxxxxxxx"
                maxLength={10}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/\D/g, "");
                  setForm((prev) => ({ ...prev, phone: target.value }));
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Format: 03/05/07/08/09xxxxxxxx
            </p>
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={17} />
              <input
                name="dateOfBirth"
                type="date"
                required
                value={form.dateOfBirth}
                onChange={handleChange}
                max={maxDob()}
                className={inputCls}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Must be 18 years old or older
            </p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className={labelCls}>
              Branch <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-gray-400" size={17} />
              {loadingBranches ? (
                <select
                  disabled
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none bg-gray-100 text-gray-500 cursor-not-allowed font-medium text-sm"
                >
                  <option>Loading branches...</option>
                </select>
              ) : (
                <select
                  name="branchId"
                  value={form.branchId}
                  onChange={handleChange}
                  required
                  disabled={lockedByManager}
                  className={`${inputCls} bg-white appearance-none ${
                    lockedByManager ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""
                  }`}
                >
                  {!lockedByManager && <option value="">Select a branch</option>}
                  {lockedByManager && form.branchId && !hasSelectedBranchOption && (
                    <option value={form.branchId}>
                      {franchiseDisplayName || managerFranchiseCode || "Mapped branch"}
                    </option>
                  )}
                  {branches.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {lockedByManager ? (
              <p className="text-xs text-gray-400 mt-1">
                Branch is mapped from manager account.
              </p>
            ) : (
              !form.branchId && (
                <p className="text-xs text-red-500 font-medium mt-1">
                  Branch is required
                </p>
              )
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || loadingBranches || !form.branchId || !isFranchiseActive}
            className="px-5 py-2.5 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Create Staff"}
          </button>
        </div>
      </form>
    </div>
  );
}
