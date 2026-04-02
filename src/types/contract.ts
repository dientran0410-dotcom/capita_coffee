export interface Contract {
  contractId: string;
  contractCode?: string;
  franchiseId: string;
  franchiseName?: string;
  supplierId?: string;
  supplierName?: string;
  contractType?: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  terms?: string;
  value?: number;
  signedDate?: string;
  [key: string]: unknown;
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED'
}

export interface CreateContractRequest {
  franchiseId: string;
  supplierId?: string;
  contractType?: string;
  startDate: string;
  endDate: string;
  terms?: string;
  value?: number;
}

export interface UpdateContractRequest extends Partial<CreateContractRequest> {
  status?: ContractStatus;
}
