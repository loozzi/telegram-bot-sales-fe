import apiClient from './client';
import type { Order, OrderListParams, PaginatedResponse, ResponseSchema } from '../types';

export const ordersApi = {
    listShopOrders: async (params: OrderListParams): Promise<PaginatedResponse<Order>> => {
        const { shop_id, ...queryParams } = params;
        const response = await apiClient.get(`/api/v1/orders/orders/shop/${shop_id}`, { params: queryParams });
        return response.data;
    },

    getOrder: async (orderId: string): Promise<ResponseSchema<Order>> => {
        const response = await apiClient.get(`/api/v1/orders/orders/${orderId}`);
        return response.data;
    },
};

export default ordersApi;
