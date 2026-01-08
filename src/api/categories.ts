import apiClient from "./client";
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  ResponseSchema,
  PaginatedResponse,
} from "../types";

export const categoriesApi = {
  list: async (shopId: string): Promise<PaginatedResponse<Category>> => {
    const response = await apiClient.get("/api/v1/categories/categories/", {
      params: { shop_id: shopId },
    });
    return response.data;
  },

  get: async (categoryId: string): Promise<ResponseSchema<Category>> => {
    const response = await apiClient.get(
      `/api/v1/categories/categories/${categoryId}`
    );
    return response.data;
  },

  create: async (data: CategoryCreate): Promise<ResponseSchema<Category>> => {
    const response = await apiClient.post("/api/v1/categories/categories/", data);
    return response.data;
  },

  update: async (
    categoryId: string,
    data: CategoryUpdate
  ): Promise<ResponseSchema<Category>> => {
    const response = await apiClient.put(
      `/api/v1/categories/categories/${categoryId}`,
      data
    );
    return response.data;
  },

  delete: async (categoryId: string): Promise<ResponseSchema<null>> => {
    const response = await apiClient.delete(
      `/api/v1/categories/categories/${categoryId}`
    );
    return response.data;
  },
};

export default categoriesApi;
