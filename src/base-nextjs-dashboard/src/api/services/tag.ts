/**
 * Tag Service
 * Handles tag CRUD operations
 */

import { apiClient } from '@/api/base';
import { PaginationResponse } from '@/constants/common';
import { Tag, TagFormData } from '@/types/tag';

export interface CreateTagRequest {
    module: string;
    nameEn: string;
    nameVi: string;
    descriptionEn?: string;
    descriptionVi?: string;
}

export interface UpdateTagRequest {
    nameEn?: string;
    nameVi?: string;
    descriptionEn?: string;
    descriptionVi?: string;
}

export interface GetTagsParams {
    module?: string;
    keyword?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetTagsResponse {
    items: Tag[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Tag Service
 */
export const tagService = {
    /**
     * Create new tag
     */
    createTag: async (tagData: TagFormData): Promise<Tag> => {
        const requestData: CreateTagRequest = {
            module: tagData.module,
            nameEn: tagData.nameEn,
            nameVi: tagData.nameVi,
            descriptionEn: tagData.descriptionEn,
            descriptionVi: tagData.descriptionVi,
        };

        return apiClient.post<Tag>('/admin/tags', requestData);
    },

    /**
     * Get paginated tags list
     */
    getTags: async (params: GetTagsParams): Promise<PaginationResponse<Tag>> => {
        const queryString = new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                    acc[key] = String(value);
                }
                return acc;
            }, {} as Record<string, string>)
        ).toString();

        return apiClient.get<PaginationResponse<Tag>>(`/admin/tags?${queryString}`);
    },

    getAllTags: async (module?: string): Promise<Tag[]> => {
        const query = module ? `?module=${module}` : '';
        return apiClient.get<Tag[]>(`/admin/tags/all${query}`);
    },

    /**
     * Get tag by ID
     */
    getTagById: async (id: string): Promise<Tag> => {
        return apiClient.get<Tag>(`/admin/tags/${id}`);
    },

    /**
     * Update tag
     */
    updateTag: async (id: string, tagData: TagFormData): Promise<Tag> => {
        const requestData: UpdateTagRequest = {
            nameEn: tagData.nameEn,
            nameVi: tagData.nameVi,
            descriptionEn: tagData.descriptionEn,
            descriptionVi: tagData.descriptionVi,
        };

        return apiClient.patch<Tag>(`/admin/tags/${id}`, requestData);
    },

    /**
     * Delete tag
     */
    deleteTag: async (id: string): Promise<void> => {
        return apiClient.delete<void>(`/admin/tags/${id}`);
    },
};

export default tagService;
