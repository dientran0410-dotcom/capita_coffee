import api from "../api/axios";
import { MOMO_CREATE_URL, MOMO_URL } from "../constants/apiEndPoints";
import type { ApiResponse } from "../types/ApiResponse";
import type {
  postMomoIpnRequest,
  createMomoRequest,
  createMomoResponse,
} from "../types/Momo";

const MomoService = {
  // Note: IPN is normally server-to-server; keep for manual testing only.
  async createMomoIpn(params: postMomoIpnRequest): Promise<ApiResponse> {
    const response = await api.post(`${MOMO_URL}/ipn`, params);
    return response.data;
  },

  async createMomoPayment(params: createMomoRequest): Promise<createMomoResponse> {
    const response = await api.post<createMomoResponse>(
      MOMO_CREATE_URL,
      params,
      {
        // MoMo create should not require end-user auth in most setups
        skipAuth: true,
      } as any,
    );
    return response.data;
  },
};

export default MomoService;