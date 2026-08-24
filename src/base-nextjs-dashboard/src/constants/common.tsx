export const USER_ROLE = {
    ADMIN: { value: 2, name: 'Admin' },
    MANAGER: { value: 3, name: 'Manager' },
} as const;

export const TABLE_PARAMS = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    SORT_BY: 'createdAt',
    SORT_ORDER: 'desc',
} as const;

/**
 * API Request Timeouts (in milliseconds)
 */
export const API_TIMEOUTS = {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 60000,  // 60 seconds for file uploads
    LONG: 120000,   // 2 minutes for heavy operations
} as const;

/**
 * Date Time Format
 */
export const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';
export const DATE_FORMAT = 'DD/MM/YYYY';

/**
 * Module Constants
 */
export const CUSTOM_FIELD_MODULES = ['customer', 'booking', 'order', 'product'] as const;
export type CustomFieldModule = typeof CUSTOM_FIELD_MODULES[number];

export const TAG_MODULES = ['blog', 'customer', 'product'] as const;
export type TagModule = typeof TAG_MODULES[number];

// Which module the tag screens land on. 'blog' here because that is the content
// type this platform actually ships; a product repo whose primary content is
// something else should point this at that module instead. The other modules
// stay selectable from the dropdown either way.
export const DEFAULT_TAG_MODULE: TagModule = 'blog';

export const CATEGORY_MODULES = ['blog', 'product'] as const;
export type CategoryModule = typeof CATEGORY_MODULES[number];

/**
 * Blog Constants
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
export const MAX_BLOG_SECTIONS = 10;

export const BLOG_STATUS = {
    DRAFT: 1,
    PUBLISHED: 2,
    TMP_HIDE: 3,
} as const;

export interface PaginationResponse<T> {
    docs: T[];
    totalDocs: number;
    page: number;
    limit: number;
    totalPages: number;
}
