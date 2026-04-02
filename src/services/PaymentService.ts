import api from "../api/axios";
import { PAYMENT_URL } from "../constants/apiEndPoints";
import type {
  CreatePaymentResponse,
  PaymentInvoiceParams,
  PaymentSuccessResponse,
  RefundPaymentResponse,
} from "../types/Payment";

const normalizeInvoiceId = (params: PaymentInvoiceParams): string => {
  const invoiceId = String(params.invoiceId ?? "").trim();
  if (!invoiceId) {
    throw new Error(`Invalid invoiceId: ${params.invoiceId}`);
  }
  return invoiceId;
};

const PaymentService = {
  // POST /api/products/payment/{invoiceId} -> payUrl
  async postPayment(params: PaymentInvoiceParams): Promise<CreatePaymentResponse> {
    const invoiceId = normalizeInvoiceId(params);
    const response = await api.post<CreatePaymentResponse>(
      `${PAYMENT_URL}/${encodeURIComponent(invoiceId)}`,
    );
    return response.data;
  },

  // POST /api/products/payment/success/{invoiceId}
  async handlePaymentSuccess(
    params: PaymentInvoiceParams,
  ): Promise<PaymentSuccessResponse> {
    const invoiceId = normalizeInvoiceId(params);
    const response = await api.post<PaymentSuccessResponse>(
      `${PAYMENT_URL}/success/${encodeURIComponent(invoiceId)}`,
    );
    return response.data;
  },

  // POST /api/products/payment/refund/{invoiceId}
  async refundPayment(params: PaymentInvoiceParams): Promise<RefundPaymentResponse> {
    const invoiceId = normalizeInvoiceId(params);
    const response = await api.post<RefundPaymentResponse>(
      `${PAYMENT_URL}/refund/${encodeURIComponent(invoiceId)}`,
    );
    return response.data;
  },
};

export default PaymentService;

