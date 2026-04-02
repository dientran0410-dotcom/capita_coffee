export interface Supplier {
  id: string | number;
  name: string;
  contactEmail?: string;
  region?: string;
  rating?: number;
  status?: string;
  updateAt?: string;
  [key: string]: unknown;
}

export interface SupplierPage {
  content: Supplier[];
  totalPages: number;
  totalElements?: number;
  size?: number;
  number?: number;
}

export interface SupplierFilterParams {
  status?: string;
  region?: string;
  minRating?: string | number;
  updatedAfter?: string;
  sort?: string;
  keyword?: string;
  page?: number;
  size?: number;
}
