import { FilterQuery } from 'mongoose';

/**
 * Escape user input before using it in a `$regex` (prevents regex
 * injection/ReDoS).
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the case-insensitive keyword-search `$or` clause used by every
 * list endpoint. Returns `undefined` when the keyword is empty so callers
 * can skip the clause entirely.
 */
export function buildKeywordFilter(
  keyword: string | undefined,
  fields: string[],
): FilterQuery<any>[] | undefined {
  if (!keyword || keyword.trim() === '') {
    return undefined;
  }
  const safe = escapeRegExp(keyword.trim());
  return fields.map((field) => ({
    [field]: { $regex: safe, $options: 'i' },
  }));
}
