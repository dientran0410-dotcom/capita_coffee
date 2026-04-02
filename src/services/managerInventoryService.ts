import { apiUtils } from "@/api/axios";
import { normalizeWarehouseUnit } from "@/utils/unit";
import type {
  BatchDeductIngredientItem,
  CreateWarehouseRequestPayload,
  FranchiseWarehouseMappingItem,
  MockInventoryItem,
  ResolvedFranchiseId,
  WarehouseDetail,
  WarehouseItem,
} from "@/types/managerInventory";

type AnyRecord = Record<string, unknown>;

type MaybeUser = {
  id?: string | number | null;
  staffId?: string | number | null;
  franchiseId?: string | null;
  raw?: Record<string, unknown> | null;
};

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

const normalizeUuid = (value: unknown, fallback: string = ZERO_UUID): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (!UUID_REGEX.test(raw)) return fallback;
  return raw.toLowerCase();
};

const parseJsonSafely = (raw: string | null): AnyRecord | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return toRecord(parsed);
  } catch {
    return null;
  }
};

const readStoredUser = (): AnyRecord | null => {
  const keys = ["user", "auth_user"] as const;
  for (const key of keys) {
    const local = parseJsonSafely(globalThis.localStorage?.getItem(key) ?? null);
    if (local) return local;

    const session = parseJsonSafely(globalThis.sessionStorage?.getItem(key) ?? null);
    if (session) return session;
  }
  return null;
};

const extractFranchiseIdFromObject = (value: unknown): string => {
  const obj = toRecord(value);
  const nestedUser = toRecord(obj.user);
  const nestedRaw = toRecord(obj.raw);
  const nestedRawUser = toRecord(nestedRaw.user);
  const nestedData = toRecord(obj.data);

  return pickString(
    obj.franchiseId,
    obj.franchiesId,
    nestedUser.franchiseId,
    nestedUser.franchiesId,
    nestedRaw.franchiseId,
    nestedRaw.franchiesId,
    nestedRawUser.franchiseId,
    nestedRawUser.franchiesId,
    nestedData.franchiseId,
    nestedData.franchiesId
  );
};

const extractStaffIdFromObject = (value: unknown): string => {
  const obj = toRecord(value);
  const nestedUser = toRecord(obj.user);
  const nestedRaw = toRecord(obj.raw);
  const nestedRawUser = toRecord(nestedRaw.user);
  const nestedData = toRecord(obj.data);

  return pickString(
    obj.staffId,
    obj.id,
    obj.userId,
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
    nestedData.userId
  );
};

const extractFranchiseIdFromToken = (token?: string | null): string => {
  if (!token || typeof token !== "string") return "";
  try {
    const parts = token.split(".");
    if (parts.length < 2) return "";

    const payloadBase64 = parts[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), "=");
    const payload = JSON.parse(globalThis.atob(payloadBase64)) as AnyRecord;
    return extractFranchiseIdFromObject(payload);
  } catch {
    return "";
  }
};

const toWarehouseDetail = (raw: unknown): WarehouseDetail | null => {
  const obj = toRecord(raw);
  const id = Number(obj.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    name: pickString(obj.name) || `Warehouse #${id}`,
    address: pickString(obj.address),
    status: pickString(obj.status) || "UNKNOWN",
  };
};

const mapWarehouseItem = (raw: unknown): WarehouseItem => {
  const obj = toRecord(raw);
  return {
    id: Number(obj.id ?? 0),
    name: pickString(obj.name) || "Unknown item",
    unit: normalizeWarehouseUnit(obj.unit, "GRAM"),
    description: pickString(obj.description),
    quantity: Number(obj.quantity ?? 0),
    reorderLevel: Number(obj.reorderLevel ?? 0),
    price: Number(obj.price ?? 0),
    supplierName: pickString(obj.supplierName),
    status: pickString(obj.status) || "UNKNOWN",
    categoryName: pickString(obj.categoryName),
    imageUrls: Array.isArray(obj.imageUrls)
      ? (obj.imageUrls.filter((v) => typeof v === "string") as string[])
      : [],
  };
};

