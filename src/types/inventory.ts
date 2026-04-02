export type InventoryStatus = "ACTIVE" | "INACTIVE";

export type UnitOption = "GRAM" | "KILOGRAM" | "MILLILITER" | "LITER" | "PIECE";

export type InventoryItem = {
  id: number;
  name: string;
  description?: string;
  unit: UnitOption;
  currentQuantity: number;
  reorderThreshold: number;
  status: InventoryStatus;
  stockoutRisk?: string;
  createdDate?: string;
  updatedDate?: string;
};

export type InventoryCategory = {
  id: number;
  name: string;
  status: InventoryStatus;
  description?: string;
};

export type InventoryLocation = {
  id: number;
  name: string;
  status: InventoryStatus;
  address?: string;
};

export type InventoryRequestType = "ADD" | "DEDUCT" | "TRANSFER";
export type InventoryRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type InventoryRequest = {
  id: number;
  ingredientId?: number;
  ingredientName?: string;
  requestType: InventoryRequestType;
  quantity: number;
  reason?: string;
  performedBy?: string;
  status: InventoryRequestStatus;
  createdAt?: string;
};

export type InventoryLog = {
  id: number;
  ingredientName: string;
  actionType: InventoryRequestType | "EDIT";
  quantityChanged: number;
  performedBy?: string;
  reason?: string;
  timestamp?: string;
};
