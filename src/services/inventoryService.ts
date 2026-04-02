import { apiUtils } from "@/api/axios";
import type {
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
  InventoryLog,
  InventoryRequest,
  InventoryRequestStatus,
} from "@/types/inventory";

const BASE = "/api/inventory-service";

type ApiResponse<T> = {
  data: T;
  status?: string;
  errors?: unknown;
  metadata?: Record<string, unknown>;
};

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number?: number;
  size?: number;
};

const toNumber = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const mapIngredient = (row: any): InventoryItem => ({
  id: toNumber(row?.id),
  name: row?.name || "",
  description: row?.description || "",
  unit: row?.unit || "GRAM",
  currentQuantity: toNumber(row?.currentQuantity),
  reorderThreshold: toNumber(row?.reorderThreshold),
  status: row?.status || "ACTIVE",
  stockoutRisk: row?.stockoutRisk,
  createdDate: row?.createdDate,
  updatedDate: row?.updatedDate,
});

export const getInventoryItems = async () => {
  const res = await apiUtils.get<ApiResponse<any[]>>(
    `${BASE}/view-ingredient-levels/get-all-ingredients`
  );

  const rows = res?.data || [];
  return { data: rows.map(mapIngredient) };
};

export const createInventoryItem = async (_data: Partial<InventoryItem>) => {
  // Scope hiện tại: chưa làm API create ingredient.
  return { data: null };
};

export const updateInventoryItem = async (
  id: number,
  data: Partial<InventoryItem>
) => {
  const body = {
    name: (data.name || "").trim(),
    unit: data.unit,
    reorderThreshold: toNumber(data.reorderThreshold),
    description: data.description ?? "",
    status: data.status,
  };

  const res = await apiUtils.put<ApiResponse<any>>(`${BASE}/ingredients/${id}`, body);
  return { data: res?.data || null };
};

export const getInventoryCategories = async () => ({ data: [] as InventoryCategory[] });

export const createInventoryCategory = async (_data: Partial<InventoryCategory>) => ({
  data: null,
});

export const updateInventoryCategory = async (
  _id: number,
  _data: Partial<InventoryCategory>
) => ({ data: null });

export const getInventoryLocations = async () => ({ data: [] as InventoryLocation[] });

export const createInventoryLocation = async (_data: Partial<InventoryLocation>) => ({
  data: null,
});

export const updateInventoryLocation = async (
  _id: number,
  _data: Partial<InventoryLocation>
) => ({ data: null });

export const getInventoryRequests = async () => ({ data: [] as InventoryRequest[] });

export const createInventoryRequest = async (_data: Partial<InventoryRequest>) => ({
  data: null,
});

export const updateInventoryRequestStatus = async (
  _id: number,
  _status: InventoryRequestStatus,
  _reason = ""
) => ({ data: null });

export const getInventoryRequestHistory = async () => ({ data: [] as InventoryRequest[] });

export const getInventoryLogs = async (params?: {
  ingredientId?: string;
  actionType?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}) => {
  const query = {
    ingredientId: params?.ingredientId || undefined,
    actionType: params?.actionType || undefined,
    performedBy: params?.performedBy || undefined,
    startDate: params?.startDate || undefined,
    endDate: params?.endDate || undefined,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  };

  const pageRes = await apiUtils.get<PageResponse<any>>(
    `${BASE}/inventory-logs`,
    query
  );

  const content: InventoryLog[] = (pageRes?.content || []).map((row: any, idx: number) => ({
    id: idx + 1,
    ingredientName: row?.ingredientName || "N/A",
    actionType: row?.actionType || "EDIT",
    quantityChanged: toNumber(row?.quantityChanged),
    performedBy: row?.performedBy || "system",
    reason: row?.reason || "",
    timestamp: row?.timestamp,
  }));

  return {
    data: {
      content,
      totalPages: pageRes?.totalPages || 0,
      totalElements: pageRes?.totalElements || 0,
      page: pageRes?.number ?? query.page,
      size: pageRes?.size ?? query.size,
    },
  };
};

export const setInventoryReorderThreshold = async (
  ingredientId: number,
  threshold: number
) => {
  const body = {
    ingredientId,
    reorderThreshold: toNumber(threshold),
  };

  const res = await apiUtils.post<ApiResponse<any>>(
    `${BASE}/ingredients/set-reorder-threshold`,
    body
  );

  return { data: res?.data || null };
};

// HÀM ADD STOCK 
export const addInventoryStock = async (payload: {
  ingredientId: number;
  ingredientName?: string;
  quantityToAdd: number;
  unit: string;
  supplierInfo?: string;
  expirationDate?: string;
  reason?: string;
  performedBy?: string; 
}) => {
  const body = {
    ingredientId: payload.ingredientId,
    ingredientName: payload.ingredientName,
    quantityToAdd: toNumber(payload.quantityToAdd),
    unit: payload.unit,
    supplierInfo: payload.supplierInfo,
    expirationDate: payload.expirationDate,
    reason: payload.reason,
  };

  const res = await apiUtils.post<ApiResponse<any>>(
    `${BASE}/ingredient-stocks/add`,
    body
  );

  return { data: res?.data || null };
};

