import { apiUtils } from "@/api/axios";
import { normalizeWarehouseUnit } from "@/utils/unit";

const BASE = "/api/warehouse-service";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AnyRecord = Record<string, unknown>;

export type WarehouseLookupOption = {
  id: number;
  name: string;
  status?: string;
};

const toRecord = (value: unknown): AnyRecord =>
  value && typeof value === "object" ? (value as AnyRecord) : {};

const toWarehouseLookupOption = (value: unknown): WarehouseLookupOption | null => {
  const row = toRecord(value);
  const id = Number(row.id);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const rawName = String(row.name ?? "").trim();

  return {
    id,
    name: rawName || `Warehouse #${id}`,
    status: String(row.status ?? "").trim() || undefined,
  };
};

const normalizeUuid = (value: unknown, fallback: string = ZERO_UUID): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (!UUID_REGEX.test(raw)) return fallback;
  return raw.toLowerCase();
};

/**
 * ==========================================
 * WAREHOUSE APIS
 * ==========================================
 */
export const getWarehouses = () => apiUtils.get(`${BASE}/warehouses/get-all`);

export const getWarehouseById = (id: number | string) =>
  apiUtils.get(`${BASE}/warehouses/${encodeURIComponent(String(id))}`);

export const getWarehousesByStatus = async (
  status: string = "ACTIVE"
): Promise<WarehouseLookupOption[]> => {
  const response = await apiUtils.get<unknown>(`${BASE}/warehouses/search-by-status`, {
    status,
  });

  const payload = toRecord(response);
  const list = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.content)
    ? payload.content
    : Array.isArray(response)
    ? response
    : [];

  return list
    .map(toWarehouseLookupOption)
    .filter((item): item is WarehouseLookupOption => Boolean(item));
};

export const createWarehouse = (data: any) => {
  const body = {
    name: data.name,
    address: data.address,
    status: data.status || "ACTIVE",
    locationId: Number(data.locationId),
  };
  return apiUtils.post(`${BASE}/warehouses/add`, body);
};

export const updateWarehouse = (id: number, data: any) => {
  const body = {
    name: data.name,
    address: data.address,
    status: data.status,
    locationId: Number(data.locationId),
  };
  return apiUtils.put(`${BASE}/warehouses/${id}`, body);
};

/**
 * ==========================================
 * ITEM & CATEGORY APIS
 * ==========================================
 */
export const getItemsByWarehouse = (warehouseId: number) =>
  apiUtils.get(`${BASE}/items/get-all?warehouseId=${warehouseId}`);

export const createItem = (data: any) => apiUtils.post(`${BASE}/items/add`, data);

export const updateItem = (id: number, data: any) =>
  apiUtils.put(`${BASE}/items/update?id=${id}`, data);

export const updateItemQuantity = (
  warehouseId: number | string,
  itemName: string,
  quantity: number,
) =>
  apiUtils.put(`${BASE}/items/update-quantity`, null, {
    params: {
      warehouseId: Number(warehouseId),
      itemName: String(itemName || "").trim(),
      quantity: Number(quantity),
    },
  });

export const deleteItem = (itemId: number) => apiUtils.delete(`${BASE}/items/${itemId}`);

export const uploadItemImages = (itemId: number, files: File[]) => {
  const normalizedItemId = Number(itemId);
  if (!Number.isFinite(normalizedItemId) || normalizedItemId <= 0) {
    throw new Error("itemId is required to upload images.");
  }

  const formData = new FormData();
  files
    .filter((file): file is File => file instanceof File)
    .forEach((file) => formData.append("files", file));

  if (!formData.has("files")) {
    throw new Error("Please select at least one image.");
  }

  return apiUtils.post(`${BASE}/items/${normalizedItemId}/images`, formData);
};

export const deleteItemImageByUrl = (imageUrl: string) => {
  const normalizedImageUrl = String(imageUrl || "").trim();
  if (!normalizedImageUrl) {
    throw new Error("imageUrl is required to delete image.");
  }

  return apiUtils.delete(`${BASE}/items/images`, {
    params: { imageUrl: normalizedImageUrl },
  });
};

/**
 * FIX: Khop voi @GetMapping("/warehouse/{warehouseId}")
 */
export const getCategories = (warehouseId?: number) => {
  if (warehouseId) {
    return apiUtils.get(`${BASE}/categories/warehouse/${warehouseId}`);
  }
  return apiUtils.get(`${BASE}/categories`);
};

export const createCategory = (data: any) => apiUtils.post(`${BASE}/categories`, data);

/**
 * UPDATE: Khop voi CategoryUpdateRequestDto
 */
export const updateCategory = (id: number, data: any) => {
  return apiUtils.put(`${BASE}/categories/${id}`, data);
};

export const deleteCategory = (id: number) => apiUtils.delete(`${BASE}/categories/${id}`);

/**
 * ==========================================
 * LOCATION & REQUEST APIS
 * ==========================================
 */
export const getLocations = () => apiUtils.get(`${BASE}/locations/get-all`);

export const createLocation = (data: any) => apiUtils.post(`${BASE}/locations`, data);

