/**
 * Format date string to specified format
 * @param dateString - Date string to format
 * @param format - Format pattern (default: DD/MM/YYYY HH:mm:ss)
 * @returns Formatted date string
 */
export function formatDateTime(dateString: string | undefined): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

/**
 * Format date to DD/MM/YYYY
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

/**
 * Format time to HH:mm
 * @param dateString - Date string to format
 * @returns Formatted time string
 */
export function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