const toInventoryStatus = (currentQuantity: number, reorderThreshold: number) => {
  if (currentQuantity <= 0) return "OUT_OF_STOCK" as const;
  if (currentQuantity <= reorderThreshold) return "LOW_STOCK" as const;
  return "IN_STOCK" as const;
};

const mapInventoryIngredient = (raw: unknown): MockInventoryItem => {
  const obj = toRecord(raw);
  const ingredientId = pickString(obj.id);
  const currentQuantity = Number(obj.currentQuantity ?? 0);
  const reorderThreshold = Number(obj.reorderThreshold ?? 0);

  return {
    id: ingredientId || pickString(obj.name) || "unknown-ingredient",
    ingredientId,
    ingredientName: pickString(obj.name) || "Unknown ingredient",
    unit: pickString(obj.unit) || "N/A",
    quantity: currentQuantity,
    minStock: reorderThreshold,
    status: toInventoryStatus(currentQuantity, reorderThreshold),
  };
};

export const getInventoryByFranchiseId = async (
  franchiseId: string
): Promise<MockInventoryItem[]> => {
  const response = await apiUtils.get<unknown>(
    `/api/inventory-service/ingredients/franchise/${encodeURIComponent(franchiseId)}`
  );

  const obj = toRecord(response);
  const data = Array.isArray(obj.data)
    ? obj.data
    : Array.isArray(response)
    ? response
    : [];

  return data.map(mapInventoryIngredient);
};

export const batchDeductIngredientStock = async (
  franchiseId: string,
  items: BatchDeductIngredientItem[]
): Promise<unknown> => {
  const normalizedFranchiseId = pickString(franchiseId);
  if (!normalizedFranchiseId) {
    throw new Error("franchiseId is required to deduct stock.");
  }

  const body = items.map((item) => {
    const ingredientId = pickString(item.ingredientId);
    if (!ingredientId) {
      throw new Error("ingredientId is required to deduct stock.");
    }

    const quantity = Math.abs(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("quantity must be greater than 0.");
    }

    return {
      ingredientId,
      ingredientName: pickString(item.ingredientName) || "Unknown ingredient",
      quantity,
      unit: normalizeWarehouseUnit(item.unit, "GRAM"),
    };
  });

  if (body.length === 0) {
    throw new Error("At least one ingredient is required to deduct stock.");
  }

  const response = await apiUtils.post<unknown>(
    `/api/inventory-service/ingredients/${encodeURIComponent(normalizedFranchiseId)}/batch-deduct`,
    body
  );

  const root = toRecord(response);
  const data = toRecord(root.data);
  const resultItems = Array.isArray(data.items) ? data.items.map(toRecord) : [];
  const failedItem = resultItems.find((item) => item.success === false);
  const failureCount = Number(data.failureCount ?? 0);

  if (failedItem || failureCount > 0) {
    throw new Error(
      pickString(
        failedItem?.errorMessage,
        data.message,
        root.message
      ) || "Batch deduct failed."
    );
  }

  return response;
};

