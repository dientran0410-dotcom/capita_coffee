export interface FranchiseWarehouseMapping {
  id: string;
  warehouseId: string;
  status?: string;
  assignedAt?: string;
  franchise?: {
    franchiseName?: string;
    franchiseCode?: string;
  };
}

export interface AssignWarehousePayload {
  warehouseId: string;
}
