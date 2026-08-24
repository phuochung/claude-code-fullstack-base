/**
 * User Service
 * Handles user CRUD operations
 */

import { PaginationResponse, USER_ROLE } from '@/constants/common';
import { apiClient } from '../base';
import { persistUser } from './auth';
import { User, UserFormData } from '@/types/user';
import { buildQuery } from '@/utils/query';

export interface CreateUserRequest {
    email: string;
    name: string;
    role: number;
    phoneNumber: string;
    password: string;
}

export interface UpdateUserRequest {
    email?: string;
    name?: string;
    role?: number;
    phoneNumber?: string;
}

export interface ChangePasswordRequest {
    newPassword: string;
}

export interface ChangeMyPasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface ResetPasswordRequest {
    newPassword: string;
}

export interface GetUsersParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    role?: number;
    keyword?: string;
}

/**
 * User Service
 */
export const userService = {
    /**
     * Create new user
     */
    createUser: async (userData: UserFormData): Promise<User> => {
        const requestData: CreateUserRequest = {
            email: userData.email,
            name: userData.name,
            // Create always picks a role from the dashboard's list.
            role: userData.role ?? USER_ROLE.MANAGER.value,
            phoneNumber: userData.phoneNumber,
            password: userData.password || '',
        };

        const response = await apiClient.post<User>(
            '/admin/users',
            requestData
        );

        return response;
    },

    /**
     * Get paginated users list
     */
    getUsers: async (params?: GetUsersParams): Promise<PaginationResponse<User>> => {
        const queryString = buildQuery(params ?? {});
        const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';

        return await apiClient.get<PaginationResponse<User>>(endpoint);
    },

    /**
     * Get user by ID
     */
    getUserById: async (id: string): Promise<User> => {
        return await apiClient.get<User>(`/admin/users/${id}`);
    },

    /**
     * Update user
     */
    updateUser: async (id: string, userData: UserFormData): Promise<User> => {
        const requestData: UpdateUserRequest = {
            email: userData.email,
            name: userData.name,
            phoneNumber: userData.phoneNumber,
            // Only when the admin actually chose one — see UserFormData.role.
            ...(userData.role !== undefined ? { role: userData.role } : {}),
        };

        return await apiClient.patch<User>(`/admin/users/${id}`, requestData);
    },

    /**
     * Delete user
     */
    deleteUser: async (id: string): Promise<void> => {
        await apiClient.delete<void>(`/admin/users/${id}`);
    },

    /**
     * Change user password
     */
    changePassword: async (id: string, newPassword: string): Promise<void> => {
        const requestData: ChangePasswordRequest = {
            newPassword,
        };

        await apiClient.patch<void>(`/admin/users/${id}/password`, requestData);
    },

    /**
     * Reset user password (admin action)
     */
    resetPassword: async (id: string, newPassword: string): Promise<void> => {
        const requestData: ResetPasswordRequest = {
            newPassword,
        };

        await apiClient.post<void>(`/admin/users/${id}/reset-password`, requestData);
    },

    /**
     * Get current user profile
     */
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get<User>('/admin/users/profile/me');

        // Update localStorage
        if (response) {
            const userResponse = response as User & { _id?: string };
            persistUser({
                userId: userResponse._id || '',
                email: response.email,
                name: response.name,
            });
        }

        return response;
    },

    /**
     * Update current user profile
     */
    updateProfile: async (data: { name?: string; phoneNumber?: string }): Promise<User> => {
        const response = await apiClient.patch<User>('/admin/users/profile/me', data);

        // Update localStorage
        if (response) {
            const userResponse = response as User & { _id?: string };
            persistUser({
                userId: userResponse._id || '',
                email: response.email,
                name: response.name,
            });
        }

        return response;
    },

    /**
     * Change current user's password (requires old password)
     */
    changeMyPassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        const requestData: ChangeMyPasswordRequest = {
            oldPassword,
            newPassword,
        };

        await apiClient.post<void>('/admin/users/profile/me/change-password', requestData);
    },
};

export default userService;
