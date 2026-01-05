import apiClient from './client';
import type {
    SignInRequest,
    CustomerCreate,
    Token,
    CustomerRead,
    ResponseSchema,
    ForgetPasswordRequest
} from '../types';

export const authApi = {
    signIn: async (data: SignInRequest): Promise<ResponseSchema<Token>> => {
        const response = await apiClient.post('/api/v1/auth/sign-in', data);
        return response.data;
    },

    signUp: async (data: CustomerCreate): Promise<ResponseSchema<Token>> => {
        const response = await apiClient.post('/api/v1/auth/sign-up', data);
        return response.data;
    },

    getMe: async (): Promise<ResponseSchema<CustomerRead>> => {
        const response = await apiClient.get('/api/v1/auth/me');
        return response.data;
    },

    refreshToken: async (refreshToken: string): Promise<ResponseSchema<Token>> => {
        const response = await apiClient.post('/api/v1/auth/refresh-token', {
            refresh_token: refreshToken,
        });
        return response.data;
    },

    forgetPassword: async (data: ForgetPasswordRequest): Promise<ResponseSchema<null>> => {
        const response = await apiClient.post('/api/v1/auth/forget-password', data);
        return response.data;
    },
};

export default authApi;
