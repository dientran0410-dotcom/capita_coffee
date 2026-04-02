import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Minus, Package, Plus, RefreshCw } from "lucide-react";
import ManagerFranchiseSelector from "@/components/manager/ManagerFranchiseSelector";
import { useAuth } from "@/context/AuthContext";
import { useManagerBranchSelection } from "@/hooks/useManagerBranchSelection";
import { getErrorMessage } from "@/utils/errorMessage";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import type { MockInventoryItem, WarehouseDetail, WarehouseItem } from "@/types/managerInventory";
import {
  batchDeductIngredientStock,
  createWarehouseRequest,
  getItemsByWarehouseId,
  getInventoryByFranchiseId,
  getWarehouseById,
  getWarehousesByFranchiseId,
} from "@/services/managerInventoryService";

const badgeClassByStatus: Record<string, string> = {
  IN_STOCK: "bg-green-100 text-green-700",
  LOW_STOCK: "bg-yellow-100 text-yellow-700",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
};

const selectableItemStatuses = new Set(["ACTIVE", "AVAILABLE"]);
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

export function InventoryManagement() {
  const { user } = useAuth();
  const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || "";

  const {
    branches,
    selectedBranchId,
    loading: loadingBranches,
    error: branchError,
    setSelectedBranchId,
  } = useManagerBranchSelection(authFranchiseId as string);

  const [franchiseId, setFranchiseId] = useState<string>("");
  const [franchiseSource, setFranchiseSource] = useState<string>("");
  const [inventory, setInventory] = useState<MockInventoryItem[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState<boolean>(true);

  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState<boolean>(false);
  const [isWarehouseLoading, setIsWarehouseLoading] = useState<boolean>(false);
  const [isItemsLoading, setIsItemsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [mappedWarehouses, setMappedWarehouses] = useState<WarehouseDetail[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [stockAdjustmentItem, setStockAdjustmentItem] = useState<MockInventoryItem | null>(null);
  const [stockAdjustmentQuantity, setStockAdjustmentQuantity] = useState<string>("1");
  const [stockAdjustmentError, setStockAdjustmentError] = useState<string>("");
  const [isAdjustingStock, setIsAdjustingStock] = useState<boolean>(false);

  useEffect(() => {
    if (branchError) {
      showErrorToast(branchError);
    }
  }, [branchError]);

  useEffect(() => {
    if (errorMessage) {
      showErrorToast(errorMessage);
    }
  }, [errorMessage]);

  const selectedItem = useMemo(
    () => warehouseItems.find((item) => item.id === selectedItemId) ?? null,
    [warehouseItems, selectedItemId]
  );

  const totalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    return Number(selectedItem.price || 0) * Number(quantity || 0);
  }, [selectedItem, quantity]);

  const stats = useMemo(() => {
    const inStock = inventory.filter((i) => i.status === "IN_STOCK").length;
    const lowStock = inventory.filter((i) => i.status === "LOW_STOCK").length;
    const outOfStock = inventory.filter((i) => i.status === "OUT_OF_STOCK").length;
    return { inStock, lowStock, outOfStock, total: inventory.length };
  }, [inventory]);

  const resetRequestState = () => {
    setIsRequestPanelOpen(false);
    setMappedWarehouses([]);
    setSelectedWarehouseId(null);
    setWarehouseItems([]);
    setSelectedItemId(null);
    setQuantity(1);
  };

  const resetStockAdjustmentState = () => {
    setStockAdjustmentItem(null);
    setStockAdjustmentQuantity("1");
    setStockAdjustmentError("");
    setIsAdjustingStock(false);
  };

  const loadInventory = async (resolvedFranchiseId: string) => {
    setIsInventoryLoading(true);
    setErrorMessage("");
    try {
      const data = await getInventoryByFranchiseId(resolvedFranchiseId);
      setInventory(data);
    } catch (error) {
      console.error("[InventoryManagement] Failed to load inventory:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsInventoryLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (loadingBranches) {
        return;
      }

      if (selectedBranchId) {
        if (!mounted) return;
        setFranchiseId(selectedBranchId);
        setFranchiseSource("manager-franchise");
        resetRequestState();
        resetStockAdjustmentState();
        await loadInventory(selectedBranchId);
        return;
      }

      if (!mounted) return;
      setFranchiseId("");
      setFranchiseSource("");
      resetRequestState();
      resetStockAdjustmentState();
      setInventory([]);
      setIsInventoryLoading(false);
      setErrorMessage("Khong co franchise LIVE de quan ly.");
    };

    init();
    return () => {
      mounted = false;
    };
  }, [selectedBranchId, loadingBranches]);

  const handleOpenCreateRequest = async () => {
    if (!franchiseId) {
      setErrorMessage("Khong co franchiseId de tai warehouse mapping.");
      return;
    }

    setIsWarehouseLoading(true);
    setErrorMessage("");
    setIsRequestPanelOpen(true);

    try {
      const mappings = await getWarehousesByFranchiseId(franchiseId);
      const activeMappings = mappings.filter(
        (item) => item.status?.toUpperCase() === "ACTIVE" && item.warehouseId
      );

      const warehouseIds = Array.from(
        new Set(
          activeMappings
            .map((item) => Number(item.warehouseId))
            .filter((id) => Number.isFinite(id) && id > 0)
        )
      );

      const warehouseResults = await Promise.all(warehouseIds.map((id) => getWarehouseById(id)));
      const validWarehouses = warehouseResults.filter(Boolean) as WarehouseDetail[];

      setMappedWarehouses(validWarehouses);
      setSelectedWarehouseId(null);
      setWarehouseItems([]);
      setSelectedItemId(null);
      setQuantity(1);

      if (validWarehouses.length === 0) {
        setErrorMessage("Manager chua duoc mapping warehouse ACTIVE nao.");
      }
    } catch (error) {
      console.error("[InventoryManagement] Failed to load mapped warehouses:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsWarehouseLoading(false);
    }
  };

  const handleSelectWarehouse = async (warehouseId: number) => {
    setSelectedWarehouseId(warehouseId);
    setSelectedItemId(null);
    setQuantity(1);
    setWarehouseItems([]);
    setIsItemsLoading(true);
    setErrorMessage("");

    try {
      const items = await getItemsByWarehouseId(warehouseId);
      const activeItems = items.filter((item) =>
        selectableItemStatuses.has((item.status || "").toUpperCase())
      );
      setWarehouseItems(activeItems);
    } catch (error) {
      console.error("[InventoryManagement] Failed to load warehouse items:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsItemsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!franchiseId) {
      setErrorMessage("Khong co franchiseId de tao request.");
      return;
    }
    if (!selectedWarehouseId) {
      setErrorMessage("Vui long chon warehouse.");
      return;
    }
    if (!selectedItem) {
      setErrorMessage("Vui long chon item.");
      return;
    }
    if (!quantity || quantity <= 0) {
      setErrorMessage("Quantity phai lon hon 0.");
      return;
    }
    if (selectedItem && quantity > (selectedItem.quantity ?? 0)) {
      setErrorMessage("Quantity không được vượt quá Available Stock.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await createWarehouseRequest({
        warehouseId: selectedWarehouseId,
        requestType: "IMPORT",
        status: "PENDING",
        franchiseId,
        supplierId: ZERO_UUID,
        quantity,
        itemName: selectedItem.name,
        unit: selectedItem.unit,
        totalPrice,
      });

      globalThis.alert("Tao request thanh cong.");
      resetRequestState();
    } catch (error) {
      console.error("[InventoryManagement] Failed to create request:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStockAdjustment = (item: MockInventoryItem) => {
    setStockAdjustmentItem(item);
    setStockAdjustmentQuantity("1");
    setStockAdjustmentError("");
  };

  const handleCloseStockAdjustment = () => {
    if (isAdjustingStock) {
      return;
    }

    resetStockAdjustmentState();
  };

  const handleSubmitStockAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stockAdjustmentItem) {
      return;
    }
    if (!franchiseId) {
      setStockAdjustmentError("Không có franchiseId để cập nhật tồn kho.");
      return;
    }

    const quantityToDeduct = Number(stockAdjustmentQuantity);
    if (!Number.isFinite(quantityToDeduct) || quantityToDeduct <= 0) {
      setStockAdjustmentError("Quantity phải lớn hơn 0.");
      return;
    }

    if (quantityToDeduct > stockAdjustmentItem.quantity) {
      setStockAdjustmentError("Quantity không được vượt quá số lượng tồn hiện tại.");
      return;
    }

    setIsAdjustingStock(true);
    setStockAdjustmentError("");

    try {
      await batchDeductIngredientStock(franchiseId, [
        {
          ingredientId: stockAdjustmentItem.ingredientId,
          ingredientName: stockAdjustmentItem.ingredientName,
          quantity: quantityToDeduct,
          unit: stockAdjustmentItem.unit,
        },
      ]);

      showSuccessToast(
        `Đã trừ ${quantityToDeduct} ${stockAdjustmentItem.unit} của ${stockAdjustmentItem.ingredientName}.`
      );
      resetStockAdjustmentState();
      await loadInventory(franchiseId);
    } catch (error) {
      console.error("[InventoryManagement] Failed to update stock quantity:", error);
      setStockAdjustmentError(getErrorMessage(error));
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const handleStockAdjustmentQuantityChange = (rawValue: string) => {
    if (!stockAdjustmentItem) {
      setStockAdjustmentQuantity(rawValue);
      return;
    }

    if (rawValue === "") {
      setStockAdjustmentQuantity("");
      if (stockAdjustmentError) {
        setStockAdjustmentError("");
      }
      return;
    }

    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      return;
    }

    const maxQuantity = Number(stockAdjustmentItem.quantity);
    if (parsedValue > maxQuantity) {
      setStockAdjustmentQuantity(String(maxQuantity));
      setStockAdjustmentError(`Số lượng tối đa có thể nhập là ${maxQuantity}.`);
      return;
    }

    if (parsedValue <= 0) {
      setStockAdjustmentQuantity(rawValue);
      setStockAdjustmentError("Quantity phải lớn hơn 0.");
      return;
    }

    setStockAdjustmentQuantity(rawValue);
    if (stockAdjustmentError) {
      setStockAdjustmentError("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Franchise ID: <span className="font-mono">{franchiseId || "N/A"}</span>
            {franchiseSource ? (
              <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                source: {franchiseSource}
              </span>
            ) : null}
          </p>

          <div className="max-w-md">
            <ManagerFranchiseSelector
              branches={branches}
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              loading={loadingBranches}
              helperText="Switch franchise to load that franchise's inventory and warehouse request flow."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (franchiseId) {
                loadInventory(franchiseId);
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            disabled={isInventoryLoading || !franchiseId}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenCreateRequest}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
            disabled={isWarehouseLoading || !franchiseId}
          >
            <Plus className="h-4 w-4" />
            Create Request
          </button>
        </div>
      </div>

      {branchError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {branchError}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs text-green-700">In Stock</p>
          <p className="mt-1 text-2xl font-bold text-green-800">{stats.inStock}</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-xs text-yellow-700">Low Stock</p>
          <p className="mt-1 text-2xl font-bold text-yellow-800">{stats.lowStock}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-700">Out of Stock</p>
          <p className="mt-1 text-2xl font-bold text-red-800">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-base font-semibold text-gray-900">Current Inventory</h2>
            <p className="text-xs text-gray-500">
              Use <span className="font-semibold text-gray-700">Update Quantity</span> to deduct stock after the
              manager checks inventory at the end of the day.
            </p>
          </div>
        </div>
        {isInventoryLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Ingredient</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Min Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        {item.ingredientName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.unit}</td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-700">{item.minStock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          badgeClassByStatus[item.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleOpenStockAdjustment(item)}
                        disabled={!item.ingredientId || item.quantity <= 0}
                        className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Minus className="h-3.5 w-3.5" />
                        Update Quantity
                      </button>
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      No inventory data.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stockAdjustmentItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Update Quantity</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manager nhập số lượng cần trừ sau kiểm kê cuối ngày. FE sẽ gọi endpoint{" "}
                <span className="font-mono text-gray-700">batch-deduct</span> theo franchise hiện tại.
              </p>
            </div>

            <form className="space-y-4 px-5 py-4" onSubmit={handleSubmitStockAdjustment}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Ingredient</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {stockAdjustmentItem.ingredientName}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Current Quantity</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {stockAdjustmentItem.quantity} {stockAdjustmentItem.unit}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="stock-adjustment-quantity" className="mb-1 block text-sm font-medium text-gray-700">
                  Quantity to deduct
                </label>
                <input
                  id="stock-adjustment-quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={stockAdjustmentItem.quantity}
                  value={stockAdjustmentQuantity}
                  onChange={(event) => handleStockAdjustmentQuantityChange(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Ví dụ: 1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tối đa: {stockAdjustmentItem.quantity} {stockAdjustmentItem.unit}
                </p>
              </div>

              {stockAdjustmentError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {stockAdjustmentError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseStockAdjustment}
                  disabled={isAdjustingStock}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingStock}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  <Minus className="h-4 w-4" />
                  {isAdjustingStock ? "Updating..." : "Confirm Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isRequestPanelOpen ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Create Warehouse Request</h2>
          <p className="mt-1 text-sm text-gray-500">
            Buoc 1: lay warehouse mapping theo franchise, Buoc 2: chon warehouse, Buoc 3: chon item
            va so luong de submit request.
          </p>

          {isWarehouseLoading ? (
            <div className="mt-4 text-sm text-gray-500">Loading mapped warehouses...</div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="warehouse-select" className="mb-1 block text-sm font-medium text-gray-700">
                Warehouse
              </label>
              <select
                id="warehouse-select"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={selectedWarehouseId ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setSelectedWarehouseId(null);
                    setWarehouseItems([]);
                    setSelectedItemId(null);
                    return;
                  }
                  handleSelectWarehouse(Number(value));
                }}
                disabled={isWarehouseLoading || mappedWarehouses.length === 0}
              >
                <option value="">Select warehouse</option>
                {mappedWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} (#{warehouse.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="item-select" className="mb-1 block text-sm font-medium text-gray-700">
                Item
              </label>
              <select
                id="item-select"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={selectedItemId ?? ""}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                disabled={isItemsLoading || warehouseItems.length === 0}
              >
                <option value="">Select item</option>
                {warehouseItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit}) - stock {item.quantity} - price {item.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isItemsLoading ? (
            <div className="mt-3 text-sm text-gray-500">Loading warehouse items...</div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="quantity-input" className="mb-1 block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                id="quantity-input"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  if (val < 1) {
                    setQuantity(1);
                    setErrorMessage("Quantity phải lớn hơn 0.");
                    return;
                  }

                  const available = selectedItem?.quantity ?? 0;
                  if (selectedItem && val > available) {
                    setQuantity(available);
                    setErrorMessage("Quantity không được vượt quá Available Stock.");
                    return;
                  }

                  setErrorMessage("");
                  setQuantity(val);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              {errorMessage ? (
                <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
              ) : null}
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Available Stock</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{selectedItem?.quantity ?? "--"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Total Price</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{totalPrice.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={() => setIsRequestPanelOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <div className="mb-1 flex items-center gap-1 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              Backend contract note
            </div>
            Field <span className="font-mono">supplierId</span> dang gui placeholder{" "}
            <span className="font-mono">{ZERO_UUID}</span> cho luong franchise - warehouse.
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
        <div className="flex items-center gap-1 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          API flow implemented
        </div>
        <p className="mt-1">
          GET franchise-warehouse by franchiseId - GET warehouse detail by id - GET items by warehouseId -
          POST create request.
        </p>
      </div>
    </div>
  );
}

export default InventoryManagement;
