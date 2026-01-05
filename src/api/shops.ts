import apiClient from './client';
import type {
    Shop,
    ShopCreate,
    ShopUpdate,
    ResponseSchema,
    PaginatedResponse
} from '../types';

export const shopsApi = {
    list: async (): Promise<PaginatedResponse<Shop>> => {
        const response = await apiClient.get('/api/v1/shops/shops/');
        return response.data;
    },

    create: async (data: ShopCreate): Promise<ResponseSchema<Shop>> => {
        const response = await apiClient.post('/api/v1/shops/shops/', data);
        return response.data;
    },

    update: async (shopId: string, data: ShopUpdate): Promise<ResponseSchema<Shop>> => {
        const response = await apiClient.put(`/api/v1/shops/shops/${shopId}`, data);
        return response.data;
    },

    delete: async (shopId: string): Promise<ResponseSchema<null>> => {
        const response = await apiClient.delete(`/api/v1/shops/shops/${shopId}`);
        return response.data;
    },
};

export default shopsApi;
