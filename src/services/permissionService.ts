import api from "@/api/axios";
import {
  GET_ALL_PERMISSIONS_URL,
  GET_ROLE_PERMISSIONS_URL,
  ASSIGN_ROLE_PERMISSIONS_URL,
  DELETE_ROLE_PERMISSIONS_URL,
} from "@/constants/apiEndPoints";
import type { ApiResponse } from "../types/user";

export interface Permission {
  id?: string | number;
  name: string;
  description?: string;
}

export interface RolePermission {
  roleId: string;
  permissions: Permission[];
}

export interface AssignPermissionsRequest {
  permissionIds: (string | number)[];
}

export const getAllPermissions = async (): Promise<ApiResponse<Permission[]>> => {
  const response = await api.get<ApiResponse<Permission[]>>(
    GET_ALL_PERMISSIONS_URL
  );
  return response.data;
};

export const getRolePermissions = async (
  roleId: string
): Promise<ApiResponse<RolePermission>> => {
  const response = await api.get<ApiResponse<RolePermission>>(
    GET_ROLE_PERMISSIONS_URL(roleId)
  );
  return response.data;
};

export const assignRolePermissions = async (
  roleId: string,
  payload: AssignPermissionsRequest
): Promise<ApiResponse<RolePermission>> => {
  // Assign each permission one by one with permissionName as query parameter
  if (!payload.permissionIds || payload.permissionIds.length === 0) {
    throw new Error('No permissions to assign');
  }

  // Get all permissions to map IDs to names
  const allPermsResponse = await getAllPermissions();
  const permissionMap = new Map<string | number, string>();
  
  allPermsResponse.data?.forEach((perm) => {
    if (perm.id) {
      permissionMap.set(perm.id, perm.name);
    }
    permissionMap.set(perm.name, perm.name);
  });

  // Assign each permission
  let lastResponse: ApiResponse<RolePermission> | null = null;
  for (const permId of payload.permissionIds) {
    const permissionName = permissionMap.get(permId) || String(permId);
    const response = await api.post<ApiResponse<RolePermission>>(
      `${ASSIGN_ROLE_PERMISSIONS_URL(roleId)}?permissionName=${encodeURIComponent(permissionName)}`
    );
    lastResponse = response.data;
  }

  return lastResponse || { status: 200, data: null as any };
};

export const deleteRolePermision = async (
  roleId: string,
  permissionName: string
): Promise<ApiResponse<RolePermission>> => {
  const response = await api.delete<ApiResponse<RolePermission>>(
    `${DELETE_ROLE_PERMISSIONS_URL(roleId)}?permissionName=${encodeURIComponent(permissionName)}`
  );
  return response.data;
};
