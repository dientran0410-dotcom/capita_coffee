import type { PaymentTransaction } from "./PaymentTransaction";

// Request types matching backend
export interface postPointRequest {
    invoiceId: string; // UUID as string
    points: number;
}

export interface postCouponRequest {
    invoiceId: string; // UUID as string
    couponCode: string; // Backend expects couponCode, not couponId
    discountPercent: number; // 0.1 = 10%
}

export interface postCheckoutRequest {
    invoiceId: string; // UUID as string
}

export interface postCreateInvoiceRequest {
    customerId: string; // UUID as string
    items?: any[]; // Cart items for guest checkout (legacy, backend doesn't use this)
}

export interface BuyNowRequest {
    customerId: string; // UUID as string
    productId?: string; // UUID as string (optional - backend currently uses variantId)
    variantId: string; // UUID as string
    quantity: number;
}

// Response types matching backend DTOs
export interface InvoiceItemResponse {
    productId: string; // UUID as string
    quantity: number;
    price: number | string;
}

export interface InvoiceResponse {
    id: string; // UUID as string
    items: InvoiceItemResponse[];
}

export interface BuyNowResponse {
    invoiceId: string; // UUID as string
    totalAmount: number | string;
    items: InvoiceItemResponse[];
}

// Full Invoice entity matching backend
export interface Invoice {
    id: string; // UUID
    code?: string;
    orderId?: string;
    customerId: string;
    subtotal: number;
    discountAmount: number;
    pointsDiscount: number;
    taxAmount: number;
    shippingFee?: number;
    totalAmount: number;
    currency?: string;
    status: "DRAFT" | "PENDING_PAYMENT" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
    franchiseId?: string; // UUID
    issuedAt?: string;
    paidAt?: string;
    cancelledAt?: string;
    createdAt?: string;
    updatedAt?: string;
    items: InvoiceItem[];

    // Some backend deployments include payment transactions on invoice detail.
    paymentTransactions?: PaymentTransaction[];
    paymentTransaction?: PaymentTransaction;
    transactions?: PaymentTransaction[];
}

export interface InvoiceItem {
    id?: string;
    productId: string;
    variantId?: string;
    productVariantId?: string;
    productName?: string;
    price: number;
    quantity: number;
    total: number;
}

// Legacy types for backward compatibility
export interface InvoiceItemDetail {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    image: string;
}

export interface InvoiceDetail {
    id: number;
    items: InvoiceItemDetail[];
    subtotal: number;
    discountAmount: number;
    loyaltyDiscount: number;
    tax: number;
    totalAmount: number;
    availablePoints: number;
    appliedCouponCode?: string;
}
