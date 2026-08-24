/**
 * Category Service
 * Handles category CRUD operations
 */

import { apiClient } from '@/api/base';
import { PaginationResponse } from '@/constants/common';
import { Category, CategoryFormData } from '@/types/category';

export interface CreateCategoryRequest {
    module: string;
    nameEn: string;
    nameVi: string;
    descriptionEn?: string;
    descriptionVi?: string;
}

export interface UpdateCategoryRequest {
    nameEn?: string;
    nameVi?: string;
    descriptionEn?: string;
    descriptionVi?: string;
}

export interface GetCategoriesParams {
    module?: string;
    keyword?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
}

export interface GetCategoriesResponse {
    items: Category[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Category Service
 */
export const categoryService = {
    /**
     * Create new category
     */
    createCategory: async (categoryData: CategoryFormData): Promise<Category> => {
        const requestData: CreateCategoryRequest = {
            module: categoryData.module,
            nameEn: categoryData.nameEn,
            nameVi: categoryData.nameVi,
            descriptionEn: categoryData.descriptionEn,
            descriptionVi: categoryData.descriptionVi,
        };

        return await apiClient.post<Category>('/admin/categories', requestData);
    },

    /**
     * Get paginated categories list
     */
    getCategories: async (params: GetCategoriesParams): Promise<PaginationResponse<Category>> => {
        const queryString = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                    acc[key] = String(value);
                }
                return acc;
            }, {} as Record<string, string>)
        ).toString();

        return apiClient.get<PaginationResponse<Category>>(`/admin/categories?${queryString}`);
    },

    getAllCategories: async (module?: string): Promise<Category[]> => {
        const query = module ? `?module=${module}` : '';
        return apiClient.get<Category[]>(`/admin/categories/all${query}`);
    },

    /**
     * Get category by ID
     */
    getCategoryById: async (id: string): Promise<Category> => {
        return apiClient.get<Category>(`/admin/categories/${id}`);
    },

    /**
     * Update category
     */
    updateCategory: async (id: string, categoryData: CategoryFormData): Promise<Category> => {
        const requestData: UpdateCategoryRequest = {
            nameEn: categoryData.nameEn,
            nameVi: categoryData.nameVi,
            descriptionEn: categoryData.descriptionEn,
            descriptionVi: categoryData.descriptionVi,
        };

        return apiClient.patch<Category>(`/admin/categories/${id}`, requestData);
    },

    /**
     * Delete category
     */
    deleteCategory: async (id: string): Promise<void> => {
        return apiClient.delete<void>(`/admin/categories/${id}`);
    },
};

export default categoryService;
