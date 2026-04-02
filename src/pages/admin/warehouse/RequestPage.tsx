import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createWarehouseServiceRequest,
  getCategories,
  getItemsByWarehouse,
  getRequestsByWarehouseId,
  getSupplierById,
  getSupplierProducts,
  getSuppliers,
  updateItem,
  updateRequestStatus,
} from "@/services/warehouseService";
import { importOrAddStockByFranchise } from "@/services/inventoryService";
import { normalizeWarehouseUnit } from "@/utils/unit";
import "@/assets/css/warehouseRequest.css";

type WarehouseRequestRow = {
  id?: number;
  itemId?: string | number;
  requestType?: string;
  status?: string;
  rejectReason?: string;
  handledBy?: number;
  createdDate?: string;
  franchiseId?: string | number;
  supplierId?: string | number;
  quantity?: number;
  itemName?: string;
  unit?: string;
  totalPrice?: number;
};

type DisplayRequest = {
  id: string;
  itemName: string;
  requestType: string;
  quantity: number;
  status: string;
  performedBy: string;
  rejectReason: string;
};

type SupplierOption = {
  id: string;
  name: string;
  materialType?: string;
  requestSupplierId: string;
  raw?: unknown;
};

type SupplierProductOption = {
  id: string;
  name: string;
  unit?: string;
  pricePerUnit: number;
  supplierId: string;
  raw?: unknown;
};

type RequestTab = "franchise" | "supplier";

type WarehouseItemOption = {
  id?: string | number;
  name?: string;
  unit?: string;
  categoryName?: string;
  quantity?: number;
  price?: number;
  supplierName?: string;
  status?: string;
  reorderLevel?: number;
  description?: string;
  categoryId?: string | number;
  category?: { id?: string | number };
  [key: string]: unknown;
};

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const SUPPLIER_FLOW_FRANCHISE_PLACEHOLDER_ID =
  "00000000-0000-0000-0000-000000000001";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalizeUuid = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw || !UUID_REGEX.test(raw)) return "";
  return raw.toLowerCase();
};

const toStatusUpper = (status: string | undefined): string =>
  String(status || "").trim().toUpperCase();

const toFilterStatus = (status: string): string => {
  if (status === "ACCEPT") return "ACCEPTED";
  if (status === "REJECT") return "REJECTED";
  return status;
};

const toItemKey = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const toPositiveQuantity = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
};

const isZeroLike = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return value === 0;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "" || normalized === "0" || normalized === ZERO_UUID;
};

const isFranchiseRequest = (row: WarehouseRequestRow): boolean => {
  return !isZeroLike(row.franchiseId) && isZeroLike(row.supplierId);
};

