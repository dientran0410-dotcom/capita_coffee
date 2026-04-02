export type Warehouse = {
  id?: string | number;
  name: string;
  address?: string;
  image?: string;
  status?: string;
  location?: {
    id?: string | number;
    name?: string;
  };
};

export type Category = {
  id?: string;
  name: string;
};

export type Item = {
  id?: string;
  name: string;
  quantity?: number;
};

export type Location = {
  id?: string | number;
  name: string;
  status?: string;
};

export type Request = {
  id?: string;
  type: "IMPORT" | "EXPORT";
  itemId: string;
  quantity: number;
  status?: string;
};

export interface WarehouseServiceEnvelope<T> {
  data?: T;
  metadata?: unknown;
  errors?: unknown;
  status?: string;
}