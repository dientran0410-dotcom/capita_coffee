import { getManagerFranchises } from "./franchiseService";
import { http } from "../utils/axiosClient";
import { resolveManagerSelectableFranchise } from "../utils/managerFranchiseSelection";

type AnyRecord = Record<string, unknown>;

export type ManagerBranchContext = {
  branchId: string;
  displayName: string;
  isActive: boolean;
};

export type ManagerBranchDisplayMap = Record<string, string>;

const SHORT_ID_LENGTH = 8;

const toRecord = (value: unknown): AnyRecord =>
  value && typeof value === "object" ? (value as AnyRecord) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const shortenId = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.length > SHORT_ID_LENGTH
    ? `${normalized.substring(0, SHORT_ID_LENGTH)}...`
    : normalized;
};

const getBranchIdFromFranchise = (value: unknown): string => {
  const obj = toRecord(value);
  const nestedFranchise = toRecord(obj.franchise);
  const nestedData = toRecord(obj.data);

  return pickString(
    obj.franchiseId,
    obj.id,
    obj.branchId,
    obj.franchise_id,
    obj.branch_id,
    nestedFranchise.franchiseId,
    nestedFranchise.id,
    nestedData.franchiseId,
    nestedData.id
  );
};

const buildBranchDisplay = (value: unknown, fallbackId = ""): string => {
  const obj = toRecord(value);
  const code = pickString(obj.code, obj.franchiseCode);
  const name = pickString(obj.name, obj.franchiseName);

  if (code && name) return `[${code}] ${name}`;
  if (code) return `[${code}]`;
  if (name) return name;
  if (fallbackId) return shortenId(fallbackId);
  return "";
};

const extractManagerFranchiseList = (payload: unknown): AnyRecord[] => {
  if (Array.isArray(payload)) return payload.map(toRecord);

  const root = toRecord(payload);
  if (Array.isArray(root.content)) return root.content.map(toRecord);
  if (Array.isArray(root.result)) return root.result.map(toRecord);
  if (Array.isArray(root.data)) return root.data.map(toRecord);

  const resultObj = toRecord(root.result);
  if (Array.isArray(resultObj.content)) return resultObj.content.map(toRecord);

  const dataObj = toRecord(root.data);
  if (Array.isArray(dataObj.content)) return dataObj.content.map(toRecord);

  return [];
};

const extractFranchiseDetail = (payload: unknown): AnyRecord => {
  const root = toRecord(payload);
  const result = toRecord(root.result);
  if (Object.keys(result).length > 0) return result;
  const data = toRecord(root.data);
  if (Object.keys(data).length > 0) return data;
  return root;
};

const extractManagedStaffList = (payload: unknown): AnyRecord[] => {
  if (Array.isArray(payload)) return payload.map(toRecord);

  const root = toRecord(payload);
  if (Array.isArray(root.content)) return root.content.map(toRecord);
  if (Array.isArray(root.result)) return root.result.map(toRecord);
  if (Array.isArray(root.data)) return root.data.map(toRecord);

  const resultObj = toRecord(root.result);
  if (Array.isArray(resultObj.content)) return resultObj.content.map(toRecord);

  const dataObj = toRecord(root.data);
  if (Array.isArray(dataObj.content)) return dataObj.content.map(toRecord);

  return [];
};

const resolveActiveFlag = (value: unknown): boolean =>
  resolveManagerSelectableFranchise(value);

const getBranchIdFromStaff = (value: unknown): string => {
  const obj = toRecord(value);
  const nestedData = toRecord(obj.data);
  const nestedResult = toRecord(obj.result);

  return pickString(
    obj.branchId,
    obj.franchiseId,
    nestedData.branchId,
    nestedData.franchiseId,
    nestedResult.branchId,
    nestedResult.franchiseId
  );
};

const isLikelyIdentifier = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) return false;

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalized
    )
  ) {
    return true;
  }

  return normalized.length > 24 && !normalized.includes(" ");
};

const normalizeDisplayCandidate = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) return "";
  if (isLikelyIdentifier(normalized)) return shortenId(normalized);
  return normalized;
};

const buildDisplayMapFromFranchises = (
  franchises: AnyRecord[]
): ManagerBranchDisplayMap => {
  const displayMap: ManagerBranchDisplayMap = {};
  franchises.forEach((item) => {
    const id = getBranchIdFromFranchise(item);
    if (!id) return;
    displayMap[id] = buildBranchDisplay(item, id) || shortenId(id);
  });
  return displayMap;
};

const normalizeBranchOptions = (
  franchises: AnyRecord[],
  preferredBranchId = ""
): ManagerBranchContext[] => {
  const seen = new Set<string>();

  const options = franchises
    .map((item) => {
      const branchId = getBranchIdFromFranchise(item);
      if (!branchId || seen.has(branchId)) return null;
      seen.add(branchId);

      return {
        branchId,
        displayName: buildBranchDisplay(item, branchId) || shortenId(branchId),
        isActive: resolveActiveFlag(item),
      };
    })
    .filter((item): item is ManagerBranchContext => Boolean(item));

  const selectableOptions = options.filter((item) => item.isActive);

  if (!preferredBranchId) return selectableOptions;

  return [
    ...selectableOptions.filter((item) => item.branchId === preferredBranchId),
    ...selectableOptions.filter((item) => item.branchId !== preferredBranchId),
  ];
};

