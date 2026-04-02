import api from "../api/axios";
import { INVOICE_CREATE_URL, INVOICE_URL } from "../constants/apiEndPoints";
import type {
  postPointRequest,
  postCouponRequest,
  postCheckoutRequest,
  postCreateInvoiceRequest,
  BuyNowRequest,
  BuyNowResponse,
  Invoice,
  InvoiceResponse,
} from "../types/Invoice";

const invoiceService = {

  async getInvoice(invoiceId: string): Promise<Invoice> {
    if (!invoiceId || typeof invoiceId !== 'string' || !invoiceId.trim()) {
      throw new Error(`Invalid invoiceId: ${invoiceId}`);
    }
    const response = await api.get(`${INVOICE_URL}/${invoiceId}`);
    return response.data;
  },

  async applyPoints(params: postPointRequest): Promise<Invoice> {
    if (!params.invoiceId || typeof params.invoiceId !== 'string' || !params.invoiceId.trim()) {
      throw new Error(`Invalid invoiceId: ${params.invoiceId}`);
    }
    if (typeof params.points !== 'number' || params.points <= 0) {
      throw new Error('Points must be a positive number');
    }

    const response = await api.post(
      `${INVOICE_URL}/${params.invoiceId}/points`,
      null,
      {
        params: { points: params.points }
      }
    );
    return response.data;
  },

  async applyCoupon(params: postCouponRequest): Promise<Invoice> {
    if (!params.invoiceId || typeof params.invoiceId !== 'string' || !params.invoiceId.trim()) {
      throw new Error(`Invalid invoiceId: ${params.invoiceId}`);
    }
    if (!params.couponCode || typeof params.couponCode !== 'string' || !params.couponCode.trim()) {
      throw new Error('Invalid coupon code');
    }
    if (typeof params.discountPercent !== 'number' || params.discountPercent < 0 || params.discountPercent > 1) {
      throw new Error('Discount percent must be between 0 and 1');
    }

    const response = await api.post(
      `${INVOICE_URL}/${params.invoiceId}/coupon`,
      null,
      {
        params: {
          couponCode: params.couponCode,
          discountPercent: params.discountPercent
        }
      }
    );
    return response.data;
  },

  async checkout(params: postCheckoutRequest): Promise<InvoiceResponse> {
    if (!params.invoiceId || typeof params.invoiceId !== 'string' || !params.invoiceId.trim()) {
      throw new Error(`Invalid invoiceId: ${params.invoiceId}`);
    }

    const response = await api.post(`${INVOICE_URL}/${params.invoiceId}/checkout`);
    return response.data;
  },

  async createInvoice(params: postCreateInvoiceRequest): Promise<Invoice> {
    if (!params.customerId || typeof params.customerId !== 'string' || !params.customerId.trim()) {
      throw new Error('customerId is required');
    }

    // Default: create invoice from server-side cart
    const response = await api.post(`${INVOICE_CREATE_URL}/${params.customerId}`);
    return response.data;
  },

  async buyNow(params: BuyNowRequest): Promise<BuyNowResponse> {
    if (!params.customerId || typeof params.customerId !== "string" || !params.customerId.trim()) {
      throw new Error("customerId is required");
    }
    if (!params.variantId || typeof params.variantId !== "string" || !params.variantId.trim()) {
      throw new Error("variantId is required");
    }
    if (typeof params.quantity !== "number" || !Number.isFinite(params.quantity) || params.quantity <= 0) {
      throw new Error("quantity must be a positive number");
    }

    // Some backend versions expect productVariantId and/or userId instead of variantId/customerId.
    // Send compatible payload (extra fields are ignored by servers that don't use them).
    const body = {
      customerId: params.customerId,
      userId: params.customerId,
      productId: params.productId,
      variantId: params.variantId,
      productVariantId: params.variantId,
      quantity: params.quantity,
    };

    const response = await api.post(`${INVOICE_URL}/buy-now`, body);
    return response.data;
  },

  // Backward-compatible helper: returns an Invoice-like object (avoids GET /invoices/{id} which may 400 due to lazy JSON)
  async createBuyNowInvoice(customerId: string, buyNowItem: any): Promise<Invoice> {
    if (!customerId || typeof customerId !== "string" || !customerId.trim()) {
      throw new Error("customerId is required");
    }
    if (!buyNowItem) {
      throw new Error("buyNowItem is required");
    }

    const variantId = buyNowItem.variantId || buyNowItem.productVariantId;
    const productId = buyNowItem.productId;
    const quantityRaw = buyNowItem.quantity ?? buyNowItem.qty ?? 1;
    const quantity = Number(quantityRaw);

    if (!variantId) {
      throw new Error("variantId is required in buyNowItem");
    }

    const res = await invoiceService.buyNow({
      customerId,
      productId: productId != null ? String(productId) : undefined,
      variantId: String(variantId),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    });

    const totalAmount = Number(res?.totalAmount ?? 0) || 0;

    return {
      id: String(res.invoiceId),
      customerId,
      subtotal: totalAmount,
      discountAmount: 0,
      pointsDiscount: 0,
      taxAmount: 0,
      totalAmount,
      status: "PENDING_PAYMENT",
      items: (res.items || []).map((it: any) => {
        const price = Number(it?.price ?? 0) || 0;
        const qty = Number(it?.quantity ?? 1) || 1;
        return {
          productId: String(it?.productId ?? ""),
          price,
          quantity: qty,
          total: price * qty,
        };
      }),
    } as Invoice;
  },

  async getAllInvoices(): Promise<Invoice[]> {
    const response = await api.get(INVOICE_URL);
    return response.data;
  }
};

export default invoiceService;