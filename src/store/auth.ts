import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerRead, Token } from '../types';

interface AuthState {
    user: CustomerRead | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setTokens: (tokens: Token) => void;
    setUser: (user: CustomerRead) => void;
    login: (tokens: Token, user?: CustomerRead) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            setTokens: (tokens: Token) => {
                localStorage.setItem('access_token', tokens.access_token);
                localStorage.setItem('refresh_token', tokens.refresh_token);
                set({
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    isAuthenticated: true,
                });
            },

            setUser: (user: CustomerRead) => {
                set({ user });
            },

            login: (tokens: Token, user?: CustomerRead) => {
                localStorage.setItem('access_token', tokens.access_token);
                localStorage.setItem('refresh_token', tokens.refresh_token);
                set({
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    isAuthenticated: true,
                    user: user || null,
                });
            },

            logout: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                user: state.user,
            }),
        }
    )
);
