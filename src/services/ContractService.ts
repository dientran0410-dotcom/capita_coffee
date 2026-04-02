import api from '../api/axios';
import {
  CONTRACT_BASE_URL,
  CONTRACT_BY_ID_URL,
  CONTRACT_ACTIVATE_URL,
  CONTRACT_RENEW_URL,
  CONTRACT_TERMINATE_URL,
  CONTRACT_SEARCH_URL,
} from '../constants/apiEndPoints';
import type { ApiResponse } from '../types/ApiResponse';
import type { AxiosResponse } from 'axios';

export interface Contract {
  contractId: string;
  contractNumber: string;
  franchiseId: string;
  franchiseCode: string;
  franchiseName?: string;
  status: 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED' | 'PENDING_ACTIVATION';
  startDate: string;
  endDate: string;
  royaltyRate: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  events?: Array<{
    eventId: string;
    eventType: string;
    performedBy: string;
    timestamp: string;
    note?: string;
  }>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage?: number;
  pageSize?: number;
  page?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
}

export interface CreateContractRequest {
  contractNumber: string;
  franchiseId: string;
  startDate: string;
  endDate: string;
  royaltyRate: number;
}

export interface RenewContractRequest {
  newEndDate: string;
}

export interface TerminateContractRequest {
  terminationReason: string;
}

export interface SearchContractParams {
  franchiseId?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'EXPIRED' | 'PENDING_ACTIVATION';
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export function extractContractPageData(payload: unknown): PaginatedResponse<Contract> {
  const root = toRecord(payload);
  const level1 = toRecord(root.data);
  const level2 = toRecord(level1.data);

  const pageSource =
    [level2, level1, root].find(
      (candidate) => Array.isArray(candidate.content)
    ) ?? {};

  const content = Array.isArray(pageSource.content)
    ? (pageSource.content as Contract[])
    : [];

  return {
    content,
    totalElements: toFiniteNumber(pageSource.totalElements, content.length),
    totalPages: toFiniteNumber(pageSource.totalPages, content.length > 0 ? 1 : 0),
    currentPage: toFiniteNumber(
      pageSource.currentPage ?? pageSource.page ?? pageSource.number,
      0,
    ),
    pageSize: toFiniteNumber(pageSource.pageSize ?? pageSource.size, content.length),
    page: toFiniteNumber(pageSource.page ?? pageSource.currentPage ?? pageSource.number, 0),
    size: toFiniteNumber(pageSource.size ?? pageSource.pageSize, content.length),
    first: Boolean(pageSource.first),
    last: Boolean(pageSource.last),
  };
}

async function getAllContracts(
  size: number = 100,
  sort: string = 'createdAt,desc',
): Promise<Contract[]> {
  const allContracts: Contract[] = [];
  const seenContractIds = new Set<string>();

  let currentPage = 0;

  while (true) {
    const response = await contractService.getContractList(currentPage, size, sort);
    const pageData = extractContractPageData(response);

    pageData.content.forEach((contract) => {
      const contractId = String(contract?.contractId ?? '').trim();
      if (contractId && seenContractIds.has(contractId)) return;
      if (contractId) seenContractIds.add(contractId);
      allContracts.push(contract);
    });

    const effectivePage = toFiniteNumber(
      pageData.currentPage ?? pageData.page,
      currentPage,
    );
    const effectiveSize = toFiniteNumber(
      pageData.pageSize ?? pageData.size,
      size,
    );
    const totalPages = toFiniteNumber(pageData.totalPages, 0);
    const isLastPage =
      pageData.last === true ||
      (totalPages > 0
        ? effectivePage >= totalPages - 1
        : pageData.content.length < effectiveSize);

    if (isLastPage) break;

    currentPage = effectivePage + 1;
  }

  return allContracts;
}

const contractService = {
  async getContractList(
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt,desc',
  ): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Contract>>>> {
    return await api.get<ApiResponse<PaginatedResponse<Contract>>>(CONTRACT_BASE_URL, {
      params: { page, size, sort },
    });
  },

  async getContractById(
    id: string,
  ): Promise<AxiosResponse<ApiResponse<Contract>>> {
    return await api.get<ApiResponse<Contract>>(CONTRACT_BY_ID_URL(id));
  },

  async createContract(
    data: CreateContractRequest,
  ): Promise<AxiosResponse<ApiResponse<Contract>>> {
    return await api.post<ApiResponse<Contract>>(CONTRACT_BASE_URL, data);
  },

  async searchContracts(
    params: SearchContractParams,
  ): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Contract>>>> {
    return await api.get<ApiResponse<PaginatedResponse<Contract>>>(
      CONTRACT_SEARCH_URL,
      { params },
    );
  },

  async activateContract(
    id: string,
  ): Promise<AxiosResponse<ApiResponse<Contract>>> {
    return await api.put<ApiResponse<Contract>>(CONTRACT_ACTIVATE_URL(id), {});
  },

  async renewContract(
    id: string,
    data: RenewContractRequest,
  ): Promise<AxiosResponse<ApiResponse<Contract>>> {
    return await api.put<ApiResponse<Contract>>(CONTRACT_RENEW_URL(id), data);
  },

  async terminateContract(
    id: string,
    data: TerminateContractRequest,
  ): Promise<AxiosResponse<ApiResponse<Contract>>> {
    return await api.put<ApiResponse<Contract>>(CONTRACT_TERMINATE_URL(id), data);
  },

  getAllContracts,
};

export default contractService;
