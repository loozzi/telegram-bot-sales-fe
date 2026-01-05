import apiClient from './client';
import type {
    Inventory,
    InventoryCreate,
    InventoryUpdate,
    ResponseSchema,
    PaginatedResponse,
    BulkUploadResponse
} from '../types';

export const inventoriesApi = {
    list: async (resourceId?: string, page = 1, size = 100): Promise<PaginatedResponse<Inventory>> => {
        const response = await apiClient.get('/api/v1/inventories/inventories/', {
            params: { resource_id: resourceId, page, size },
        });
        return response.data;
    },

    get: async (inventoryId: string): Promise<ResponseSchema<Inventory>> => {
        const response = await apiClient.get(`/api/v1/inventories/inventories/${inventoryId}`);
        return response.data;
    },

    create: async (data: InventoryCreate): Promise<ResponseSchema<Inventory>> => {
        const response = await apiClient.post('/api/v1/inventories/inventories/', data);
        return response.data;
    },

    update: async (inventoryId: string, data: InventoryUpdate): Promise<ResponseSchema<Inventory>> => {
        const response = await apiClient.put(`/api/v1/inventories/inventories/${inventoryId}`, data);
        return response.data;
    },

    delete: async (inventoryId: string): Promise<ResponseSchema<null>> => {
        const response = await apiClient.delete(`/api/v1/inventories/inventories/${inventoryId}`);
        return response.data;
    },

    upload: async (resourceId: string, file: File): Promise<ResponseSchema<BulkUploadResponse>> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/api/v1/inventories/inventories/upload', formData, {
            params: { resource_id: resourceId },
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};

export default inventoriesApi;
