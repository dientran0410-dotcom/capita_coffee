export interface postMomoIpnRequest {
  partnerCode: string;
  orderId: string;
  requestId: string;
  extraData?: string;
  signature?: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime?: number;
}

export interface createMomoRequest {
  orderId: string;
  amount: number;
}

export interface createMomoResponse {
  payUrl?: string | null;
  qrCodeUrl?: string | null;
}
