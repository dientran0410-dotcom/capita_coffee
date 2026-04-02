import { extractUserIdFromToken } from "./authHelpers";

type AnyRecord = Record<string, unknown>;

const toRecord = (value: unknown): AnyRecord =>
  value && typeof value === "object" ? (value as AnyRecord) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const pushUnique = (target: string[], value: unknown) => {
  const normalized = pickString(value);
  if (!normalized) return;
  if (!target.includes(normalized)) target.push(normalized);
};

const getStoredToken = (): string => {
  return (
    globalThis.localStorage?.getItem("accessToken") ||
    globalThis.localStorage?.getItem("token") ||
    globalThis.localStorage?.getItem("auth_token") ||
    globalThis.sessionStorage?.getItem("accessToken") ||
    globalThis.sessionStorage?.getItem("token") ||
    globalThis.sessionStorage?.getItem("auth_token") ||
    ""
  );
};

const parseStoredUser = (key: string): AnyRecord => {
  try {
    const raw = globalThis.localStorage?.getItem(key) || globalThis.sessionStorage?.getItem(key);
    return raw ? toRecord(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
};

const appendCandidatesFromRecord = (target: string[], source: AnyRecord) => {
  const nestedRaw = toRecord(source.raw);
  const nestedUser = toRecord(source.user);
  const nestedRawUser = toRecord(nestedRaw.user);
  const nestedData = toRecord(source.data);
  const nestedDataUser = toRecord(nestedData.user);

  const ids = [
    source.staffId,
    source.id,
    source.userId,
    source.uid,
    source.accountId,
    nestedUser.staffId,
    nestedUser.id,
    nestedUser.userId,
    nestedRaw.staffId,
    nestedRaw.id,
    nestedRaw.userId,
    nestedRawUser.staffId,
    nestedRawUser.id,
    nestedRawUser.userId,
    nestedData.staffId,
    nestedData.id,
    nestedData.userId,
    nestedDataUser.staffId,
    nestedDataUser.id,
    nestedDataUser.userId,
  ];

  ids.forEach((id) => pushUnique(target, id));
};

export function resolveStaffIdCandidates(user: unknown): string[] {
  const candidates: string[] = [];

  const userRecord = toRecord(user);
  appendCandidatesFromRecord(candidates, userRecord);
  appendCandidatesFromRecord(candidates, parseStoredUser("user"));
  appendCandidatesFromRecord(candidates, parseStoredUser("auth_user"));

  const tokenUserId = extractUserIdFromToken(getStoredToken());
  pushUnique(candidates, tokenUserId);

  return candidates;
}

export function resolveStaffBranchId(user: unknown): string {
  const userRecord = toRecord(user);
  const raw = toRecord(userRecord.raw);
  const rawUser = toRecord(raw.user);
  const data = toRecord(raw.data);
  const dataUser = toRecord(data.user);

  return pickString(
    userRecord.branchId,
    userRecord.franchiseId,
    raw.branchId,
    raw.franchiseId,
    rawUser.branchId,
    rawUser.franchiseId,
    data.branchId,
    data.franchiseId,
    dataUser.branchId,
    dataUser.franchiseId
  );
}