export const resolveManagerFranchiseId = async (
  user?: MaybeUser | null,
  accessToken?: string | null
): Promise<ResolvedFranchiseId | null> => {
  try {
    const managerFranchises = await apiUtils.get<unknown>(
      "/api/franchise-service/franchises/manager"
    );
    const managerObj = toRecord(managerFranchises);
    const data = toRecord(managerObj.data);
    const list = Array.isArray(data.content)
      ? data.content
      : Array.isArray(data)
      ? data
      : Array.isArray(managerObj.content)
      ? managerObj.content
      : Array.isArray(managerObj)
      ? managerObj
      : [];

    const first = toRecord(list[0]);
    const fromManagerFranchise = pickString(first.franchiseId, first.id);
    if (fromManagerFranchise) {
      return {
        franchiseId: fromManagerFranchise,
        source: "manager-franchise",
      };
    }
  } catch {
    // fallback sources below
  }

  const fromUser = extractFranchiseIdFromObject(user);
  if (fromUser) {
    return { franchiseId: fromUser, source: "user" };
  }

  const storedUser = readStoredUser();
  const fromStorage = extractFranchiseIdFromObject(storedUser);
  if (fromStorage) {
    return { franchiseId: fromStorage, source: "storage" };
  }

  const fromToken = extractFranchiseIdFromToken(accessToken);
  if (fromToken) {
    return { franchiseId: fromToken, source: "token" };
  }

  const staffId = pickString(
    extractStaffIdFromObject(user),
    extractStaffIdFromObject(storedUser)
  );

  if (staffId) {
    try {
      const staffLookup = await apiUtils.get<unknown>(
        `/api/franchise-service/franchise-staff/staff/${encodeURIComponent(staffId)}/franchise`
      );
      const staffObj = toRecord(staffLookup);
      const data = toRecord(staffObj.data);
      const franchisesCandidate = Array.isArray(data.franchises)
        ? data.franchises
        : Array.isArray(staffObj.franchises)
        ? staffObj.franchises
        : [];

      const active =
        franchisesCandidate.find((item) => {
          const obj = toRecord(item);
          return pickString(obj.status).toUpperCase() === "ACTIVE";
        }) ?? franchisesCandidate[0];

      const fromStaffMapping = pickString(
        toRecord(active).franchiseId,
        toRecord(active).id
      );

      if (fromStaffMapping) {
        return {
          franchiseId: fromStaffMapping,
          source: "staff-mapping",
          staffId,
        };
      }
    } catch {
      // continue fallback below
    }
  }

  return null;
};

export const getWarehousesByFranchiseId = async (
  franchiseId: string
): Promise<FranchiseWarehouseMappingItem[]> => {
  const response = await apiUtils.get<unknown>(
    `/api/franchise-service/franchise-warehouse/franchise/${franchiseId}`
  );

  const obj = toRecord(response);
  const data = Array.isArray(obj.data) ? obj.data : Array.isArray(response) ? response : [];

  return data.map((item) => {
    const row = toRecord(item);
    return {
      id: pickString(row.id),
      warehouseId: pickString(row.warehouseId),
      status: pickString(row.status) || "UNKNOWN",
      assignedAt: pickString(row.assignedAt),
    };
  });
};

export const getWarehouseById = async (id: number): Promise<WarehouseDetail | null> => {
  const response = await apiUtils.get<unknown>(`/api/warehouse-service/warehouses/${id}`);
  const obj = toRecord(response);
  const data = toRecord(obj.data);

  return toWarehouseDetail(Object.keys(data).length > 0 ? data : obj);
};

export const getItemsByWarehouseId = async (
  warehouseId: number
): Promise<WarehouseItem[]> => {
  const response = await apiUtils.get<unknown>(
    "/api/warehouse-service/items/get-all",
    { warehouseId }
  );
  const obj = toRecord(response);
  const data = Array.isArray(obj.data) ? obj.data : Array.isArray(response) ? response : [];
  return data.map(mapWarehouseItem);
};

export const createWarehouseRequest = async (
  payload: CreateWarehouseRequestPayload
): Promise<unknown> => {
  const warehouseId = Number(payload.warehouseId);
  if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
    throw new Error("warehouseId is required to create request.");
  }

  const now = new Date().toISOString();
  const body = {
    id: Number(payload.id ?? 0),
    warehouseId,
    requestType: String(payload.requestType || ""),
    status: String(payload.status || "PENDING"),
    rejectReason: payload.rejectReason ?? "",
    handledBy: Number(payload.handledBy ?? 0),
    createdDate: String(payload.createdDate || now),
    updatedDate: String(payload.updatedDate || now),
    franchiseId: normalizeUuid(payload.franchiseId, ZERO_UUID),
    supplierId: normalizeUuid(payload.supplierId, ZERO_UUID),
    quantity: Number(payload.quantity ?? 0),
    itemName: String(payload.itemName || ""),
    unit: normalizeWarehouseUnit(payload.unit, "GRAM"),
    totalPrice: Number(payload.totalPrice ?? 0),
  };

  return apiUtils.post(`/api/warehouse-service/requests/${warehouseId}`, body);
};
