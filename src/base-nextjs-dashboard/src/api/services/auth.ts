/**
 * Authentication Service
 * Handles login, logout, and token management
 */

import { apiClient } from '../base';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    user: {
        userId: string;
        email: string;
        name: string;
    };
}

export interface User {
    userId: string;
    email: string;
    name: string;
    role: number;
}

/**
 * Persist the signed-in user snapshot to localStorage (single source for the
 * three places that used to hand-roll this sync).
 */
export function persistUser(user: { userId: string; email: string; name: string; role?: number }): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Authentication Service
 */
export const authService = {
    /**
     * Login user
     */
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>(
            '/admin/auth/login',
            credentials,
            {
                requiresAuth: false,
                headers: {
                    'x-client-type': 'dashboard', // Tell backend this is dashboard client
                }
            }
        );

        // Set auth cookie on dashboard domain
        if (response.accessToken) {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.accessToken }),
            });
        }

        // Store user data in localStorage
        if (response.user) {
            persistUser(response.user);
        }

        return response;
    },

    /**
     * Logout user
     */
    logout: async (): Promise<void> => {
        try {
            await apiClient.post('/admin/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear dashboard cookie and localStorage
            await fetch('/api/auth', { method: 'DELETE' }).catch(() => {});
            localStorage.removeItem('user');
        }
    },

    /**
     * Get current user from localStorage
     */
    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null;

        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    /**
     * Get authentication token
     * Note: Token is stored in httpOnly cookie, not accessible via JS
     * This method is kept for compatibility but always returns null
     */
    getToken: (): string | null => {
        // Token is in httpOnly cookie, not accessible via JavaScript
        return null;
    },

    /**
     * Check if user is authenticated
     * Check if user data exists (token is in httpOnly cookie)
     */
    isAuthenticated: (): boolean => {
        return !!authService.getCurrentUser();
    },

    /**
     * Refresh token (if your API supports it)
     */
    refreshToken: async (): Promise<string> => {
        const response = await apiClient.post<{ accessToken: string }>(
            '/admin/auth/refresh'
        );

        return response.accessToken;
    },

    /**
     * Get current user profile from API.
     * Uses the same endpoint as userService (`/admin/users/profile/me`) —
     * the only profile endpoint the backend serves.
     */
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get<User & { _id?: string }>(
            '/admin/users/profile/me'
        );

        const user: User = {
            userId: response._id || response.userId || '',
            email: response.email,
            name: response.name,
            role: response.role,
        };
        persistUser(user);

        return user;
    },
};

export default authService;
