export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface MockInventoryItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  minStock: number;
  status: InventoryStockStatus;
}

export interface BatchDeductIngredientItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface FranchiseWarehouseMappingItem {
  id: string;
  warehouseId: string;
  status: string;
  assignedAt?: string;
}

export interface WarehouseDetail {
  id: number;
  name: string;
  address: string;
  status: string;
}

export interface WarehouseItem {
  id: number;
  name: string;
  unit: string;
  description?: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  supplierName?: string;
  status: string;
  categoryName?: string;
  imageUrls?: string[];
}

export interface CreateWarehouseRequestPayload {
  id?: number;
  warehouseId: number;
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
}

export interface ResolvedFranchiseId {
  franchiseId: string;
  source: "user" | "storage" | "token" | "staff-mapping" | "manager-franchise";
  staffId?: string;
}
