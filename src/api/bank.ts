import apiClient from './client';
import type {
    BankTransaction,
    BankTransactionList,
    BankType,
    BankTransactionStatus
} from '../types';

export interface ListTransactionsParams {
    skip?: number;
    limit?: number;
    bank_type?: BankType;
    status?: BankTransactionStatus;
    payment_id?: string;
}

export interface QRCodeParams {
    bank_type: BankType;
    account_number: string;
    amount?: number;
    description?: string;
    account_name?: string;
    template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export const bankApi = {
    listTransactions: async (params?: ListTransactionsParams): Promise<BankTransactionList> => {
        const response = await apiClient.get('/api/v1/bank/transactions', { params });
        return response.data;
    },

    getTransaction: async (transactionId: string): Promise<BankTransaction> => {
        const response = await apiClient.get(`/api/v1/bank/transactions/${transactionId}`);
        return response.data;
    },

    getPendingTransactions: async (limit = 100): Promise<BankTransactionList> => {
        const response = await apiClient.get('/api/v1/bank/pending', { params: { limit } });
        return response.data;
    },

    updateTransactionStatus: async (
        transactionId: string,
        status: BankTransactionStatus,
        content?: string
    ): Promise<void> => {
        await apiClient.patch(`/api/v1/bank/transactions/${transactionId}/status`, null, {
            params: { status, content },
        });
    },

    triggerSync: async (): Promise<void> => {
        await apiClient.post('/api/v1/bank/sync');
    },

    syncNow: async (): Promise<void> => {
        await apiClient.post('/api/v1/bank/sync/now');
    },

    getBankTypes: async (): Promise<string[]> => {
        const response = await apiClient.get('/api/v1/bank/types');
        return response.data;
    },

    generateQRUrl: async (params: QRCodeParams): Promise<{ qr_url: string }> => {
        const response = await apiClient.get('/api/v1/bank/qr', { params });
        return response.data;
    },

    getSupportedBanks: async (): Promise<string[]> => {
        const response = await apiClient.get('/api/v1/bank/qr/supported-banks');
        return response.data;
    },
};

export default bankApi;
