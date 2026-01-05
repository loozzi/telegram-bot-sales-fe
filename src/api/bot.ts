import apiClient from './client';
import type {
    BotRegisterRequest,
    BotRegisterResponse,
    BotStatusResponse,
    BotListResponse,
    ResponseSchema
} from '../types';

export const botApi = {
    register: async (data: BotRegisterRequest): Promise<BotRegisterResponse> => {
        const response = await apiClient.post('/api/v1/bot/register', data);
        return response.data;
    },

    unregister: async (shopId: string): Promise<ResponseSchema<null>> => {
        const response = await apiClient.delete(`/api/v1/bot/unregister/${shopId}`);
        return response.data;
    },

    getStatus: async (shopId: string): Promise<BotStatusResponse> => {
        const response = await apiClient.get(`/api/v1/bot/status/${shopId}`);
        return response.data;
    },

    listBots: async (): Promise<BotListResponse> => {
        const response = await apiClient.get('/api/v1/bot/list');
        return response.data;
    },

    reloadAll: async (): Promise<ResponseSchema<null>> => {
        const response = await apiClient.post('/api/v1/bot/reload-all');
        return response.data;
    },

    // Customer-facing endpoints for managing own shops
    startMyBot: async (shopId: string): Promise<ResponseSchema<null>> => {
        const response = await apiClient.post(`/api/v1/bot/my-shop/${shopId}/start`);
        return response.data;
    },

    stopMyBot: async (shopId: string): Promise<ResponseSchema<null>> => {
        const response = await apiClient.post(`/api/v1/bot/my-shop/${shopId}/stop`);
        return response.data;
    },

    listMyShops: async (): Promise<BotListResponse> => {
        const response = await apiClient.get('/api/v1/bot/my-shops');
        return response.data;
    },

    getMyBotStatus: async (shopId: string): Promise<BotStatusResponse> => {
        const response = await apiClient.get(`/api/v1/bot/my-shop/${shopId}/status`);
        return response.data;
    },
};

export default botApi;