const normalizeRow = (row: WarehouseRequestRow): DisplayRequest => {
  const requestId = row.id != null ? String(row.id) : "";
  const status = toFilterStatus(toStatusUpper(row.status));

  return {
    id: requestId,
    itemName: row.itemName || "-",
    requestType: row.requestType || "-",
    quantity: Number(row.quantity || 0),
    status,
    performedBy: row.handledBy != null ? String(row.handledBy) : "-",
    rejectReason: row.rejectReason || "",
  };
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

const scanSupplierUuidInObject = (value: unknown, depth = 0): string => {
  if (depth > 6 || value === null || value === undefined) return "";

  if (typeof value === "string") {
    return normalizeUuid(value);
  }

  if (typeof value === "number") {
    return "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = scanSupplierUuidInObject(item, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (typeof value !== "object") return "";

  const record = value as Record<string, unknown>;

  for (const [key, fieldValue] of Object.entries(record)) {
    const normalizedKey = key.trim().toLowerCase();
    const isSupplierIdKey =
      normalizedKey === "supplierid" ||
      normalizedKey === "supplier_id" ||
      normalizedKey === "supplier-id" ||
      normalizedKey === "idsupplier";

    if (!isSupplierIdKey) continue;

    const parsed = normalizeUuid(fieldValue);
    if (parsed) return parsed;
  }

  for (const fieldValue of Object.values(record)) {
    const found = scanSupplierUuidInObject(fieldValue, depth + 1);
    if (found) return found;
  }

  return "";
};

const resolveSupplierUuid = (value: any): string => {
  const candidates = [
    value?.supplierId,
    value?.supplierID,
    value?.supplier_id,
    value?.supplier?.supplierId,
    value?.supplier?.supplierID,
    value?.supplier?.supplier_id,
    value?.supplier?.id,
    value?.id,
    value?.userId,
    value?.accountId,
    value?.ownerId,
  ];

  for (const candidate of candidates) {
    const parsed = normalizeUuid(candidate);
    if (parsed) return parsed;
  }

  const scanned = scanSupplierUuidInObject(value);
  if (scanned) return scanned;

  return "";
};

const normalizeSupplier = (row: any): SupplierOption => ({
  id: String(row?.id ?? row?.supplierId ?? row?.code ?? ""),
  name: String(row?.name ?? "Unknown Supplier"),
  materialType: row?.materialType ? String(row.materialType) : undefined,
  requestSupplierId: resolveSupplierUuid(row),
  raw: row,
});

const normalizeSupplierProduct = (row: any): SupplierProductOption => ({
  id: String(row?.id ?? row?.productId ?? ""),
  name: String(
    row?.name ??
      row?.productNameSnapshot ??
      row?.productName ??
      "Unknown Item",
  ),
  unit: normalizeWarehouseUnit(row?.unit ?? row?.productUnitSnapshot, "GRAM"),
  pricePerUnit: Number(row?.pricePerUnit || 0),
  supplierId: resolveSupplierUuid(row),
  raw: row,
});

const toLocalDateOnly = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Temporary compensation:
// BE currently adds +approvedQty to warehouse when ACCEPT.
// To get final expected effect (warehouse -approvedQty), FE must deduct 2x approvedQty.
const WAREHOUSE_DEDUCT_MULTIPLIER_AFTER_ACCEPT = 2;
const isDebugMode = Boolean(import.meta.env?.DEV);

const debugRequestSupplier = (stage: string, payload?: unknown) => {
  if (!isDebugMode) return;
  console.info(`[RequestSupplierDebug] ${stage}`, payload ?? "");
};

export default function RequestPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const warehouseId = searchParams.get("warehouseId") || "";

  const [franchiseRequests, setFranchiseRequests] = useState<WarehouseRequestRow[]>(
    [],
  );
  const [warehouseStockSnapshot, setWarehouseStockSnapshot] = useState<
    Record<string, number>
  >({});
  const [filter, setFilter] = useState("ALL");
  const [loadingFranchiseRequests, setLoadingFranchiseRequests] =
    useState(false);
  const [handlingRequestAction, setHandlingRequestAction] = useState(false);

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<
    SupplierProductOption[]
  >([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingSupplierProducts, setLoadingSupplierProducts] = useState(false);
  const [sendingSupplierRequest, setSendingSupplierRequest] = useState(false);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);

  const tabFromUrl = searchParams.get("tab");
  const activeTab: RequestTab =
    tabFromUrl === "supplier" ? "supplier" : "franchise";

  const selectedProduct = useMemo(
    () => supplierProducts.find((p) => p.id === selectedProductId) || null,
    [supplierProducts, selectedProductId],
  );
  const totalPrice = useMemo(
    () => Number((Number(quantity || 0) * Number(selectedProduct?.pricePerUnit || 0)).toFixed(2)),
    [quantity, selectedProduct],
  );

  const setTab = (tab: RequestTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  const loadFranchiseRequests = async () => {
    if (!warehouseId) {
      setFranchiseRequests([]);
      setWarehouseStockSnapshot({});
      return;
    }

    setLoadingFranchiseRequests(true);
    try {
      const response = await getRequestsByWarehouseId({
        warehouseId,
        page: 1,
        size: 1000,
      });
      const rows = extractList<WarehouseRequestRow>(response);
      setFranchiseRequests(rows);

      const resolvedWarehouseId = Number(warehouseId);
      if (Number.isFinite(resolvedWarehouseId) && resolvedWarehouseId > 0) {
        try {
          const warehouseItemsResponse = await getItemsByWarehouse(resolvedWarehouseId);
          const warehouseItems = extractList<any>(warehouseItemsResponse);
          const nextStockSnapshot = warehouseItems.reduce<Record<string, number>>(
            (acc, item) => {
              const key = toItemKey(item?.name);
              if (!key) return acc;

              const quantityValue = Number(item?.quantity ?? 0);
              const safeQuantity = Number.isFinite(quantityValue)
                ? Math.max(0, quantityValue)
                : 0;

              acc[key] = Number((acc[key] ?? 0) + safeQuantity);
              return acc;
            },
            {},
          );
          setWarehouseStockSnapshot(nextStockSnapshot);
        } catch (warehouseError) {
          console.error("Load warehouse stock snapshot failed:", warehouseError);
          setWarehouseStockSnapshot({});
        }
      } else {
        setWarehouseStockSnapshot({});
      }
    } catch (error) {
      console.error("Load request by warehouseId failed:", error);
      setFranchiseRequests([]);
      setWarehouseStockSnapshot({});
    } finally {
      setLoadingFranchiseRequests(false);
    }
  };

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await getSuppliers({ page: 0, size: 100 });
      const rows = extractList<any>(response).map(normalizeSupplier);
      debugRequestSupplier("loadSuppliers.response", response);
      debugRequestSupplier(
        "loadSuppliers.normalized",
        rows.map((item) => ({
          id: item.id,
          name: item.name,
          requestSupplierId: item.requestSupplierId,
        })),
      );
      setSuppliers(rows.filter((s) => s.id));
    } catch (error) {
      console.error("Load suppliers failed:", error);
      debugRequestSupplier("loadSuppliers.error", error);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadSupplierProducts = async (supplierId: string) => {
    if (!supplierId) {
      debugRequestSupplier("loadSupplierProducts.skip.emptySupplierId", { supplierId });
      setSupplierProducts([]);
      return;
    }

    setLoadingSupplierProducts(true);
    try {
      const response = await getSupplierProducts(supplierId, { page: 0, size: 100 });
      const rows = extractList<any>(response).map(normalizeSupplierProduct);
      debugRequestSupplier("loadSupplierProducts.input", { supplierId });
      debugRequestSupplier("loadSupplierProducts.response", response);
      debugRequestSupplier(
        "loadSupplierProducts.normalized",
        rows.map((item) => ({
          id: item.id,
          name: item.name,
          supplierId: item.supplierId,
          pricePerUnit: item.pricePerUnit,
        })),
      );
      setSupplierProducts(rows.filter((p) => p.id));
    } catch (error) {
      console.error("Load supplier products failed:", error);
      debugRequestSupplier("loadSupplierProducts.error", error);
      setSupplierProducts([]);
    } finally {
      setLoadingSupplierProducts(false);
    }
  };

  useEffect(() => {
    loadFranchiseRequests();
  }, [warehouseId]);

  useEffect(() => {
    if (activeTab === "supplier") {
      loadSuppliers();
    }
  }, [activeTab]);

  useEffect(() => {
    setSelectedProductId("");
    const selectedSupplier =
      suppliers.find((supplier) => supplier.id === selectedSupplierId) || null;
    debugRequestSupplier("supplier.changed", {
      selectedSupplierId,
      selectedSupplier,
    });
    loadSupplierProducts(selectedSupplierId);
  }, [selectedSupplierId, suppliers]);

  const resolveWarehouseItemForSync = async (
    itemName: string | undefined,
  ): Promise<WarehouseItemOption | null> => {
    const resolvedWarehouseId = Number(warehouseId);
    if (!Number.isFinite(resolvedWarehouseId) || resolvedWarehouseId <= 0) {
      return null;
    }

    const normalizedName = String(itemName || "").trim().toLowerCase();
    if (!normalizedName) {
      return null;
    }

    try {
      const response = await getItemsByWarehouse(resolvedWarehouseId);
      const items = extractList<any>(response);
      const matched = items.find(
        (item) => String(item?.name || "").trim().toLowerCase() === normalizedName,
      );

      if (!matched) return null;
      return {
        ...matched,
      };
    } catch (error) {
      console.error("Resolve warehouse item for sync failed:", error);
      return null;
    }
  };

  const resolveCategoryIdForWarehouseItem = async (
    matchedItem: WarehouseItemOption | null,
    resolvedWarehouseId: number,
  ): Promise<number> => {
    const rawCategoryId = matchedItem?.categoryId ?? matchedItem?.category?.id;
    const parsedCategoryId = Number(rawCategoryId);
    if (Number.isFinite(parsedCategoryId) && parsedCategoryId > 0) {
      return parsedCategoryId;
    }

    if (!Number.isFinite(resolvedWarehouseId) || resolvedWarehouseId <= 0) {
      return 0;
    }

    try {
      const categoryRes = await getCategories(resolvedWarehouseId);
      const categories = extractList<any>(categoryRes);
      if (categories.length === 0) return 0;

      const targetCategoryName = String(
        matchedItem?.categoryName ?? matchedItem?.category?.name ?? "",
      )
        .trim()
        .toLowerCase();

      const matchedCategory =
        (targetCategoryName
          ? categories.find(
              (c) =>
                String(c?.name || "")
                  .trim()
                  .toLowerCase() === targetCategoryName,
            )
          : null) ??
        categories.find((c) => Number(c?.id) > 0) ??
        categories[0];

      const fallbackCategoryId = Number(matchedCategory?.id);
      return Number.isFinite(fallbackCategoryId) ? fallbackCategoryId : 0;
    } catch (error) {
      console.error("Resolve categoryId for warehouse item failed:", error);
      return 0;
    }
  };

  const deductWarehouseStockAfterAccepted = async (
    matchedItem: WarehouseItemOption | null,
    approvedQty: number,
    fallbackUnit: string,
  ) => {
    if (!matchedItem?.id) {
      throw new Error("Khong tim thay item warehouse de tru kho.");
    }

    const itemId = Number(matchedItem.id);
    if (!Number.isFinite(itemId) || itemId <= 0) {
      throw new Error(`itemId warehouse khong hop le: ${String(matchedItem.id)}`);
    }

    const resolvedWarehouseId = Number(warehouseId);

    const currentQty = Number(matchedItem.quantity ?? 0);
    const manualDeductQty =
      Math.abs(approvedQty) * WAREHOUSE_DEDUCT_MULTIPLIER_AFTER_ACCEPT;
    const nextQty = Math.max(0, currentQty - manualDeductQty);
    const normalizedCategoryId = await resolveCategoryIdForWarehouseItem(
      matchedItem,
      resolvedWarehouseId,
    );
    const normalizedUnit = normalizeWarehouseUnit(
      matchedItem.unit || fallbackUnit,
      "GRAM",
    );

    const payload: Record<string, unknown> = {
      name: String(matchedItem.name || ""),
      quantity: nextQty,
      unit: normalizedUnit,
      price: Number(matchedItem.price ?? 0),
      supplierName: String(matchedItem.supplierName || "WAREHOUSE_INTERNAL"),
      status: String(matchedItem.status || "ACTIVE"),
      reorderLevel: Number(matchedItem.reorderLevel ?? 0),
      description: String(matchedItem.description || ""),
      categoryId: normalizedCategoryId || 0,
    };

    try {
      await updateItem(itemId, payload);
    } catch {
      const fallbackPayload: Record<string, unknown> = {
        ...matchedItem,
        quantity: nextQty,
        unit: normalizedUnit,
        categoryId: normalizedCategoryId || 0,
      };
      delete fallbackPayload.id;
      await updateItem(itemId, fallbackPayload);
    }
  };

  const syncFranchiseInventoryAfterAccepted = async (request: WarehouseRequestRow) => {
    const resolvedFranchiseId = String(request.franchiseId ?? "").trim();
    if (!resolvedFranchiseId || resolvedFranchiseId === "0") {
      return;
    }

    const matchedItem = await resolveWarehouseItemForSync(request.itemName);
    const targetIngredientName =
      request.itemName || matchedItem?.name || "UNKNOWN_ITEM";
    const requestQuantity = Number(request.quantity ?? 0);
    const syncQuantity = requestQuantity > 0 ? requestQuantity : Math.abs(requestQuantity) || 0.01;
    const normalizedUnit = normalizeWarehouseUnit(
      request.unit || matchedItem?.unit,
      "GRAM",
    );

    await importOrAddStockByFranchise(resolvedFranchiseId, {
      ingredientId:
        request.itemId ??
        matchedItem?.id ??
        "00000000-0000-0000-0000-000000000000",
      ingredientName: targetIngredientName,
      quantityToAdd: syncQuantity,
      unit: normalizedUnit,
      supplierInfo: `WAREHOUSE_${warehouseId || "0"}`,
      expirationDate: toLocalDateOnly(),
      reason: `REQUEST_${String(request.id ?? 0)}_ACCEPTED_MANUAL_SYNC`,
    });

    await deductWarehouseStockAfterAccepted(
      matchedItem,
      syncQuantity,
      normalizedUnit,
    );
  };

  const validateStockFromSnapshot = (request: WarehouseRequestRow) => {
    const itemKey = toItemKey(request.itemName);
    const requestedQty = toPositiveQuantity(request.quantity);
    const availableQty = Number(warehouseStockSnapshot[itemKey] ?? 0);
    const safeAvailableQty = Number.isFinite(availableQty) ? Math.max(0, availableQty) : 0;

    return {
      canApprove: Boolean(itemKey) && requestedQty > 0 && safeAvailableQty >= requestedQty,
      requestedQty,
      availableQty: safeAvailableQty,
    };
  };

  const validateStockFromLatestWarehouseData = async (request: WarehouseRequestRow) => {
    const requestedQty = toPositiveQuantity(request.quantity);
    if (requestedQty <= 0) {
      return {
        canApprove: false,
        requestedQty: 0,
        availableQty: 0,
      };
    }

    const matchedItem = await resolveWarehouseItemForSync(request.itemName);
    const availableQty = Number(matchedItem?.quantity ?? 0);
    const safeAvailableQty = Number.isFinite(availableQty) ? Math.max(0, availableQty) : 0;

    return {
      canApprove: safeAvailableQty >= requestedQty,
      requestedQty,
      availableQty: safeAvailableQty,
    };
  };

  const handleApproveReject = async (
    request: WarehouseRequestRow,
    action: "ACCEPTED" | "REJECTED",
  ) => {
    if (handlingRequestAction) return;

    const requestId = request.id != null ? String(request.id) : "";
    if (!requestId) {
      alert("Khong tim thay requestId.");
      return;
    }

    setHandlingRequestAction(true);
    try {
      let reason = "";

      if (action === "ACCEPTED" && isFranchiseRequest(request)) {
        const validation = await validateStockFromLatestWarehouseData(request);
        if (!validation.canApprove) {
          alert(
            `Khong du ton kho de ACCEPT request nay. Can ${validation.requestedQty}, ton kho hien tai ${validation.availableQty}.`,
          );
          await loadFranchiseRequests();
          return;
        }
      }

      if (action === "REJECTED") {
        reason = (window.prompt("Nhap ly do tu choi request:", "") || "").trim();
        if (!reason) {
          alert("Ban can nhap ly do khi REJECT.");
          return;
        }
      }

      await updateRequestStatus(requestId, action, reason);

      if (action === "ACCEPTED" && isFranchiseRequest(request)) {
        try {
          await syncFranchiseInventoryAfterAccepted(request);
          alert(`Request ${action} thanh cong va da sync inventory cho franchise.`);
        } catch (syncError: any) {
          const statusCode = syncError?.status ? ` [status: ${syncError.status}]` : "";
          alert(
            `Request ${action} thanh cong, nhung sync inventory that bai: ${
              syncError?.message || "Unknown error"
            }${statusCode}`,
          );
        }
      } else {
        alert(`Request ${action} thanh cong.`);
      }
      await loadFranchiseRequests();
    } catch (error: any) {
      alert(error?.message || "Duyet request that bai.");
    } finally {
      setHandlingRequestAction(false);
    }
  };

  const submitSupplierRequest = async () => {
    debugRequestSupplier("submitSupplierRequest.clicked", {
      warehouseId,
      selectedSupplierId,
      selectedProductId,
      quantity,
    });

    const resolvedWarehouseId = Number(warehouseId);
    if (!Number.isFinite(resolvedWarehouseId) || resolvedWarehouseId <= 0) {
      debugRequestSupplier("submitSupplierRequest.block.invalidWarehouseId", {
        warehouseId,
        resolvedWarehouseId,
      });
      alert("Khong tim thay warehouseId.");
      return;
    }
    if (!selectedSupplierId) {
      debugRequestSupplier("submitSupplierRequest.block.missingSupplier", {
        selectedSupplierId,
      });
      alert("Vui long chon supplier.");
      return;
    }
    if (!selectedProduct) {
      debugRequestSupplier("submitSupplierRequest.block.missingProduct", {
        selectedProductId,
        supplierProductsCount: supplierProducts.length,
      });
      alert("Vui long chon item.");
      return;
    }
    if (!quantity || quantity <= 0) {
      debugRequestSupplier("submitSupplierRequest.block.invalidQuantity", { quantity });
      alert("So luong phai lon hon 0.");
      return;
    }

    const selectedSupplier =
      suppliers.find((supplier) => supplier.id === selectedSupplierId) || null;
    const resolvedSupplierId =
      selectedSupplier?.requestSupplierId ||
      selectedProduct?.supplierId ||
      resolveSupplierUuid(selectedSupplier) ||
      resolveSupplierUuid(selectedSupplier?.raw) ||
      resolveSupplierUuid(selectedProduct) ||
      resolveSupplierUuid(selectedProduct?.raw) ||
      normalizeUuid(selectedSupplierId);

    let safeSupplierId = normalizeUuid(resolvedSupplierId);

    if (!safeSupplierId) {
      try {
        const supplierDetailResponse = await getSupplierById(selectedSupplierId);
        const fromSupplierDetail =
          resolveSupplierUuid(supplierDetailResponse) ||
          resolveSupplierUuid((supplierDetailResponse as any)?.data) ||
          resolveSupplierUuid((supplierDetailResponse as any)?.result);

        debugRequestSupplier("submitSupplierRequest.supplierDetailLookup", {
          selectedSupplierId,
          supplierDetailResponse,
          fromSupplierDetail,
        });

        if (fromSupplierDetail) {
          safeSupplierId = fromSupplierDetail;
        }
      } catch (lookupError) {
        debugRequestSupplier("submitSupplierRequest.supplierDetailLookup.error", {
          selectedSupplierId,
          lookupError,
        });
      }
    }

    debugRequestSupplier("submitSupplierRequest.resolveSupplierId", {
      selectedSupplierId,
      selectedSupplier,
      selectedProduct,
      resolvedSupplierId,
      safeSupplierId,
    });

    if (!safeSupplierId) {
      debugRequestSupplier("submitSupplierRequest.block.unresolvedSupplierId", {
        selectedSupplierId,
        selectedSupplier,
        selectedProduct,
      });
      alert("Khong resolve duoc supplierId UUID. Vui long xem log RequestSupplierDebug.");
      return;
    }

    const normalizedItemName = String(selectedProduct.name || "").trim();
    if (!normalizedItemName) {
      debugRequestSupplier("submitSupplierRequest.block.invalidItemName", {
        selectedProduct,
      });
      alert("Item name khong hop le.");
      return;
    }
    const normalizedUnit = normalizeWarehouseUnit(selectedProduct.unit, "GRAM");

    const now = new Date().toISOString();
    setSendingSupplierRequest(true);
    try {
      const requestPayload = {
        id: 0,
        requestType: "IMPORT",
        status: "PENDING",
        rejectReason: "N/A",
        handledBy: 0,
        createdDate: now,
        updatedDate: now,
        franchiseId: SUPPLIER_FLOW_FRANCHISE_PLACEHOLDER_ID,
        supplierId: safeSupplierId,
        quantity: Number(quantity),
        itemName: normalizedItemName,
        unit: normalizedUnit,
        totalPrice: Number(totalPrice ?? 0),
        warehouseId: resolvedWarehouseId,
      };

      debugRequestSupplier("submitSupplierRequest.payload", requestPayload);
      await createWarehouseServiceRequest(requestPayload);
      alert("Gui request den supplier thanh cong.");
      setSelectedProductId("");
      setQuantity(1);
    } catch (error: any) {
      debugRequestSupplier("submitSupplierRequest.error", error);
      alert(error?.message || "Gui request den supplier that bai.");
    } finally {
      setSendingSupplierRequest(false);
    }
  };

  const filteredData = useMemo(
    () =>
      franchiseRequests
        .filter((r) => isFranchiseRequest(r))
        .map((raw) => ({ raw, display: normalizeRow(raw) }))
        .filter(({ display }) => filter === "ALL" || display.status === filter),
    [franchiseRequests, filter],
  );

  return (
    <div className="request-page-wrapper">
      <div className="container-max">
        <div className="top-nav-bar">
          <button
            className="btn-back-link"
            onClick={() => navigate(`/admin/warehouse/item?warehouseId=${warehouseId}`)}
          >
            {"<- Back to Warehouse Items"}
          </button>
        </div>

        <div className="request-tab-switch">
          <button
            className={`filter-btn ${activeTab === "franchise" ? "active" : ""}`}
            onClick={() => setTab("franchise")}
          >
            Request Franchies
          </button>
          <button
            className={`filter-btn ${activeTab === "supplier" ? "active" : ""}`}
            onClick={() => setTab("supplier")}
          >
            Request Supplier
          </button>
        </div>

        {activeTab === "franchise" ? (
          <>
            <div className="page-header">
              <h1>Request Franchies</h1>
            </div>

            <div className="filter-group">
              {["ALL", "PENDING", "ACCEPTED", "REJECTED"].map((s) => (
                <button
                  key={s}
                  className={`filter-btn ${filter === s ? "active" : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="table-card">
              <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Request ID</th>
                      <th>Item Name</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Manager</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingFranchiseRequests ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center" }}>
                          Loading...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center" }}>
                          No requests found.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map(({ raw, display }, index) => {
                        const stockValidation = validateStockFromSnapshot(raw);
                        const hideApproveButton =
                          display.status === "PENDING" && !stockValidation.canApprove;

                        return (
                          <tr key={`${display.id}-${index}`}>
                            <td>{index + 1}</td>
                            <td>{display.id}</td>
                            <td>
                              <strong>{display.itemName}</strong>
                            </td>
                            <td>
                              <span className={`badge-type ${String(display.requestType || "").toLowerCase()}`}>
                                {display.requestType}
                              </span>
                            </td>
                            <td>{display.quantity}</td>
                            <td>{display.performedBy}</td>
                            <td>
                              <span className={`status-pill ${String(display.status || "").toLowerCase()}`}>
                                {display.status}
                              </span>
                              {display.status === "REJECTED" && display.rejectReason ? (
                                <div style={{ color: "#c62828", fontSize: "12px", marginTop: "4px" }}>
                                  Reason: {display.rejectReason}
                                </div>
                              ) : null}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {display.status === "PENDING" ? (
                                <div>
                                  <div className="action-btns-flex">
                                    {!hideApproveButton ? (
                                      <button
                                        className="btn-approve"
                                        disabled={handlingRequestAction}
                                        onClick={() => handleApproveReject(raw, "ACCEPTED")}
                                      >
                                        ACCEPT
                                      </button>
                                    ) : null}
                                    <button
                                      className="btn-reject"
                                      disabled={handlingRequestAction}
                                      onClick={() => handleApproveReject(raw, "REJECTED")}
                                    >
                                      REJECT
                                    </button>
                                  </div>
                                  {hideApproveButton ? (
                                    <div className="request-stock-warning">
                                      Insufficient stock ({stockValidation.availableQty}/
                                      {stockValidation.requestedQty})
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="page-header">
              <h1>Request Supplier</h1>
            </div>
            <div className="table-card supplier-request-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    disabled={loadingSuppliers}
                  >
                    <option value="">{loadingSuppliers ? "Loading suppliers..." : "Select supplier"}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.materialType ? ` - ${s.materialType}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Item From Supplier</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    disabled={!selectedSupplierId || loadingSupplierProducts}
                  >
                    <option value="">
                      {!selectedSupplierId
                        ? "Select supplier first"
                        : loadingSupplierProducts
                        ? "Loading items..."
                        : "Select item"}
                    </option>
                    {supplierProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.unit ? ` (${p.unit})` : ""} - {p.pricePerUnit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>

                <div className="form-field">
                  <label>Price Per Unit</label>
                  <input
                    type="text"
                    value={selectedProduct ? String(selectedProduct.pricePerUnit) : "-"}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Total Price</label>
                  <input type="text" value={String(totalPrice)} readOnly />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-save"
                  onClick={submitSupplierRequest}
                  disabled={sendingSupplierRequest}
                >
                  {sendingSupplierRequest ? "Sending..." : "Send Request To Supplier"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
