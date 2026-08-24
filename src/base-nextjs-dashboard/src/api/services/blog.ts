import { apiClient } from "@/api/base";
import { PaginationResponse } from "@/constants/common";
import { Blog, CreateBlogDto, UpdateBlogDto } from "@/types/blog";
import { buildQuery } from "@/utils/query";

export interface GetBlogsParams {
    keyword?: string;
    statuses?: number[];
    categories?: string[];
    tagIds?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    language?: string;
}

export interface GetBlogsResponse {
    items: Blog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const blogService = {
    getBlogs: async (params: GetBlogsParams): Promise<PaginationResponse<Blog>> => {
        const { language, ...rest } = params;
        const queryString = buildQuery({ ...rest, lang: language });

        return apiClient.get<PaginationResponse<Blog>>(`/admin/blogs?${queryString}`);
    },

    getBlogById: async (id: string): Promise<Blog> => {
        return apiClient.get<Blog>(`/admin/blogs/${id}`);
    },

    validateBeforeCreate: async (data: CreateBlogDto): Promise<void> => {
        return apiClient.post<void>("/admin/blogs/validate-create", data);
    },

    createBlog: async (data: CreateBlogDto): Promise<Blog> => {
        return apiClient.post<Blog>("/admin/blogs", data);
    },

    updateBlog: async (id: string, data: UpdateBlogDto): Promise<Blog> => {
        return apiClient.patch<Blog>(`/admin/blogs/${id}`, data);
    },

    deleteBlog: async (id: string): Promise<void> => {
        return apiClient.delete<void>(`/admin/blogs/${id}`);
    },

    publishBlog: async (id: string): Promise<Blog> => {
        return apiClient.patch<Blog>(`/admin/blogs/${id}/publish`);
    },

    setTmpHideBlog: async (id: string): Promise<Blog> => {
        return apiClient.patch<Blog>(`/admin/blogs/${id}/tmp-hide`);
    },

    getPreviewToken: async (id: string): Promise<{ token: string }> => {
        return apiClient.get<{ token: string }>(`/admin/blogs/${id}/preview-token`);
    },
};
