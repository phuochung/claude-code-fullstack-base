export interface FileMetadata {
    _id: string;
    name: string;
    size: number;
    mimeType: string;
    url: string;
}

export interface BlogSection {
    order: number;
    type: 'html' | 'image';
    content?: string;
    fileMetadataId?: string;
    fileMetadata?: FileMetadata;
    caption?: string;
}

export interface Blog {
    _id: string;
    slug: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    title: string;
    excerpt?: string;
    language: string;      // 'vi' | 'en'
    bannerFileMetadataId?: string;
    bannerFileMetadata?: FileMetadata;
    sections: BlogSection[];
    status: number;
    publishedAt?: string;
    category: {
        _id: string;
        nameVi: string;
        nameEn: string;
    };
    tags?: Array<{
        _id: string;
        nameVi: string;
        nameEn: string;
    }>;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Section shape in create/update payloads. Matches the backend's
 * `BlogSectionDto`, where `fileMetadata` is the storage id of an uploaded
 * image; the read shape (`BlogSection`) carries the populated object instead,
 * and the form passes it through untouched for sections whose image did not
 * change — the save pages convert it to the id before sending.
 */
export type BlogSectionPayload = Omit<BlogSection, 'fileMetadata'> & {
    fileMetadata?: string | FileMetadata;
};

export interface CreateBlogDto {
    title: string;
    excerpt: string;
    language?: string;
    bannerFileMetadata?: string;
    sections: BlogSectionPayload[];
    category: string;
    tags?: string[];
    status?: number;
}

export type UpdateBlogDto = Partial<CreateBlogDto>;
