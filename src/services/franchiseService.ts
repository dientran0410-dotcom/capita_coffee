import { http } from '../utils/axiosClient';
import { API_GATE_WAY } from '../constants/api';

export { API_GATE_WAY } from '../constants/api';

type AnyRecord = Record<string, unknown>;
type FranchiseHintSet = {
  ids: string[];
  codes: string[];
};

const AUTH_STORAGE_KEYS = ['user', 'auth_user'] as const;

const toRecord = (value: unknown): AnyRecord =>
  value && typeof value === 'object' ? (value as AnyRecord) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const parseJsonSafely = (raw: string | null): AnyRecord | null => {
  if (!raw) return null;

  try {
    return toRecord(JSON.parse(raw));
  } catch {
    return null;
  }
};

const pickArrayRecords = (...values: unknown[]): AnyRecord[] => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is AnyRecord => Boolean(item) && typeof item === 'object',
      );
    }
  }

  return [];
};

const uniqueStrings = (values: string[]): string[] =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const normalizeMatchKey = (value: unknown): string =>
  pickString(value).trim().toLowerCase();

function getStoredToken(): string | null {
  const directToken =
    globalThis.localStorage?.getItem('accessToken') ??
    globalThis.localStorage?.getItem('token') ??
    globalThis.localStorage?.getItem('auth_token') ??
    globalThis.sessionStorage?.getItem('accessToken') ??
    globalThis.sessionStorage?.getItem('token') ??
    globalThis.sessionStorage?.getItem('auth_token');

  if (directToken) return directToken;

  for (const key of AUTH_STORAGE_KEYS) {
    const localRecord = parseJsonSafely(globalThis.localStorage?.getItem(key) ?? null);
    const sessionRecord = parseJsonSafely(
      globalThis.sessionStorage?.getItem(key) ?? null,
    );

    for (const record of [localRecord, sessionRecord]) {
      if (!record) continue;

      const raw = toRecord(record.raw);
      const token = pickString(
        record.accessToken,
        record.token,
        raw.accessToken,
        raw.token,
      );

      if (token) return token;
    }
  }

  return null;
}

function decodeJwtPayload(token?: string | null): AnyRecord | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );

    const json =
      typeof globalThis?.atob === 'function' ? globalThis.atob(padded) : atob(padded);

    return json ? toRecord(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

function getCandidateNodes(value: unknown): AnyRecord[] {
  const root = toRecord(value);
  const raw = toRecord(root.raw);
  const user = toRecord(root.user);
  const data = toRecord(root.data);
  const result = toRecord(root.result);
  const franchise = toRecord(root.franchise);
  const rawUser = toRecord(raw.user);
  const rawData = toRecord(raw.data);
  const rawResult = toRecord(raw.result);
  const dataUser = toRecord(data.user);
  const dataData = toRecord(data.data);
  const dataResult = toRecord(data.result);
  const resultUser = toRecord(result.user);
  const resultData = toRecord(result.data);
  const resultResult = toRecord(result.result);

  return [
    root,
    raw,
    user,
    data,
    result,
    franchise,
    rawUser,
    rawData,
    rawResult,
    dataUser,
    dataData,
    dataResult,
    resultUser,
    resultData,
    resultResult,
  ].filter((item, index, list) => {
    if (!Object.keys(item).length) return false;
    return list.indexOf(item) === index;
  });
}

function collectFranchiseHintsFromSource(value: unknown): FranchiseHintSet {
  const ids: string[] = [];
  const codes: string[] = [];

  getCandidateNodes(value).forEach((node) => {
    const nestedFranchise = toRecord(node.franchise);
    const nestedData = toRecord(node.data);
    const nestedResult = toRecord(node.result);

    ids.push(
      pickString(
        node.franchiseId,
        node.franchiesId,
        node.branchId,
        node.franchise_id,
        node.branch_id,
      ),
      pickString(
        nestedFranchise.franchiseId,
        nestedFranchise.id,
        nestedFranchise.branchId,
      ),
      pickString(nestedData.franchiseId, nestedData.id, nestedData.branchId),
      pickString(nestedResult.franchiseId, nestedResult.id, nestedResult.branchId),
    );

    codes.push(
      pickString(
        node.franchiseCode,
        node.branchCode,
        node.franchise_code,
        node.branch_code,
      ),
      pickString(
        nestedFranchise.franchiseCode,
        nestedFranchise.code,
        nestedFranchise.branchCode,
      ),
      pickString(nestedData.franchiseCode, nestedData.code, nestedData.branchCode),
      pickString(
        nestedResult.franchiseCode,
        nestedResult.code,
        nestedResult.branchCode,
      ),
    );
  });

  return {
    ids: uniqueStrings(ids),
    codes: uniqueStrings(codes),
  };
}

function collectManagerFranchiseHints(): FranchiseHintSet {
  const ids: string[] = [];
  const codes: string[] = [];

  for (const key of AUTH_STORAGE_KEYS) {
    const localRecord = parseJsonSafely(globalThis.localStorage?.getItem(key) ?? null);
    const sessionRecord = parseJsonSafely(
      globalThis.sessionStorage?.getItem(key) ?? null,
    );

    for (const record of [localRecord, sessionRecord]) {
      if (!record) continue;

      const hints = collectFranchiseHintsFromSource(record);
      ids.push(...hints.ids);
      codes.push(...hints.codes);
    }
  }

  const tokenPayload = decodeJwtPayload(getStoredToken());
  if (tokenPayload) {
    const tokenHints = collectFranchiseHintsFromSource(tokenPayload);
    ids.push(...tokenHints.ids);
    codes.push(...tokenHints.codes);
  }

  return {
    ids: uniqueStrings(ids),
    codes: uniqueStrings(codes),
  };
}

export function extractFranchiseList(payload: unknown): AnyRecord[] {
  const level0 = toRecord(payload);
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
    payload,
  );
}