export const deductInventoryStock = async (
  ingredientId: number,
  payload: {
    quantityToDeduct: number;
    reason?: string;
    performedBy?: string;
  }
) => {
  const body = {
    quantityToDeduct: toNumber(payload.quantityToDeduct),
    reason: payload.reason || undefined,
    performedBy: payload.performedBy || undefined,
  };

  const res = await apiUtils.post<ApiResponse<any>>(
    `${BASE}/ingredients/${ingredientId}/deduct`,
    body
  );

  return { data: res?.data || null };
};

export type ImportOrAddStockPayload = {
  ingredientId?: string | number;
  ingredientName?: string;
  quantityToAdd?: number;
  unit?: string;
  supplierInfo?: string;
  expirationDate?: string;
  reason?: string;
};

export const importOrAddStockByFranchise = async (
  franchiseId: string,
  payload: ImportOrAddStockPayload
) => {
  const safeFranchiseId = String(franchiseId || "").trim();
  if (!safeFranchiseId || safeFranchiseId === "0") {
    throw new Error("franchiseId is required.");
  }
  const isFranchiseUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      safeFranchiseId
    );
  if (!isFranchiseUuid) {
    throw new Error(`franchiseId "${safeFranchiseId}" is not a valid UUID.`);
  }

  const today = new Date();
  const defaultExpiration = new Date(today);
  defaultExpiration.setDate(defaultExpiration.getDate() + 1);
  const yyyy = defaultExpiration.getFullYear();
  const mm = String(defaultExpiration.getMonth() + 1).padStart(2, "0");
  const dd = String(defaultExpiration.getDate()).padStart(2, "0");
  const rawIngredientId = String(payload.ingredientId || "").trim();
  const isUuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      rawIngredientId
    );
  const fallbackIngredientUuid = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const normalizedIngredientId = isUuidLike
    ? rawIngredientId
    : fallbackIngredientUuid;
  const parsedQuantity = Number(payload.quantityToAdd);
  const normalizedQuantity =
    Number.isFinite(parsedQuantity) && parsedQuantity !== 0
      ? parsedQuantity
      : 0.01;
  const rawUnit = String(payload.unit || "").trim().toUpperCase();
  const allowedUnits = new Set([
    "GRAM",
    "KILOGRAM",
    "MILLILITER",
    "LITER",
    "PIECE",
    "UNIT",
  ]);
  const normalizedUnit = allowedUnits.has(rawUnit) ? rawUnit : "GRAM";

  const bodyWithIngredientId = {
    ingredientId: normalizedIngredientId,
    ingredientName: String(payload.ingredientName || "UNKNOWN_ITEM"),
    quantityToAdd: normalizedQuantity,
    unit: normalizedUnit,
    supplierInfo: String(payload.supplierInfo || "WAREHOUSE_TRANSFER"),
    expirationDate: String(payload.expirationDate || `${yyyy}-${mm}-${dd}`),
    reason: String(payload.reason || "WAREHOUSE_REQUEST_ACCEPTED_MANUAL_SYNC"),
  };
  const bodyWithoutIngredientId = {
    ingredientName: String(payload.ingredientName || "UNKNOWN_ITEM"),
    quantityToAdd: normalizedQuantity,
    unit: normalizedUnit,
    supplierInfo: String(payload.supplierInfo || "WAREHOUSE_TRANSFER"),
    expirationDate: String(payload.expirationDate || `${yyyy}-${mm}-${dd}`),
    reason: String(payload.reason || "WAREHOUSE_REQUEST_ACCEPTED_MANUAL_SYNC"),
  };

  const primaryUrl = `${BASE}/ingredients/${encodeURIComponent(
    safeFranchiseId
  )}/import-or-add-stock`;
  const fallbackUrl = `${BASE}/ingredients/franchise/${encodeURIComponent(
    safeFranchiseId
  )}/import-or-add-stock`;

  const requestBodies = [bodyWithIngredientId, bodyWithoutIngredientId];
  let lastError: any = null;

  for (const requestBody of requestBodies) {
    try {
      const res = await apiUtils.post<ApiResponse<any>>(primaryUrl, requestBody);
      return { data: res?.data || null };
    } catch (error: any) {
      if (error?.status !== 404) {
        lastError = error;
        continue;
      }

      try {
        const fallbackRes = await apiUtils.post<ApiResponse<any>>(fallbackUrl, requestBody);
        return { data: fallbackRes?.data || null };
      } catch (fallbackError: any) {
        lastError = fallbackError;
      }
    }
  }

  throw lastError || new Error("Import/add stock failed.");
};
