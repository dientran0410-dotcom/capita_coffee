import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  getCategories,
  getItemsByWarehouse,
  getRequestsBySupplierId,
  getSupplierProducts,
  getSupplierAccountByAccountId,
  getWarehouseById,
  updateItem,
  updateItemQuantity,
  updateRequestStatus,
} from "@/services/warehouseService";
import { normalizeWarehouseUnit } from "@/utils/unit";
import { useAuth } from "@/context/AuthContext";
import "./WarehouseRequests.css";

type WarehouseRequest = {
  id: string | number;
  requestType: string;
  status: string;
  createdDate?: string;
  createdAt?: string;
  quantity: number;
  itemName: string;
  unit?: string;
  totalPrice?: number;
  rejectReason?: string;
  handledBy?: string | number;
  warehouseId?: string | number;
  franchiseId?: string | number;
  supplierId?: string | number;
  warehouseName?: string;
  warehouseAddress?: string;
  minOrderQuantity?: number | null;
};

type SupplierProductLookup = {
  name?: string;
  minOrderQuantity?: number;
};

type WarehouseItemOption = {
  id?: string | number;
  name?: string;
  unit?: string;
  quantity?: number;
  price?: number;
  supplierName?: string;
  status?: string;
  reorderLevel?: number;
  description?: string;
  categoryId?: string | number;
  categoryName?: string;
  category?: {
    id?: string | number;
    name?: string;
  };
  [key: string]: unknown;
};

type WarehouseSyncContext = {
  warehouseId: number;
  itemName: string;
  requestQuantity: number;
  expectedQuantity: number;
  beforeQuantity: number;
  matchedItem: WarehouseItemOption;
};

const PAGE_SIZE = 10;
const isDebugMode = Boolean(import.meta.env?.DEV);

const debugWarehouseSync = (stage: string, payload?: unknown) => {
  if (!isDebugMode) return;
  console.info(`[SupplierWarehouseSync] ${stage}`, payload ?? "");
};

const extractList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const level1 = payload as Record<string, unknown>;
  const candidates: unknown[] = [level1.result, level1.data, level1];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
    if (candidate && typeof candidate === "object") {
      const obj = candidate as Record<string, unknown>;
      if (Array.isArray(obj.content)) return obj.content as T[];
      if (Array.isArray(obj.data)) return obj.data as T[];
    }
  }

  return [];
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

const formatMoney = (value?: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const isZeroLike = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return value === 0;
  const normalized = String(value).trim();
  return (
    normalized === "" ||
    normalized === "0" ||
    normalized.toLowerCase() === "00000000-0000-0000-0000-000000000000"
  );
};

const dedupeById = (items: WarehouseRequest[]): WarehouseRequest[] => {
  const seen = new Set<string>();
  const unique: WarehouseRequest[] = [];

  for (const item of items) {
    const key = String(item.id);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
};

const normalizeKey = (value: unknown): string => String(value ?? "").trim().toLowerCase();

const getRequestCreatedDate = (request: WarehouseRequest): Date | null => {
  const rawDate = request.createdDate || request.createdAt;
  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
};

const toPositiveNumber = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed > 0 ? parsed : Math.abs(parsed);
};

const quantitiesMatch = (left: number, right: number): boolean =>
  Math.abs(Number(left) - Number(right)) < 0.000001;

const extractWarehouseData = (payload: unknown): { name: string; address: string } | null => {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const name = String(data.name ?? "").trim();
  const address = String(data.address ?? "").trim();
  if (!name && !address) return null;

  return {
    name,
    address,
  };
};

const extractSupplierProfileId = (payload: unknown): string => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as Record<string, unknown>;
  const candidateObjects: Record<string, unknown>[] = [root];

  if (root.result && typeof root.result === "object") {
    candidateObjects.push(root.result as Record<string, unknown>);
  }

  if (root.data && typeof root.data === "object") {
    candidateObjects.push(root.data as Record<string, unknown>);
  }

  for (const candidate of candidateObjects) {
    const id = String(candidate.id ?? "").trim();
    if (id) return id;
  }

  return "";
};