export function extractFranchiseDetail(payload: unknown): AnyRecord {
  const level0 = toRecord(payload);
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

  return (
    candidates.find((candidate) =>
      Boolean(
        pickString(
          candidate.franchiseId,
          candidate.id,
          candidate.branchId,
          candidate.franchiseCode,
          candidate.code,
          candidate.franchiseName,
          candidate.name,
        ),
      ),
    ) ?? level0
  );
}

function normalizeFranchiseRecord(
  value: unknown,
  fallback: Partial<{
    franchiseId: string;
    franchiseCode: string;
    franchiseName: string;
  }> = {},
): AnyRecord {
  const source = toRecord(value);
  const nestedFranchise = toRecord(source.franchise);
  const nestedData = toRecord(source.data);
  const nestedResult = toRecord(source.result);

  const franchiseId = pickString(
    source.franchiseId,
    source.id,
    source.branchId,
    source.franchise_id,
    source.branch_id,
    nestedFranchise.franchiseId,
    nestedFranchise.id,
    nestedFranchise.branchId,
    nestedData.franchiseId,
    nestedData.id,
    nestedData.branchId,
    nestedResult.franchiseId,
    nestedResult.id,
    nestedResult.branchId,
    fallback.franchiseId,
  );

  const franchiseCode = pickString(
    source.franchiseCode,
    source.branchCode,
    source.code,
    nestedFranchise.franchiseCode,
    nestedFranchise.branchCode,
    nestedFranchise.code,
    nestedData.franchiseCode,
    nestedData.branchCode,
    nestedData.code,
    nestedResult.franchiseCode,
    nestedResult.branchCode,
    nestedResult.code,
    fallback.franchiseCode,
  );

  const franchiseName = pickString(
    source.franchiseName,
    source.branchName,
    source.name,
    nestedFranchise.franchiseName,
    nestedFranchise.branchName,
    nestedFranchise.name,
    nestedData.franchiseName,
    nestedData.branchName,
    nestedData.name,
    nestedResult.franchiseName,
    nestedResult.branchName,
    nestedResult.name,
    fallback.franchiseName,
  );

  return {
    ...source,
    franchiseId,
    franchiseCode,
    franchiseName,
    region: pickString(
      source.region,
      nestedFranchise.region,
      nestedData.region,
      nestedResult.region,
    ),
    address: pickString(
      source.address,
      source.fullAddress,
      nestedFranchise.address,
      nestedData.address,
      nestedResult.address,
    ),
    timezone: pickString(
      source.timezone,
      nestedFranchise.timezone,
      nestedData.timezone,
      nestedResult.timezone,
    ),
    status: pickString(
      source.status,
      source.franchiseStatus,
      nestedFranchise.status,
      nestedData.status,
      nestedResult.status,
    ),
    onboardingStatus: pickString(
      source.onboardingStatus,
      nestedFranchise.onboardingStatus,
      nestedData.onboardingStatus,
      nestedResult.onboardingStatus,
    ),
    createdAt: pickString(
      source.createdAt,
      nestedFranchise.createdAt,
      nestedData.createdAt,
      nestedResult.createdAt,
    ),
    updatedAt: pickString(
      source.updatedAt,
      source.lastUpdatedAt,
      nestedFranchise.updatedAt,
      nestedData.updatedAt,
      nestedResult.updatedAt,
    ),
  };
}

