import apiClient from '../base';

export interface TopViewedBlog {
    _id: string;
    slug: string;
    title: string;
    viewCount: number;
    status: number;
    createdAt: string;
    updatedAt: string;
    category: {
        _id: string;
        nameVi: string;
        nameEn: string;
    };
}

export interface BlogCountStatistics {
    total: number;
    draft: number;
    published: number;
    tmpHide: number;
}

export const StatisticService = {
    getTopViewedBlogs: () => {
        return apiClient.get<TopViewedBlog[]>('/statistic/blogs/top-viewed');
    },
    getBlogCountStatistics: () => {
        return apiClient.get<BlogCountStatistics>('/statistic/blogs/counts');
    },
};
