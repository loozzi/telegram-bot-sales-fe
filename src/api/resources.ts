import apiClient from './client';
import type {
    Resource,
    ResourceCreate,
    ResourceUpdate,
    ResponseSchema,
    PaginatedResponse
} from '../types';

export const resourcesApi = {
    list: async (shopId: string): Promise<PaginatedResponse<Resource>> => {
        const response = await apiClient.get('/api/v1/resources/resources/', {
            params: { shop_id: shopId },
        });
        return response.data;
    },

    get: async (resourceId: string): Promise<ResponseSchema<Resource>> => {
        const response = await apiClient.get(`/api/v1/resources/resources/${resourceId}`);
        return response.data;
    },

    create: async (data: ResourceCreate): Promise<ResponseSchema<Resource>> => {
        const response = await apiClient.post('/api/v1/resources/resources/', data);
        return response.data;
    },

    update: async (resourceId: string, data: ResourceUpdate): Promise<ResponseSchema<Resource>> => {
        const response = await apiClient.put(`/api/v1/resources/resources/${resourceId}`, data);
        return response.data;
    },

    delete: async (resourceId: string): Promise<ResponseSchema<null>> => {
        const response = await apiClient.delete(`/api/v1/resources/resources/${resourceId}`);
        return response.data;
    },
};

export default resourcesApi;
