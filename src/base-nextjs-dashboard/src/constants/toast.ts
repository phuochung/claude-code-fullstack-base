/**
 * Toast Configuration Constants
 * Centralized configuration for toast notifications
 */

export const TOAST_CONFIG = {
    DEFAULT_DURATION: 5000,
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000,
    WARNING_DURATION: 4000,
    INFO_DURATION: 3000,
};

export const TOAST_MESSAGES = {
    GENERIC_ERROR: "An error occurred. Please try again.",
    GENERIC_SUCCESS: "Operation completed successfully.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    SESSION_EXPIRED: "Your session has expired. Please login again.",
} as const;
