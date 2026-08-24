import { apiClient } from '@/api/base';
import { PaginationResponse } from '@/constants/common';
import { Customer, CustomerFormData } from '@/types/customer';

export interface GetCustomersParams {
    keyword?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
}

export const customerService = {
    getCustomers: async (params: GetCustomersParams): Promise<PaginationResponse<Customer>> => {
        const queryString = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    acc[key] = String(value);
                }
                return acc;
            }, {} as Record<string, string>)
        ).toString();
        return apiClient.get<PaginationResponse<Customer>>(`/admin/customers?${queryString}`);
    },

    getCustomerById: async (id: string): Promise<Customer> => {
        return apiClient.get<Customer>(`/admin/customers/${id}`);
    },

    createCustomer: async (data: CustomerFormData): Promise<Customer> => {
        return apiClient.post<Customer>('/admin/customers', data);
    },

    updateCustomer: async (id: string, data: CustomerFormData): Promise<Customer> => {
        return apiClient.patch<Customer>(`/admin/customers/${id}`, data);
    },

    deleteCustomer: async (id: string): Promise<void> => {
        return apiClient.delete<void>(`/admin/customers/${id}`);
    },
};

export default customerService;
