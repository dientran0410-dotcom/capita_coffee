// UUID type alias
export type UUID = string;

// Pagination wrapper
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number;
}

/**
 * Product Status Enum
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

/**
 * Main Product Response from backend API
 * Mapped from Java ProductResponse DTO
 */
export interface ProductResponse {
  id: UUID;
  sku?: string | null;
  name: string;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  quantity?: number | null;
  categoryId?: UUID | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  status?: string | null; // ProductStatus enum from backend
  createdAt?: string | null; // ISO datetime
  updatedAt?: string | null; // ISO datetime
}

/**
 * Product Create Request
 * Includes variants (Size M, L, etc.)
 */
export interface ProductCreateRequest {
  name: string;
  description?: string | null;
  categoryId: UUID;
  imageUrl?: string | null;

  // Some backends require franchise context on create.
  // Kept optional for compatibility.
  franchiseId?: UUID | null;

  variants: VariantRequest[];
}

export namespace ProductCreateRequest {
  export interface VariantRequest {
    name: string;
    price: number; // BigDecimal -> number
    isDefault?: boolean;

    // Optional recipe/ingredient mapping if backend supports it.
    ingredients?: Array<{
      ingredientId: UUID;
      quantity: number;
    }>;
  }
}

/**
 * Product Update Request
 */
export interface ProductUpdateRequest {
  name: string;
  description?: string | null;
  categoryId: UUID;
  imageUrl?: string | null;
  status?: string | null;
}

/**
 * Product Availability Request
 */
export interface ProductAvailabilityRequest {
  isAvailable: boolean;
}

/**
 * Product Ingredients Response
 */
export interface ProductIngredientsResponse {
  productId: UUID;
  productName: string;
  variants: VariantDTO[];
}

/**
 * Variant DTO
 */
export interface VariantDTO {
  variantId: UUID;
  variantName?: string | null;
  sku?: string | null;
  price?: number | null;
  ingredients?: IngredientDTO[];
}

/**
 * Ingredient DTO
 */
export interface IngredientDTO {
  ingredientId: UUID;
  sku?: string | null;
  name?: string | null;
  baseUnit?: string | null;
  quantity?: number | null; // BigDecimal -> number
  status?: string | null; // enum value
}

/**
 * Legacy Product interface (for backward compatibility)
 */
export interface Product {
  productId: string;
  productName: string;
  productCode?: string;
  description?: string;
  category?: string;
  price: number;
  stock?: number;
  unit?: string;
  imageUrl?: string;
  supplierId?: string;
  supplierName?: string;
  status?: ProductStatus;
  [key: string]: unknown;
}
