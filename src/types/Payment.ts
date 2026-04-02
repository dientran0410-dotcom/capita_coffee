export type CreatePaymentResponse = string; // payUrl
export type PaymentSuccessResponse = string; // "Payment success processed"
export type RefundPaymentResponse = string; // "Refund success - Coupon created"

export interface PaymentInvoiceParams {
  invoiceId: string | number;
}