const resolveWarehouseIdFromRequest = (request: WarehouseRequest): number | null => {
  const candidates: unknown[] = [request.warehouseId, request.handledBy];

  for (const candidate of candidates) {
    const parsed = toInteger(candidate);
    if (parsed !== null && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const extractPaginationMeta = (
  payload: unknown,
  currentPage: number,
  pageSize: number,
  fetchedCount: number,
): { totalPages: number | null; hasNext: boolean } => {
  if (!payload || typeof payload !== "object") {
    return {
      totalPages: null,
      hasNext: fetchedCount === pageSize && fetchedCount > 0,
    };
  }

  const root = payload as Record<string, unknown>;
  const candidateContainers: Record<string, unknown>[] = [root];
  if (root.result && typeof root.result === "object") {
    candidateContainers.push(root.result as Record<string, unknown>);
  }
  if (root.data && typeof root.data === "object") {
    candidateContainers.push(root.data as Record<string, unknown>);
  }

  let totalPages: number | null = null;
  let hasNext: boolean | null = null;

  for (const container of candidateContainers) {
    if (totalPages === null) {
      const directTotalPages = toInteger(container.totalPages);
      if (directTotalPages !== null && directTotalPages >= 0) {
        totalPages = directTotalPages;
      }
    }

    if (totalPages === null) {
      const totalElements = toInteger(container.totalElements ?? container.totalCount ?? container.count);
      if (totalElements !== null && totalElements >= 0) {
        totalPages = Math.ceil(totalElements / pageSize);
      }
    }

    if (hasNext === null && typeof container.hasNext === "boolean") {
      hasNext = container.hasNext;
    }

    if (hasNext === null && typeof container.last === "boolean") {
      hasNext = !container.last;
    }

    if (hasNext === null && typeof container.isLast === "boolean") {
      hasNext = !container.isLast;
    }

    if (hasNext === null && totalPages !== null) {
      const rawPage = toInteger(
        container.pageNumber ?? container.page ?? container.number ?? container.currentPage,
      );
      if (rawPage !== null) {
        const normalizedPage = rawPage >= 1 ? rawPage : rawPage + 1;
        hasNext = normalizedPage < totalPages;
      }
    }
  }

  if (totalPages !== null) {
    hasNext = hasNext ?? currentPage < totalPages;
    return {
      totalPages,
      hasNext,
    };
  }

  return {
    totalPages: null,
    hasNext: hasNext ?? (fetchedCount === pageSize && fetchedCount > 0),
  };
};

export default function WarehouseRequests() {
  const { currentUser } = useAuth();

  const resolveAccountId = useCallback((): string => {
    const raw = (currentUser?.raw ?? {}) as Record<string, unknown>;
    const rawUser = (raw.user ?? {}) as Record<string, unknown>;
    const candidates: unknown[] = [
      currentUser?.id,
      raw.accountId,
      raw.userId,
      raw.id,
      rawUser.accountId,
      rawUser.userId,
      rawUser.id,
    ];

    for (const candidate of candidates) {
      const value = String(candidate ?? "").trim();
      if (value) return value;
    }

    return "";
  }, [currentUser]);

  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");

  const resolveWarehouseItemForSync = async (
    warehouseId: number,
    itemName: string,
  ): Promise<WarehouseItemOption | null> => {
    if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
      return null;
    }

    const normalizedName = String(itemName || "").trim().toLowerCase();
    if (!normalizedName) {
      return null;
    }

    try {
      const response = await getItemsByWarehouse(warehouseId);
      const items = extractList<WarehouseItemOption>(response);
      const matchedItem = items.find(
        (item) => String(item?.name || "").trim().toLowerCase() === normalizedName,
      );

      return matchedItem || null;
    } catch (syncError) {
      console.error("Resolve warehouse item for supplier sync failed:", syncError);
      return null;
    }
  };

  const resolveCategoryIdForWarehouseItem = async (
    warehouseId: number,
    matchedItem: WarehouseItemOption | null,
  ): Promise<number> => {
    const rawCategoryId = matchedItem?.categoryId ?? matchedItem?.category?.id;
    const parsedCategoryId = Number(rawCategoryId);
    if (Number.isFinite(parsedCategoryId) && parsedCategoryId > 0) {
      return parsedCategoryId;
    }

    if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
      return 0;
    }

    try {
      const categoryResponse = await getCategories(warehouseId);
      const categories = extractList<any>(categoryResponse);
      if (categories.length === 0) return 0;

      const targetCategoryName = String(
        matchedItem?.categoryName ?? matchedItem?.category?.name ?? "",
      )
        .trim()
        .toLowerCase();

      const matchedCategory =
        (targetCategoryName
          ? categories.find(
              (category) =>
                String(category?.name || "")
                  .trim()
                  .toLowerCase() === targetCategoryName,
            )
          : null) ??
        categories.find((category) => Number(category?.id) > 0) ??
        categories[0];

      const fallbackCategoryId = Number(matchedCategory?.id);
      return Number.isFinite(fallbackCategoryId) ? fallbackCategoryId : 0;
    } catch (categoryError) {
      console.error("Resolve categoryId for supplier sync failed:", categoryError);
      return 0;
    }
  };

  const prepareWarehouseSyncContext = async (
    request: WarehouseRequest,
  ): Promise<WarehouseSyncContext> => {
    const resolvedWarehouseId = resolveWarehouseIdFromRequest(request);
    if (resolvedWarehouseId === null || resolvedWarehouseId <= 0) {
      throw new Error("Khong xac dinh duoc warehouseId de cap nhat ton kho.");
    }

    const normalizedItemName = String(request.itemName || "").trim();
    if (!normalizedItemName) {
      throw new Error("Khong tim thay itemName de cap nhat ton kho.");
    }

    const requestQuantity = toPositiveNumber(request.quantity);
    if (!Number.isFinite(requestQuantity) || requestQuantity <= 0) {
      throw new Error("So luong request khong hop le de cap nhat ton kho.");
    }

    const matchedItem = await resolveWarehouseItemForSync(
      resolvedWarehouseId,
      normalizedItemName,
    );
    if (!matchedItem) {
      throw new Error("Khong tim thay item trong warehouse de cap nhat so luong.");
    }

    const beforeQuantity = Number(matchedItem.quantity ?? 0);
    const expectedQuantity = Math.max(0, beforeQuantity + requestQuantity);

    return {
      warehouseId: resolvedWarehouseId,
      itemName: normalizedItemName,
      requestQuantity,
      beforeQuantity,
      expectedQuantity,
      matchedItem,
    };
  };

  const forceWarehouseQuantity = async (
    syncContext: WarehouseSyncContext,
    fallbackItem: WarehouseItemOption | null,
  ) => {
    const baseItem = fallbackItem ?? syncContext.matchedItem;
    if (!baseItem?.id) {
      throw new Error("Khong tim thay itemId warehouse de cap nhat so luong.");
    }

    const itemId = Number(baseItem.id);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      throw new Error(`itemId warehouse khong hop le: ${String(baseItem.id)}`);
    }

    const categoryId = await resolveCategoryIdForWarehouseItem(
      syncContext.warehouseId,
      baseItem,
    );

    const payload: Record<string, unknown> = {
      name: String(baseItem.name || syncContext.itemName),
      quantity: syncContext.expectedQuantity,
      unit: normalizeWarehouseUnit(baseItem.unit, "GRAM"),
      price: Number(baseItem.price ?? 0),
      supplierName: String(baseItem.supplierName || "WAREHOUSE_INTERNAL"),
      status: String(baseItem.status || "ACTIVE"),
      reorderLevel: Number(baseItem.reorderLevel ?? 0),
      description: String(baseItem.description || ""),
      categoryId,
    };

    debugWarehouseSync("forceWarehouseQuantity.payload", {
      itemId,
      payload,
    });

    await updateItem(itemId, payload);
  };

  const syncWarehouseInventoryAfterAccepted = async (
    syncContext: WarehouseSyncContext,
  ): Promise<"backend" | "manual" | "fallback"> => {
    const itemAfterApprove = await resolveWarehouseItemForSync(
      syncContext.warehouseId,
      syncContext.itemName,
    );

    if (!itemAfterApprove) {
      throw new Error("Khong tim thay item warehouse sau khi approve request.");
    }

    const quantityAfterApprove = Number(itemAfterApprove.quantity ?? 0);
    const remainingQuantity = syncContext.expectedQuantity - quantityAfterApprove;

    debugWarehouseSync("sync.afterApprove", {
      warehouseId: syncContext.warehouseId,
      itemName: syncContext.itemName,
      beforeQuantity: syncContext.beforeQuantity,
      requestQuantity: syncContext.requestQuantity,
      quantityAfterApprove,
      expectedQuantity: syncContext.expectedQuantity,
      remainingQuantity,
    });

    if (quantitiesMatch(quantityAfterApprove, syncContext.expectedQuantity)) {
      return "backend";
    }

    if (remainingQuantity < 0) {
      throw new Error(
        `So luong warehouse sau approve la ${quantityAfterApprove}, lon hon muc mong doi ${syncContext.expectedQuantity}.`,
      );
    }

    await updateItemQuantity(
      syncContext.warehouseId,
      syncContext.itemName,
      remainingQuantity,
    );

    const itemAfterManualSync = await resolveWarehouseItemForSync(
      syncContext.warehouseId,
      syncContext.itemName,
    );
    const quantityAfterManualSync = Number(itemAfterManualSync?.quantity ?? 0);

    debugWarehouseSync("sync.afterUpdateQuantity", {
      warehouseId: syncContext.warehouseId,
      itemName: syncContext.itemName,
      quantityAfterManualSync,
      expectedQuantity: syncContext.expectedQuantity,
    });

    if (quantitiesMatch(quantityAfterManualSync, syncContext.expectedQuantity)) {
      return "manual";
    }

    await forceWarehouseQuantity(syncContext, itemAfterManualSync ?? itemAfterApprove);

    const itemAfterFallback = await resolveWarehouseItemForSync(
      syncContext.warehouseId,
      syncContext.itemName,
    );
    const quantityAfterFallback = Number(itemAfterFallback?.quantity ?? 0);

    debugWarehouseSync("sync.afterFallbackUpdateItem", {
      warehouseId: syncContext.warehouseId,
      itemName: syncContext.itemName,
      quantityAfterFallback,
      expectedQuantity: syncContext.expectedQuantity,
    });

    if (!quantitiesMatch(quantityAfterFallback, syncContext.expectedQuantity)) {
      throw new Error(
        `Khong the dong bo ton kho warehouse. So luong hien tai la ${quantityAfterFallback}, mong doi ${syncContext.expectedQuantity}.`,
      );
    }

    return "fallback";
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const accountId = resolveAccountId();
      if (!accountId) {
        throw new Error("Khong tim thay accountId de tra supplierId.");
      }

      const supplierProfileResponse = await getSupplierAccountByAccountId(accountId);
      const supplierId = extractSupplierProfileId(supplierProfileResponse);
      if (!supplierId) {
        throw new Error("Khong lay duoc supplierId tu API supplier account.");
      }

      const firstPageResponse = (await getRequestsBySupplierId({
        supplierId,
        page: 1,
        size: PAGE_SIZE,
      })) as unknown;

      const firstPageList = extractList<WarehouseRequest>(firstPageResponse);
      const merged: WarehouseRequest[] = [...firstPageList];

      const firstMeta = extractPaginationMeta(firstPageResponse, 1, PAGE_SIZE, firstPageList.length);

      if (firstMeta.totalPages !== null && firstMeta.totalPages > 1) {
        for (let page = 2; page <= firstMeta.totalPages; page += 1) {
          const nextResponse = (await getRequestsBySupplierId({
            supplierId,
            page,
            size: PAGE_SIZE,
          })) as unknown;
          merged.push(...extractList<WarehouseRequest>(nextResponse));
        }
      } else if (firstMeta.totalPages === null && firstMeta.hasNext) {
        let page = 2;
        let hasNext = true;
        let safetyCounter = 0;

        while (hasNext && safetyCounter < 100) {
          const nextResponse = (await getRequestsBySupplierId({
            supplierId,
            page,
            size: PAGE_SIZE,
          })) as unknown;
          const nextList = extractList<WarehouseRequest>(nextResponse);
          merged.push(...nextList);

          const meta = extractPaginationMeta(nextResponse, page, PAGE_SIZE, nextList.length);
          hasNext = meta.hasNext;
          page += 1;
          safetyCounter += 1;
        }
      }

      const supplierChannelOnly = merged.filter((item) => !isZeroLike(item?.supplierId));
      const dedupedRequests = dedupeById(supplierChannelOnly as WarehouseRequest[]);

      const supplierProductsResponse = (await getSupplierProducts(supplierId, {
        page: 0,
        size: 1000,
      })) as unknown;
      const supplierProducts = extractList<SupplierProductLookup>(supplierProductsResponse);
      const minOrderByName = new Map<string, number>();

      supplierProducts.forEach((product) => {
        const key = normalizeKey(product?.name);
        const minOrderQuantity = Number(product?.minOrderQuantity);

        if (!key) return;
        if (!Number.isFinite(minOrderQuantity)) return;
        if (!minOrderByName.has(key)) {
          minOrderByName.set(key, minOrderQuantity);
        }
      });

      const warehouseIds = Array.from(
        new Set(
          dedupedRequests
            .map((item) => resolveWarehouseIdFromRequest(item))
            .filter((id): id is number => id !== null && id > 0),
        ),
      );

      const warehouseMap = new Map<number, { name: string; address: string }>();
      await Promise.all(
        warehouseIds.map(async (warehouseId) => {
          try {
            const warehouseResponse = (await getWarehouseById(warehouseId)) as unknown;
            const warehouseInfo = extractWarehouseData(warehouseResponse);
            if (warehouseInfo) {
              warehouseMap.set(warehouseId, warehouseInfo);
            }
          } catch {
            // Ignore individual warehouse lookup failures and keep request list rendering.
          }
        }),
      );

      const enrichedRequests = dedupedRequests.map((request) => {
        const warehouseId = resolveWarehouseIdFromRequest(request);
        if (warehouseId === null || warehouseId <= 0) {
          return {
            ...request,
            warehouseName: "-",
            warehouseAddress: "-",
          };
        }

        const warehouseInfo = warehouseMap.get(warehouseId);
        return {
          ...request,
          warehouseName: warehouseInfo?.name || "-",
          warehouseAddress: warehouseInfo?.address || "-",
          minOrderQuantity: minOrderByName.get(normalizeKey(request.itemName)) ?? null,
        };
      });

      setRequests(enrichedRequests);
      setRejectingId(null);
      setRejectReasonInput("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load warehouse requests";
      setError(message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [resolveAccountId]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleApprove = async (request: WarehouseRequest) => {
    const isConfirmed = window.confirm("Are you sure you want to approve this request?");
    if (!isConfirmed) return;

    let syncContext: WarehouseSyncContext | null = null;
    let syncPreparationError = "";

    try {
      syncContext = await prepareWarehouseSyncContext(request);
    } catch (prepareError: unknown) {
      syncPreparationError =
        prepareError instanceof Error
          ? prepareError.message
          : "Khong chuan bi duoc du lieu dong bo warehouse.";
      debugWarehouseSync("prepare.error", {
        requestId: request.id,
        itemName: request.itemName,
        error: syncPreparationError,
      });
    }

    try {
      await updateRequestStatus(request.id, "ACCEPTED", "");
      let alertMessage = "Approve request thanh cong.";

      if (syncContext) {
        try {
          const syncMode = await syncWarehouseInventoryAfterAccepted(syncContext);
          alertMessage =
            syncMode === "backend"
              ? "Approve request thanh cong. Warehouse da tu cap nhat so luong."
              : "Approve request thanh cong va da cap nhat so luong warehouse.";
        } catch (syncError: unknown) {
          const syncMessage =
            syncError instanceof Error
              ? syncError.message
              : "Khong ro loi cap nhat ton kho warehouse.";
          alertMessage = `Approve request thanh cong nhung cap nhat ton kho warehouse that bai: ${syncMessage}`;
        }
      } else if (syncPreparationError) {
        alertMessage = `Approve request thanh cong nhung khong the xac dinh item warehouse de dong bo ton kho: ${syncPreparationError}`;
      }

      await loadRequests();
      setRejectingId(null);
      setRejectReasonInput("");
      window.alert(alertMessage);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve request";
      window.alert(message);
    }
  };

  const openRejectInput = (requestId: string | number) => {
    setRejectingId(String(requestId));
    setRejectReasonInput("");
  };

  const cancelRejectInput = () => {
    setRejectingId(null);
    setRejectReasonInput("");
  };

  const submitReject = async (requestId: string | number) => {
    const reason = rejectReasonInput.trim();
    if (!reason) {
      window.alert("Please enter a rejection reason.");
      return;
    }

    const isConfirmed = window.confirm("Are you sure you want to reject this request?");
    if (!isConfirmed) return;

    try {
      await updateRequestStatus(requestId, "REJECTED", reason);
      await loadRequests();
      setRejectingId(null);
      setRejectReasonInput("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject request";
      window.alert(message);
    }
  };

  const statusOptions = useMemo(() => {
    const dynamicStatuses = Array.from(
      new Set(
        requests
          .map((request) => String(request.status || "").trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    return ["ALL", ...dynamicStatuses];
  }, [requests]);

  const filteredRows = useMemo(() => {
    const fromBoundary = fromDateFilter ? new Date(`${fromDateFilter}T00:00:00`) : null;
    const toBoundary = toDateFilter ? new Date(`${toDateFilter}T23:59:59.999`) : null;

    const fromTime = fromBoundary && !Number.isNaN(fromBoundary.getTime()) ? fromBoundary.getTime() : null;
    const toTime = toBoundary && !Number.isNaN(toBoundary.getTime()) ? toBoundary.getTime() : null;

    const minTime =
      fromTime !== null && toTime !== null ? Math.min(fromTime, toTime) : fromTime;
    const maxTime =
      fromTime !== null && toTime !== null ? Math.max(fromTime, toTime) : toTime;

    const matchedRows = requests.filter((request) => {
      const normalizedStatus = String(request.status || "").trim().toUpperCase();
      if (statusFilter !== "ALL" && normalizedStatus !== statusFilter) {
        return false;
      }

      if (minTime === null && maxTime === null) {
        return true;
      }

      const createdDate = getRequestCreatedDate(request);
      if (!createdDate) {
        return false;
      }

      const createdTime = createdDate.getTime();
      if (minTime !== null && createdTime < minTime) {
        return false;
      }
      if (maxTime !== null && createdTime > maxTime) {
        return false;
      }

      return true;
    });

    return [...matchedRows].sort((a, b) => {
      const aDate = getRequestCreatedDate(a);
      const bDate = getRequestCreatedDate(b);

      const aTime = aDate ? aDate.getTime() : 0;
      const bTime = bDate ? bDate.getTime() : 0;
      return bTime - aTime;
    });
  }, [requests, statusFilter, fromDateFilter, toDateFilter]);

  const effectiveTotalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  useEffect(() => {
    if (effectiveTotalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (effectiveTotalPages > 0 && currentPage > effectiveTotalPages) {
      setCurrentPage(effectiveTotalPages);
    }
  }, [currentPage, effectiveTotalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, fromDateFilter, toDateFilter]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const canGoPrevious = !loading && currentPage > 1;
  const canGoNext = !loading && currentPage < effectiveTotalPages;

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage === currentPage || loading) return;
    setCurrentPage(nextPage);
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setFromDateFilter("");
    setToDateFilter("");
  };

  return (
    <section className="swr-page">
      <div className="swr-header">
        <h1>Warehouse Requests</h1>
        <p>Review and process warehouse requests from supplier portal.</p>
      </div>

      {error ? <div className="swr-error">{error}</div> : null}

      <div className="swr-filters">
        <div className="swr-filter-field">
          <label htmlFor="swr-status-filter">Status</label>
          <select
            id="swr-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All status" : status}
              </option>
            ))}
          </select>
        </div>

        <div className="swr-filter-field">
          <label htmlFor="swr-from-date">From date</label>
          <input
            id="swr-from-date"
            type="date"
            value={fromDateFilter}
            onChange={(event) => setFromDateFilter(event.target.value)}
          />
        </div>

        <div className="swr-filter-field">
          <label htmlFor="swr-to-date">To date</label>
          <input
            id="swr-to-date"
            type="date"
            value={toDateFilter}
            onChange={(event) => setToDateFilter(event.target.value)}
          />
        </div>

        <button type="button" className="swr-btn swr-btn-secondary swr-clear-filter" onClick={clearFilters}>
          Clear
        </button>
      </div>

      <div className="swr-card">
        <div className="swr-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Min Order Quantity</th>
                <th>Total Price</th>
                <th>Warehouse Name</th>
                <th>Warehouse Address</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>Loading...</td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9}>No requests found.</td>
                </tr>
              ) : (
                paginatedRows.map((request) => {
                  const normalizedStatus = String(request.status || "").toUpperCase();
                  const isResolved = normalizedStatus === "APPROVED" || normalizedStatus === "REJECTED" || normalizedStatus === "ACCEPTED";
                  const created = request.createdDate || request.createdAt;
                  const reqId = String(request.id);

                  return (
                    <Fragment key={reqId}>
                      <tr>
                        <td>{request.itemName}</td>
                        <td>{request.quantity}</td>
                        <td>{request.minOrderQuantity ?? "-"}</td>
                        <td>{formatMoney(request.totalPrice)}</td>
                        <td>{request.warehouseName || "-"}</td>
                        <td>{request.warehouseAddress || "-"}</td>
                        <td>{formatDateTime(created)}</td>
                        <td>
                          <span className={`swr-status swr-status-${normalizedStatus.toLowerCase()}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <div className="swr-actions">
                            <button
                              type="button"
                              className="swr-btn swr-btn-approve"
                              onClick={() => void handleApprove(request)}
                              disabled={isResolved}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="swr-btn swr-btn-reject"
                              onClick={() => openRejectInput(request.id)}
                              disabled={isResolved}
                            >
                              Reject
                            </button>
                          </div>
                          {request.rejectReason ? <p className="swr-reason-view">Reason: {request.rejectReason}</p> : null}
                        </td>
                      </tr>

                      {rejectingId === reqId ? (
                        <tr className="swr-reject-row">
                          <td colSpan={9}>
                            <div className="swr-reject-box">
                              <label htmlFor={`reject-reason-${reqId}`}>Rejection Reason</label>
                              <textarea
                                id={`reject-reason-${reqId}`}
                                value={rejectReasonInput}
                                onChange={(event) => setRejectReasonInput(event.target.value)}
                                placeholder="Enter reason for rejection..."
                                rows={3}
                              />
                              <div className="swr-reject-actions">
                                <button type="button" className="swr-btn swr-btn-secondary" onClick={cancelRejectInput}>
                                  Cancel
                                </button>
                                <button type="button" className="swr-btn swr-btn-reject" onClick={() => void submitReject(request.id)}>
                                  Confirm Reject
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="swr-pagination">
          <button
            type="button"
            className="swr-btn swr-btn-secondary swr-page-btn"
            disabled={!canGoPrevious}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>

          <span className="swr-pagination-info">
            Page {effectiveTotalPages === 0 ? 0 : currentPage} / {Math.max(effectiveTotalPages, 1)}
          </span>

          <button
            type="button"
            className="swr-btn swr-btn-secondary swr-page-btn"
            disabled={!canGoNext}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
