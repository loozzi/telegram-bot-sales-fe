import { apiClient as client } from "./client";
import { type ResponseSchema } from "../types";

export interface OrderStatisticsResponse {
    total_orders: number;
    successful_orders: number;
    total_revenue: number;
    avg_order_value: number;
    orders_by_date: Record<string, number>;
}

export interface MonthlyRevenueResponse {
    monthly_revenue: number;
}

export interface RevenueByResourceResponse {
    resource_id: string;
    resource_name: string;
    revenue: number;
}

export interface SuccessRateResponse {
    success_rate: number;
}

export const statsApi = {
    getOrderStats: async (shopId: string, startDate?: string, endDate?: string) => {
        const response = await client.get<ResponseSchema<OrderStatisticsResponse>>("/api/v1/stats/order-stats", {
            params: { shop_id: shopId, start_date: startDate, end_date: endDate },
        });
        return response.data.data;
    },

    getMonthlyRevenue: async (shopId: string, year?: number, month?: number) => {
        const response = await client.get<ResponseSchema<MonthlyRevenueResponse>>("/api/v1/stats/monthly-revenue", {
            params: { shop_id: shopId, year, month },
        });
        return response.data.data;
    },

    getRevenueByResource: async (shopId: string, startDate?: string, endDate?: string) => {
        const response = await client.get<ResponseSchema<RevenueByResourceResponse[]>>("/api/v1/stats/revenue-by-resource", {
            params: { shop_id: shopId, start_date: startDate, end_date: endDate },
        });
        return response.data.data;
    },

    getSuccessRate: async (shopId: string, startDate?: string, endDate?: string) => {
        const response = await client.get<ResponseSchema<SuccessRateResponse>>("/api/v1/stats/success-rate", {
            params: { shop_id: shopId, start_date: startDate, end_date: endDate },
        });
        return response.data.data;
    },
};