const resolveBranchIdFromManagedStaff = async (): Promise<string> => {
  try {
    const staffResponse = await http("/api/shift-service/staffs?page=0&size=20");
    const staffs = extractManagedStaffList(staffResponse);

    return staffs.map(getBranchIdFromStaff).find((id) => id.length > 0) || "";
  } catch {
    return "";
  }
};

const hydrateBranchContext = async (
  branchId: string,
  fallbackActive: boolean
): Promise<ManagerBranchContext> => {
  try {
    const detailResponse = await http(`/api/franchise-service/franchises/${branchId}`);
    const detail = extractFranchiseDetail(detailResponse);
    const resolvedBranchId = getBranchIdFromFranchise(detail) || branchId;

    return {
      branchId: resolvedBranchId,
      displayName:
        buildBranchDisplay(detail, resolvedBranchId) || shortenId(resolvedBranchId),
      isActive: resolveActiveFlag(detail),
    };
  } catch {
    return {
      branchId,
      displayName: shortenId(branchId),
      isActive: fallbackActive,
    };
  }
};

export function formatManagerBranchDisplay(
  branchId: unknown,
  displayMap: ManagerBranchDisplayMap = {},
  fallbackValue?: unknown
): string {
  const id = pickString(branchId);
  if (id && displayMap[id]) return displayMap[id];

  const fallback = pickString(fallbackValue);
  if (fallback && fallback !== id) return normalizeDisplayCandidate(fallback);

  if (id) return normalizeDisplayCandidate(id);
  if (fallback) return normalizeDisplayCandidate(fallback);

  return "N/A";
}

export async function resolveManagerBranchOptions(
  authFranchiseId?: string
): Promise<ManagerBranchContext[]> {
  const fallbackId = pickString(authFranchiseId);

  try {
    const response = await getManagerFranchises();
    const franchises = extractManagerFranchiseList(response).map(toRecord);
    return normalizeBranchOptions(franchises, fallbackId);
  } catch {
    // Fall back to the single-branch resolver below.
  }

  const fallbackContext = await resolveManagerBranchContext(fallbackId);
  return fallbackContext?.isActive ? [fallbackContext] : [];
}

export async function resolveManagerBranchDisplayMap(
  authFranchiseId?: string
): Promise<ManagerBranchDisplayMap> {
  const fallbackId = pickString(authFranchiseId);
  let displayMap: ManagerBranchDisplayMap = {};

  try {
    const managerResponse = await http("/api/franchise-service/franchises/manager");
    const franchises = extractManagerFranchiseList(managerResponse);
    displayMap = buildDisplayMapFromFranchises(franchises);
  } catch {
    // Ignore and continue with fallback detail API.
  }

  if (Object.keys(displayMap).length > 0) {
    return displayMap;
  }

  const staffBranchId = await resolveBranchIdFromManagedStaff();
  if (staffBranchId) {
    const context = await hydrateBranchContext(staffBranchId, true);
    if (context.branchId) {
      const label = context.displayName || shortenId(context.branchId);
      displayMap[context.branchId] = label;
      displayMap[staffBranchId] = label;
      return displayMap;
    }
  }

  if (fallbackId) {
    try {
      const detailResponse = await http(`/api/franchise-service/franchises/${fallbackId}`);
      const detail = extractFranchiseDetail(detailResponse);
      const detailId = getBranchIdFromFranchise(detail) || fallbackId;
      displayMap[detailId] = buildBranchDisplay(detail, detailId) || shortenId(detailId);
    } catch {
      displayMap[fallbackId] = shortenId(fallbackId);
    }
  }

  return displayMap;
}

export async function resolveManagerBranchContext(
  authFranchiseId?: string
): Promise<ManagerBranchContext | null> {
  const fallbackId = pickString(authFranchiseId);

  try {
    const managerResponse = await http("/api/franchise-service/franchises/manager");
    const franchises = extractManagerFranchiseList(managerResponse);

    const selectedByAuth = fallbackId
      ? franchises.find((item) => getBranchIdFromFranchise(item) === fallbackId)
      : null;

    const selectedActive = franchises.find((item) => resolveActiveFlag(item));
    const preferredByAuth =
      selectedByAuth && resolveActiveFlag(selectedByAuth) ? selectedByAuth : null;

    const selected = preferredByAuth || selectedActive || selectedByAuth || franchises[0];

    if (selected) {
      const branchId = getBranchIdFromFranchise(selected);
      if (branchId) {
        return {
          branchId,
          displayName: buildBranchDisplay(selected, branchId) || shortenId(branchId),
          isActive: resolveActiveFlag(selected),
        };
      }
    }
  } catch {
    // Fallback to auth franchise id below.
  }

  const staffBranchId = await resolveBranchIdFromManagedStaff();
  if (staffBranchId) {
    const context = await hydrateBranchContext(staffBranchId, true);
    return context.isActive ? context : null;
  }

  if (!fallbackId) return null;

  const fallbackContext = await hydrateBranchContext(fallbackId, false);
  return fallbackContext.isActive ? fallbackContext : null;
}
