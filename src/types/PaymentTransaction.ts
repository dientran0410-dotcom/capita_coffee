export type PaymentTransaction = {
  id?: string;
  orderId?: string;
  requestId?: string;
  momoTransId?: string;
  amount?: number;
  status?: string;
  paymentMethod?: string;
  resultCode?: number;
  message?: string;
  payUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  momoOrderId?: string;
};
