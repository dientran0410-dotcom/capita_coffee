// Request types
export interface CreateAddCartRequest {
  customerId: string;  
  productId: string;   
  variantId: string;   
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: number;
  quantity: number;
}

// Response types matching backend DTOs
export interface CartItemResponse {
  cartItemId: number;
  productId: string;
  variantId?: string;
  productVariantId?: string;
  productName: string;
  productImage?: string; // Optional vì API có thể không trả về
  productPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItemResponse[];
  subtotal: number;
}

// Legacy types for localStorage compatibility
export interface CartItem {
  id: number;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  supplierId?: string;
  variantId?: string;
}

export interface Cart {
  id: number;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
}

