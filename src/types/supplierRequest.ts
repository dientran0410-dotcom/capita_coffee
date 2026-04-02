export type SupplierRequestDecision = "APPROVED" | "REJECTED";

export interface CreateSupplierRequestPayload {
  supplierId: string;
  reason: string;
}

export interface DecideSupplierRequestPayload {
  requestId: string;
  decision: SupplierRequestDecision;
  comment?: string;
}
