type AnyRecord = Record<string, unknown>;

const MANAGER_SELECTABLE_STATUSES = new Set([
  "LIVE",
  "ACTIVE",
  "OPEN",
  "ENABLED",
  "APPROVED",
]);

const MANAGER_HIDDEN_STATUSES = new Set([
  "PENDING",
  "PENDING_APPROVAL",
  "PENDING_ACTIVATION",
  "SUSPENDED",
  "SUSPENSED",
  "SUSPEND",
  "PAUSED",
  "ON_HOLD",
  "HOLD",
  "INACTIVE",
  "DEACTIVATED",
  "DISABLED",
  "CLOSED",
  "ARCHIVED",
  "TERMINATED",
  "EXPIRED",
]);

const toRecord = (value: unknown): AnyRecord =>
  value && typeof value === "object" ? (value as AnyRecord) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
};

const pickBoolean = (...values: unknown[]): boolean | null => {
  for (const value of values) {
    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }

  return null;
};

export const normalizeManagerFranchiseStatus = (value: unknown): string =>
  pickString(value).toUpperCase().replace(/[\s-]+/g, "_");

export const isManagerSelectableFranchiseStatus = (value: unknown): boolean =>
  MANAGER_SELECTABLE_STATUSES.has(normalizeManagerFranchiseStatus(value));

export function resolveManagerSelectableFranchise(value: unknown): boolean {
  const obj = toRecord(value);
  const directBoolean = pickBoolean(
    obj.isActive,
    obj.active,
    obj.isActivated,
    obj.activated
  );

  if (directBoolean === false) return false;

  const statusCandidates = [
    obj.status,
    obj.franchiseStatus,
    obj.branchStatus,
    obj.contractStatus,
    obj.lifecycleStatus,
    obj.accountStatus,
  ]
    .map(normalizeManagerFranchiseStatus)
    .filter(Boolean);

  if (statusCandidates.some((status) => MANAGER_SELECTABLE_STATUSES.has(status))) {
    return true;
  }

  if (statusCandidates.some((status) => MANAGER_HIDDEN_STATUSES.has(status))) {
    return false;
  }

  if (directBoolean !== null) return directBoolean;

  return true;
}
