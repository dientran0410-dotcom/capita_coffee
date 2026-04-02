import api from "@/api/axios";
import {
  CHANGE_ROLE_URL,
  CREATE_ACCOUNT_URL,
  DEACTIVATE_USER_URL,
  DELETE_USER_URL,
  GET_CURRENT_USER_URL,
} from "@/constants/apiEndPoints";
import type {
  ApiResponse,
  ChangeRoleResponse,
  CreateAccountRequest,
  CreateAccountResponse,
  CurrentUserProfile,
} from "../types/user";

export const createAccount = async (
  payload: CreateAccountRequest
): Promise<ApiResponse<CreateAccountResponse>> => {
  const response = await api.post<ApiResponse<CreateAccountResponse>>(
    CREATE_ACCOUNT_URL,
    {
      email: payload.email,
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      password: payload.password,
      franchiseId: payload.franchiseId,
      roleName: payload.roleName,
    }
  );
  return response.data;
};

export const changeUserRole = async (
  userId: string,
  roleName: string
): Promise<ApiResponse<ChangeRoleResponse>> => {
  const response = await api.patch<ApiResponse<ChangeRoleResponse>>(
    CHANGE_ROLE_URL(userId),
    { roleName }
  );
  return response.data;
};

export const deactivateUser = async (
  userId: string
): Promise<ApiResponse> => {
  const response = await api.patch<ApiResponse>(DEACTIVATE_USER_URL(userId));
  return response.data;
};

export const deleteUser = async (userId: string): Promise<ApiResponse> => {
  const response = await api.delete<ApiResponse>(DELETE_USER_URL(userId));
  return response.data;
};

export const getCurrentUser = async (): Promise<ApiResponse<CurrentUserProfile>> => {
  const response = await api.get<ApiResponse<CurrentUserProfile>>(
    GET_CURRENT_USER_URL
  );
  return response.data;
};

// temp change