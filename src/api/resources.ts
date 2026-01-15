import apiClient from "./client";
import type {
  Resource,
  ResourceCreate,
  ResourceUpdate,
  ResponseSchema,
  PaginatedResponse,
} from "../types";

export const resourcesApi = {
  list: async (
    shopId: string,
    page: number = 1,
    size: number = 20
  ): Promise<PaginatedResponse<Resource>> => {
    const response = await apiClient.get("/api/v1/resources/", {
      params: { shop_id: shopId, page, size },
    });
    return response.data;
  },

  get: async (resourceId: string): Promise<ResponseSchema<Resource>> => {
    const response = await apiClient.get(
      `/api/v1/resources/${resourceId}`
    );
    return response.data;
  },

  create: async (data: ResourceCreate): Promise<ResponseSchema<Resource>> => {
    const response = await apiClient.post("/api/v1/resources/", data);
    return response.data;
  },

  update: async (
    resourceId: string,
    data: ResourceUpdate
  ): Promise<ResponseSchema<Resource>> => {
    const response = await apiClient.put(
      `/api/v1/resources/${resourceId}`,
      data
    );
    return response.data;
  },

  delete: async (resourceId: string): Promise<ResponseSchema<null>> => {
    const response = await apiClient.delete(
      `/api/v1/resources/${resourceId}`
    );
    return response.data;
  },

  updateStatus: async (
    resourceId: string,
    isActive: boolean
  ): Promise<ResponseSchema<Resource>> => {
    const response = await apiClient.put(
      `/api/v1/resources/update-status/${resourceId}`,
      null,
      {
        params: { is_active: isActive },
      }
    );
    return response.data;
  },

  reorder: async (
    shopId: string,
    categoryId: string,
    resourceIds: string[]
  ): Promise<ResponseSchema<any>> => {
    const response = await apiClient.post(
      `/api/v1/resources/reorder`,
      resourceIds,
      {
        params: { shop_id: shopId, category_id: categoryId },
      }
    );
    return response.data;
  },
};

export default resourcesApi;
