/**
 * Base API Configuration
 * Handles HTTP requests with authentication and error handling
 */

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

// Fail loudly at build/module-eval time rather than silently shipping a
// localhost URL in the production bundle. The localhost fallback is dev-only.
if (!configuredApiUrl && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL must be set for production builds');
}

export const API_BASE_URL = configuredApiUrl || 'http://localhost:8080/api';

export interface ApiError {
    message: string;
    status: number;
    /**
     * Field-level messages from the backend's ValidationPipe, forwarded by
     * `AllExceptionsFilter` as a flat `string[]` (e.g. `["title should not be
     * empty"]`). The top-level `message` for those responses is the untranslated
     * "Bad Request Exception", so these are what a user can actually act on.
     */
    errors?: string[];
}

export class ApiException extends Error {
    status: number;
    errors?: string[];

    constructor(message: string, status: number, errors?: string[]) {
        super(message);
        this.name = 'ApiException';
        this.status = status;
        this.errors = errors;
    }
}

/**
 * Turn a thrown error into something worth showing a user: field-level
 * validation messages when the backend sent them, otherwise the error message.
 */
export function getApiErrorMessage(error: unknown): string | undefined {
    if (error instanceof ApiException && error.errors?.length) {
        return error.errors.join('; ');
    }
    return error instanceof Error ? error.message : undefined;
}

interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

/**
 * The session expired (or the cookie is invalid): clear local auth state and
 * send the user back to the sign-in page. Skipped on the sign-in page itself
 * (a failed login is also a 401) to avoid redirect loops.
 */
function handleUnauthorized(): void {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    if (pathname.startsWith('/signin')) return;

    // Best-effort cleanup; the redirect must not depend on it succeeding.
    fetch('/api/auth', { method: 'DELETE' }).catch(() => { });
    localStorage.removeItem('user');

    const redirect = pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
    window.location.href = `/signin${redirect}`;
}

/**
 * Base fetch wrapper with error handling
 * Note: Authentication token is sent via httpOnly cookie automatically
 */
async function fetchWithErrorHandling<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { headers = {}, ...restOptions } = options;

    const requestHeaders: Record<string, string> = {
        ...(headers as Record<string, string>),
    };

    // Note: No need to manually add Authorization header
    // Token is automatically sent via httpOnly cookie

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...restOptions,
            headers: requestHeaders,
            credentials: 'include', // Important: enables cookies to be sent/received
        });

        // Handle different response statuses
        if (!response.ok) {
            if (response.status === 401) {
                handleUnauthorized();
            }

            const errorData = await response.json().catch(() => ({
                message: 'An error occurred',
            }));

            throw new ApiException(
                errorData.message || `HTTP ${response.status}`,
                response.status,
                errorData.errors
            );
        }

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            return {} as T;
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiException) {
            throw error;
        }

        // Network or other errors — keep the original message when there is one.
        throw new ApiException(
            error instanceof Error && error.message
                ? error.message
                : 'Network error. Please check your connection.',
            0
        );
    }
}

/** JSON requests: set the Content-Type header explicitly. */
function withJsonHeaders(options: RequestOptions): RequestOptions {
    return {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        },
    };
}

/**
 * API Client
 */
export const apiClient = {
    /**
     * GET request
     */
    get: <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
        return fetchWithErrorHandling<T>(endpoint, withJsonHeaders({
            method: 'GET',
            ...options,
        }));
    },

    /**
     * POST request
     */
    post: <T = unknown>(
        endpoint: string,
        data?: unknown,
        options: RequestOptions = {}
    ): Promise<T> => {
        return fetchWithErrorHandling<T>(endpoint, withJsonHeaders({
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        }));
    },

    /**
     * POST multipart/form-data request (file uploads).
     * The browser sets the Content-Type (with boundary) itself.
     */
    postForm: <T = unknown>(
        endpoint: string,
        formData: FormData,
        options: RequestOptions = {}
    ): Promise<T> => {
        return fetchWithErrorHandling<T>(endpoint, {
            method: 'POST',
            body: formData,
            ...options,
        });
    },

    /**
     * PUT request
     */
    put: <T = unknown>(
        endpoint: string,
        data?: unknown,
        options: RequestOptions = {}
    ): Promise<T> => {
        return fetchWithErrorHandling<T>(endpoint, withJsonHeaders({
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        }));
    },

    /**
     * PATCH request
     */
    patch: <T = unknown>(
        endpoint: string,
        data?: unknown,
        options: RequestOptions = {}
    ): Promise<T> => {
        return fetchWithErrorHandling<T>(endpoint, withJsonHeaders({
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        }));
    },

    /**
     * DELETE request
     */
    delete: <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
        return fetchWithErrorHandling<T>(endpoint, withJsonHeaders({
            method: 'DELETE',
            ...options,
        }));
    },
};

export default apiClient;
