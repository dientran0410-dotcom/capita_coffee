import contractService, { type Contract } from './ContractService';
import franchiseService from './franchiseService';
import { resolveManagerSelectableFranchise } from '../utils/managerFranchiseSelection';

type AnyRecord = Record<string, unknown>;

export type ManagerOwnedFranchise = {
  franchiseId: string;
  franchiseName: string;
  franchiseCode: string;
  address?: string;
  region?: string;
  status?: string;
  onboardingStatus?: string;
};

export type ManagerContractScope = {
  franchises: ManagerOwnedFranchise[];
  franchiseIds: string[];
  contracts: Contract[];
};

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

const extractArrayCandidates = (payload: unknown): AnyRecord[] => {
  if (Array.isArray(payload)) {
    return payload.map(toRecord);
  }

  const root = toRecord(payload);
  const level1 = toRecord(root.data);
  const level2 = toRecord(level1.data);
  const result = toRecord(root.result);
  const resultData = toRecord(result.data);

  const candidates = [
    root.content,
    level1.content,
    level2.content,
    result.content,
    resultData.content,
    root.data,
    level1.data,
    result.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(toRecord);
    }
  }

  return [];
};

export function extractManagerOwnedFranchises(
  payload: unknown,
): ManagerOwnedFranchise[] {
  const seenIds = new Set<string>();

  return extractArrayCandidates(payload)
    .filter((item) => resolveManagerSelectableFranchise(item))
    .map((item) => {
      const franchiseId = pickString(
        item.franchiseId,
        item.id,
        item.franchise_id,
      );

      return {
        franchiseId,
        franchiseName:
          pickString(item.franchiseName, item.name) || 'Unnamed franchise',
        franchiseCode:
          pickString(item.franchiseCode, item.code) || franchiseId || 'N/A',
        address: pickString(item.address),
        region: pickString(item.region),
        status: pickString(item.status),
        onboardingStatus: pickString(item.onboardingStatus),
      };
    })
    .filter((item) => {
      if (!item.franchiseId || seenIds.has(item.franchiseId)) return false;
      seenIds.add(item.franchiseId);
      return true;
    });
}

export function resolveOwnedFranchise(
  franchises: ManagerOwnedFranchise[],
  franchiseId?: string | null,
): ManagerOwnedFranchise | null {
  const normalizedId = String(franchiseId ?? '').trim();
  if (!franchises.length) return null;

  if (normalizedId) {
    const matchedFranchise =
      franchises.find((item) => item.franchiseId === normalizedId) ?? null;
    if (matchedFranchise) return matchedFranchise;
  }

  return franchises[0] ?? null;
}

export function filterContractsByOwnedFranchises(
  contracts: Contract[],
  franchiseIds: string[],
): Contract[] {
  const ownedIds = new Set(franchiseIds.map((item) => item.trim()).filter(Boolean));
  if (!ownedIds.size) return [];

  return contracts.filter((contract) =>
    ownedIds.has(String(contract?.franchiseId ?? '').trim()),
  );
}

export async function getManagerContractScope(): Promise<ManagerContractScope> {
  const [franchiseResponse, allContracts] = await Promise.all([
    franchiseService.getManagerFranchises(),
    contractService.getAllContracts(),
  ]);

  const franchises = extractManagerOwnedFranchises(franchiseResponse);
  const franchiseIds = franchises.map((item) => item.franchiseId);

  return {
    franchises,
    franchiseIds,
    contracts: filterContractsByOwnedFranchises(allContracts, franchiseIds),
  };
}
