import { apiUtils } from "@/api/axios";
import type {
  CreateSupplierRequestPayload,
  DecideSupplierRequestPayload,
} from "@/types/supplierRequest";

const BASE = "/api/franchise-service";

export async function createRequest(franchiseId: string, payload: CreateSupplierRequestPayload): Promise<unknown> {
  return apiUtils.post(`${BASE}/${franchiseId}/supplier-requests`, payload);
}

export async function decideRequest(franchiseId: string, payload: DecideSupplierRequestPayload): Promise<unknown> {
  return apiUtils.post(`${BASE}/${franchiseId}/supplier-requests/decision`, payload);
}