function dedupeFranchises(items: AnyRecord[]): AnyRecord[] {
  const seen = new Set<string>();

  return items
    .map((item) => normalizeFranchiseRecord(item))
    .filter((item) => {
      const identity =
        pickString(item.franchiseId) || `code:${pickString(item.franchiseCode)}`;

      if (!identity || seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
}

function filterFranchiseListByHints(
  payload: unknown,
  hints: FranchiseHintSet,
): AnyRecord[] {
  const idSet = new Set(hints.ids.map(normalizeMatchKey).filter(Boolean));
  const codeSet = new Set(hints.codes.map(normalizeMatchKey).filter(Boolean));

  if (!idSet.size && !codeSet.size) return [];

  return dedupeFranchises(
    extractFranchiseList(payload)
      .map((item) => normalizeFranchiseRecord(item))
      .filter((item) => {
        const franchiseId = normalizeMatchKey(item.franchiseId);
        const franchiseCode = normalizeMatchKey(item.franchiseCode);

        return (
          (franchiseId && idSet.has(franchiseId)) ||
          (franchiseCode && codeSet.has(franchiseCode))
        );
      }),
  );
}

async function loadFallbackFranchiseDetails(ids: string[]): Promise<AnyRecord[]> {
  if (!ids.length) return [];

  const items = await Promise.all(
    ids.map(async (id) => {
      try {
        const response = await http(FRANCHISE_DETAIL_URL(id));
        const detail = normalizeFranchiseRecord(extractFranchiseDetail(response), {
          franchiseId: id,
        });

        return detail.franchiseId || detail.franchiseCode ? detail : null;
      } catch {
        return null;
      }
    }),
  );

  return dedupeFranchises(items.filter(Boolean) as AnyRecord[]);
}

async function loadFallbackFranchisesFromLists(
  hints: FranchiseHintSet,
): Promise<AnyRecord[]> {
  const loaders = [
    () => http(ADMIN_FRANCHISE_URL),
    () => http(PUBLIC_FRANCHISE_URL, { skipAuth: true }),
  ];

  for (const load of loaders) {
    try {
      const response = await load();
      const matches = filterFranchiseListByHints(response, hints);

      if (matches.length > 0) {
        return matches;
      }
    } catch {
      // Try the next list source.
    }
  }

  return [];
}

// Use relative paths so `http()` can route via `/api` proxy in dev and gateway env in production.
export const MANAGER_FRANCHISE_URL = '/franchise-service/franchises/manager';
export const ADMIN_FRANCHISE_URL = '/franchise-service/franchises';
export const PUBLIC_FRANCHISE_URL = '/franchise-service/franchises/public';
export function FRANCHISE_DETAIL_URL(id) {
  return `/franchise-service/franchises/${id}`;
}

// Activate / Deactivate helpers
export function FRANCHISE_ACTIVATE_URL(id) {
  return `/franchise-service/franchises/${id}/activate`;
}

export function FRANCHISE_DEACTIVATE_URL(id) {
  return `/franchise-service/franchises/${id}/deactivate`;
}

export function FRANCHISE_SUSPEND_URL(id) {
  return `/franchise-service/franchises/${id}/suspend`;
}

export function FRANCHISE_OWNER_URL(id) {
  return `/franchise-service/franchises/${id}/owner`;
}

export function FRANCHISE_CHANGE_OWNER_URL(id) {
  return `/franchise-service/franchises/${id}/change-owner`;
}

export function FRANCHISE_OWNER_PROFILE_URL(ownerId) {
  return `/franchise-service/franchises/owners/${ownerId}/profile`;
}

export function FRANCHISE_MENU_PROFILE_URL(id) {
  return `/franchise-service/franchises/${id}/menu-profile`;
}

export function FRANCHISE_APPROVE_SUPPLIERS_URL(id) {
  return `/franchise-service/franchises/${id}/suppliers/approve`;
}

export function OPENING_HOURS_URL(id) {
  return `/franchise-service/opening-hour/${id}/opening-hours`;
}

export async function getAdminFranchises() {
  return http(ADMIN_FRANCHISE_URL);
}

export async function getPublicFranchises() {
  return http(PUBLIC_FRANCHISE_URL, { skipAuth: true });
}

export async function createFranchise(payload) {
  return http(ADMIN_FRANCHISE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getManagerFranchises() {
  let lastError: unknown = null;

  try {
    const response = await http(MANAGER_FRANCHISE_URL);
    const directItems = dedupeFranchises(extractFranchiseList(response));

    if (directItems.length > 0) {
      return directItems;
    }
  } catch (error) {
    lastError = error;
  }

  const hints = collectManagerFranchiseHints();
  const detailMatches = await loadFallbackFranchiseDetails(hints.ids);

  if (detailMatches.length > 0) {
    return detailMatches;
  }

  const listMatches = await loadFallbackFranchisesFromLists(hints);

  if (listMatches.length > 0) {
    return listMatches;
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

export async function getFranchiseDetail(franchiseId) {
  return http(FRANCHISE_DETAIL_URL(franchiseId));
}

export async function suspendFranchise(franchiseId) {
  return http(FRANCHISE_SUSPEND_URL(franchiseId), {
    method: 'PUT',
  });
}

export async function activateFranchise(franchiseId) {
  return http(FRANCHISE_ACTIVATE_URL(franchiseId), {
    method: 'PUT',
  });
}

export async function deactivateFranchise(franchiseId) {
  return http(FRANCHISE_DEACTIVATE_URL(franchiseId), {
    method: 'PUT',
  });
}

function buildActionUserHeaders(actionUser) {
  if (!actionUser) return undefined;

  return {
    'X-User': actionUser,
  };
}

export async function attachOwner(franchiseId, payload, actionUser) {
  return http(FRANCHISE_OWNER_URL(franchiseId), {
    method: 'POST',
    headers: buildActionUserHeaders(actionUser),
    body: JSON.stringify(payload),
  });
}

export async function changeOwner(franchiseId, payload, actionUser) {
  return http(FRANCHISE_CHANGE_OWNER_URL(franchiseId), {
    method: 'PUT',
    headers: buildActionUserHeaders(actionUser),
    body: JSON.stringify(payload),
  });
}

export async function getFranchiseOwnerProfile(ownerId) {
  const response = await http(FRANCHISE_OWNER_PROFILE_URL(ownerId));
  return response?.data ?? response;
}

export async function assignMenuProfile(franchiseId, menuProfileId) {
  return http(FRANCHISE_MENU_PROFILE_URL(franchiseId), {
    method: 'POST',
    body: JSON.stringify({ menuProfileId }),
  });
}

export async function approveSuppliers(franchiseId, supplierIds) {
  return http(FRANCHISE_APPROVE_SUPPLIERS_URL(franchiseId), {
    method: 'PUT',
    body: JSON.stringify({ franchiseId, supplierIds }),
  });
}

export async function getMenuProfiles() {
  return http('/menu-profiles');
}

export async function getSuppliers(page = 0, size = 200) {
  return http(`/suppliers?page=${page}&size=${size}`);
}

export async function getOpeningHours(franchiseId) {
  return http(OPENING_HOURS_URL(franchiseId));
}

export async function updateOpeningHours(franchiseId, openingHours) {
  return http(OPENING_HOURS_URL(franchiseId), {
    method: 'PUT',
    body: JSON.stringify(openingHours),
  });
}

const franchiseService = {
  API_GATE_WAY,
  MANAGER_FRANCHISE_URL,
  ADMIN_FRANCHISE_URL,
  FRANCHISE_DETAIL_URL,
  FRANCHISE_ACTIVATE_URL,
  FRANCHISE_DEACTIVATE_URL,
  FRANCHISE_SUSPEND_URL,
  FRANCHISE_OWNER_URL,
  FRANCHISE_CHANGE_OWNER_URL,
  FRANCHISE_OWNER_PROFILE_URL,
  FRANCHISE_MENU_PROFILE_URL,
  FRANCHISE_APPROVE_SUPPLIERS_URL,
  OPENING_HOURS_URL,

  // Backward-compatible aliases for existing pages
  getAll: () => getAdminFranchises(),
  create: (payload) => createFranchise(payload),
  getById: (franchiseId) => getFranchiseDetail(franchiseId),
  suspend: (franchiseId) => suspendFranchise(franchiseId),
  activate: (franchiseId) => activateFranchise(franchiseId),
  deactivate: (franchiseId) => deactivateFranchise(franchiseId),
  attachOwner: (franchiseId, payload, actionUser) =>
    attachOwner(franchiseId, payload, actionUser),
  changeOwner: (franchiseId, payload, actionUser) =>
    changeOwner(franchiseId, payload, actionUser),
  getOwnerProfile: (ownerId) => getFranchiseOwnerProfile(ownerId),
  assignMenuProfile: (franchiseId, menuProfileId) => assignMenuProfile(franchiseId, menuProfileId),
  approveSuppliers: (franchiseId, supplierIds) => approveSuppliers(franchiseId, supplierIds),
  getMenuProfiles: () => getMenuProfiles(),
  getSuppliers: (page = 0, size = 200) => getSuppliers(page, size),
  getOpeningHours: (franchiseId) => getOpeningHours(franchiseId),
  updateOpeningHours: (franchiseId, openingHours) => updateOpeningHours(franchiseId, openingHours),
  getManagerFranchises: () => getManagerFranchises(),
  getAdminFranchises: () => getAdminFranchises(),
  getPublicFranchises: () => getPublicFranchises(),
};

export default franchiseService;
