import { apiUtils } from "@/api/axios";
import type { AssignWarehousePayload, FranchiseWarehouseMapping } from "@/types/warehouseMapping";

const BASE = "/api/franchise-service/franchise-warehouse";

export async function getMappingsByFranchise(franchiseId: string): Promise<FranchiseWarehouseMapping | null> {
  try {
    const response = await apiUtils.get<FranchiseWarehouseMapping | { data?: FranchiseWarehouseMapping }>(
      `${BASE}/franchise/${franchiseId}`
    );

    if (response && typeof response === "object" && "data" in response) {
      return response.data ?? null;
    }

    if (response && typeof response === "object" && "warehouseId" in response) {
      return response as FranchiseWarehouseMapping;
    }

    return null;
  } catch {
    return null;
  }
}

export async function assignWarehouse(franchiseId: string, payload: AssignWarehousePayload): Promise<unknown> {
  return apiUtils.put(`${BASE}/franchise/${franchiseId}`, payload);
}