export const updateLocation = (id: number, data: any) =>
  apiUtils.put(`${BASE}/locations/update/${id}`, data);

export const deleteLocation = (id: number) => apiUtils.delete(`${BASE}/locations/${id}`);

export const getRequests = (query: any = {}) => {
  return apiUtils.get(`${BASE}/requests`, {
    page: query.page || 1,
    size: query.size || 10,
    type: query.type || undefined,
    status: query.status || undefined,
    fromDate: query.fromDate || undefined,
    toDate: query.toDate || undefined,
    warehouseId: query.warehouseId ? Number(query.warehouseId) : undefined,
  });
};

const buildWarehouseRequestBody = (data: any, warehouseId: number) => {
  const now = new Date().toISOString();

  return {
    id: Number(data?.id ?? 0),
    warehouseId,
    requestType: String(data?.requestType || ""),
    status: String(data?.status || "PENDING"),
    rejectReason: data?.rejectReason ?? "",
    handledBy: Number(data?.handledBy ?? 0),
    createdDate: String(data?.createdDate || now),
    updatedDate: String(data?.updatedDate || now),
    franchiseId: normalizeUuid(data?.franchiseId, ZERO_UUID),
    supplierId: normalizeUuid(data?.supplierId, ZERO_UUID),
    quantity: Number(data?.quantity ?? 0),
    itemName: String(data?.itemName || ""),
    unit: normalizeWarehouseUnit(data?.unit, "GRAM"),
    totalPrice: Number(data?.totalPrice ?? 0),
  };
};

export const createRequest = (data: any) => {
  const warehouseId = Number(data?.warehouseId);
  if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
    throw new Error("warehouseId is required to create request.");
  }

  const body = buildWarehouseRequestBody(data, warehouseId);
  return apiUtils.post(`${BASE}/requests/${warehouseId}`, body);
};

export const updateRequestStatus = (
  id: string | number,
  status: string,
  reason: string = ""
) => {
  const finalReason = reason.trim();
  const normalizedStatus = String(status || "").trim().toUpperCase();
  const encodedId = encodeURIComponent(String(id));

  return apiUtils.post(`${BASE}/requests/${encodedId}/status/${normalizedStatus}`, null, {
    params: finalReason ? { reason: finalReason } : undefined,
  });
};

export const getRequestHistory = (params?: any) => apiUtils.get(`${BASE}/history`, params || {});

export const getWarehouseRequestHistoryByWarehouse = (warehouseId: number | string) =>
  apiUtils.get(`${BASE}/history/warehouse/${warehouseId}/all`);

export const getRequestsByWarehouseId = (query: {
  warehouseId: number | string;
  page?: number;
  size?: number;
}) =>
  apiUtils.get(`${BASE}/requests/get-by-warehouseId`, {
    warehouseId: Number(query.warehouseId),
    page: query.page ?? 1,
    size: query.size ?? 10,
  });

export const getSuppliers = (query?: { page?: number; size?: number }) =>
  apiUtils.get("/api/suppliers", {
    page: query?.page ?? 0,
    size: query?.size ?? 10,
  });


export const getRequestsBySupplierId = (query: {
  supplierId: number | string;
  page?: number;
  size?: number;
}) =>
  apiUtils.get(`${BASE}/requests/get-by-supplierId`, {
    supplierId: String(query.supplierId),
    page: query.page ?? 1,
    size: query.size ?? 10,
  });

export const getSupplierAccountByAccountId = (accountId: string | number) =>
  apiUtils.get(`/api/suppliers/account/${encodeURIComponent(String(accountId))}`);

export const getSupplierProducts = (
  supplierId: string | number,
  query?: { page?: number; size?: number },
) =>
  apiUtils.get(`/api/suppliers/${encodeURIComponent(String(supplierId))}/products`, {
    page: query?.page ?? 0,
    size: query?.size ?? 10,
  });

export const getSupplierById = (supplierId: string | number) =>
  apiUtils.get(`/api/suppliers/${encodeURIComponent(String(supplierId))}`);

export const createWarehouseServiceRequest = (data: {
  id?: number;
  warehouseId: string | number;
  requestType: string;
  status?: string;
  rejectReason?: string;
  handledBy?: number;
  createdDate?: string;
  updatedDate?: string;
  franchiseId?: string | null;
  supplierId?: string | null;
  quantity: number;
  itemName: string;
  unit?: string;
  totalPrice: number;
}) => {
  const body = {
    ...buildWarehouseRequestBody(data, Number(data.warehouseId)),
    franchiseId: normalizeUuid(data.franchiseId, ZERO_UUID),
    supplierId: normalizeUuid(data.supplierId, ZERO_UUID),
  };
  const warehouseId = Number(data.warehouseId);
  if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
    throw new Error("warehouseId is required to create request.");
  }
  if (import.meta.env?.DEV) {
    console.info("[warehouseService][createWarehouseServiceRequest] debug", {
      endpoint: `${BASE}/requests/${warehouseId}`,
      input: data,
      normalizedBody: body,
    });
  }
  return apiUtils.post(`${BASE}/requests/${warehouseId}`, body);
};
