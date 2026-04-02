import { apiUtils } from "../api/axios";
import {
  REWARD_CREATE,
  REWARD_UPDATE,
  REWARD_DELETE,
  REWARD_GET_BY_ID,
  REWARD_GET_ALL,
  REWARD_GET_ACTIVE
} from "../constants/apiEndPoints"

const toApiUrl = (url: string) => {
  if (!import.meta.env.DEV) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

// GET ACTIVE
export const getActiveRewards = async () => {
  const data = await apiUtils.get<any>(toApiUrl(REWARD_GET_ACTIVE));
  return data?.payload ?? data;
};

// GET ALL
export const getRewards = async () => {
  const data = await apiUtils.get<any>(toApiUrl(REWARD_GET_ALL));
  return data?.payload ?? data;
};

// GET BY ID
export const getRewardById = async (id: number) => {
  const data = await apiUtils.get<any>(toApiUrl(REWARD_GET_BY_ID(id)));
  return data?.payload ?? data;
};

// CREATE (multipart/form-data)
export const createReward = async (data: any) => {
  const formData = new FormData();

  // Append individual fields to match @ModelAttribute RewardRequest
  formData.append("franchiseId", String(data.franchiseId || ""));
  formData.append("name", String(data.name || ""));
  formData.append("description", String(data.description || ""));
  formData.append("requiredPoints", String(Number(data.requiredPoints) || 0));
  formData.append("active", String(Boolean(data.active)));

  if (data.imageUrl instanceof File) {
    formData.append("imageUrl", data.imageUrl);
  }

  const responseData = await apiUtils.post<any>(toApiUrl(REWARD_CREATE), formData);
  return responseData?.payload ?? responseData;
};

// UPDATE (multipart/form-data)
export const updateReward = async (id: number, data: any) => {
  const formData = new FormData();

  // Append individual fields to match @ModelAttribute RewardRequest
  formData.append("franchiseId", String(data.franchiseId || ""));
  formData.append("name", String(data.name || ""));
  formData.append("description", String(data.description || ""));
  formData.append("requiredPoints", String(Number(data.requiredPoints) || 0));
  formData.append("active", String(Boolean(data.active)));

  if (data.imageUrl instanceof File) {
    formData.append("imageUrl", data.imageUrl);
  }

  const responseData = await apiUtils.put<any>(toApiUrl(REWARD_UPDATE(id)), formData);
  return responseData?.payload ?? responseData;
};

// DELETE
export const deleteReward = async (id: number) => {
  const data = await apiUtils.delete<any>(toApiUrl(REWARD_DELETE(id)));
  return data?.payload ?? data;
};
