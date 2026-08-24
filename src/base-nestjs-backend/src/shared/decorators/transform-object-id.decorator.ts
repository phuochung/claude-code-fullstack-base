import { Transform } from 'class-transformer';

/**
 * Serialize a Mongoose ObjectId property to its string form in response DTOs.
 * Replaces the hand-written `@Transform(({ obj }) => obj?._id?.toString())`
 * repeated across modules.
 */
export function TransformObjectId(): PropertyDecorator {
  return Transform(({ obj, key }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const value = obj?.[key];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return value?.toString ? value.toString() : value;
  });
}

/**
 * Array counterpart of {@link TransformObjectId} — `ObjectId[]` → `string[]`.
 * Needed because `Array.prototype.toString` exists, so the scalar decorator
 * would silently emit one comma-joined string instead of a list. Missing or
 * non-array values serialize as `[]`.
 */
export function TransformObjectIdArray(): PropertyDecorator {
  return Transform(({ obj, key }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const value = obj?.[key];
    if (!Array.isArray(value)) return [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    return value.map((item) => (item?.toString ? item.toString() : item));
  });
}
