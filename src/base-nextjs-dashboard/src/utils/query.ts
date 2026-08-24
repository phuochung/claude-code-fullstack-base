/**
 * Build a query string from a params object.
 * - Skips undefined / null / empty-string values (0 and false are kept).
 * - Arrays are appended as repeated keys (?statuses=1&statuses=2).
 */
export function buildQuery(params: object): string {
    const urlParams = new URLSearchParams();

    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            value.forEach((item) => urlParams.append(key, String(item)));
        } else {
            urlParams.append(key, String(value));
        }
    });

    return urlParams.toString();
}
