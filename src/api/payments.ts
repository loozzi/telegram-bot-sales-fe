import apiClient from './client';
import type {
    Payment,
    PaymentWithToken,
    PaymentCreate,
    PaymentUpdate,
    PaymentStatus,
    ResponseSchema,
    PaginatedResponse
} from '../types';

export const paymentsApi = {
    list: async (shopId: string, status?: PaymentStatus): Promise<PaginatedResponse<Payment>> => {
        const response = await apiClient.get(`/api/v1/shops/shops/${shopId}/payments`, {
            params: { status },
        });
        return response.data;
    },

    get: async (shopId: string, paymentId: string): Promise<ResponseSchema<PaymentWithToken>> => {
        const response = await apiClient.get(`/api/v1/shops/shops/${shopId}/payments/${paymentId}`);
        return response.data;
    },

    create: async (shopId: string, data: PaymentCreate): Promise<ResponseSchema<PaymentWithToken>> => {
        const response = await apiClient.post(`/api/v1/shops/shops/${shopId}/payments`, data);
        return response.data;
    },

    update: async (shopId: string, paymentId: string, data: PaymentUpdate): Promise<ResponseSchema<PaymentWithToken>> => {
        const response = await apiClient.put(`/api/v1/shops/shops/${shopId}/payments/${paymentId}`, data);
        return response.data;
    },

    delete: async (shopId: string, paymentId: string): Promise<ResponseSchema<null>> => {
        const response = await apiClient.delete(`/api/v1/shops/shops/${shopId}/payments/${paymentId}`);
        return response.data;
    },

    updateStatus: async (shopId: string, paymentId: string, status: PaymentStatus): Promise<ResponseSchema<Payment>> => {
        const response = await apiClient.patch(
            `/api/v1/shops/shops/${shopId}/payments/${paymentId}/status`,
            null,
            { params: { status } }
        );
        return response.data;
    },
};

export default paymentsApi;
