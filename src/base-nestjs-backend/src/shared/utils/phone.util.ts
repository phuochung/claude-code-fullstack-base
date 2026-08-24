/**
 * Vietnamese phone numbers arrive in several shapes — `0901234567`,
 * `84901234567`, `+84 90 123 4567`, `090.123.4567`. Phone is the customer
 * identity key (`Customer.phoneNumber` carries a unique index and
 * `resolveCustomer` looks up by it), so without one canonical form the same
 * person becomes several customers.
 *
 * Canonical form is the national one: leading `0`, digits only.
 */
export function normalizeVnPhone(value: string | undefined | null): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';

  // Keep track of a leading `+` before stripping it: it is what distinguishes an
  // international prefix from digits that merely happen to start with 84.
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  // The international forms of a national 0-prefixed number.
  if (hasPlus && digits.startsWith('84')) return `0${digits.slice(2)}`;
  if (digits.startsWith('0084')) return `0${digits.slice(4)}`;

  // Already national — return as-is. Checked BEFORE the bare `84` case because a
  // genuine national number can itself start with 84 (e.g. 0847123456), and that
  // one must keep its 0.
  if (digits.startsWith('0')) return digits;

  // Bare `84…`: only treat it as international when the length matches
  // 84 + a 9-digit national subscriber number, so a 10-digit number that starts
  // with 84 is left alone.
  if (digits.startsWith('84') && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }

  // Trunk 0 dropped — spreadsheet exports do this. VN mobile prefixes after the
  // 0 are 3/5/7/8/9.
  if (digits.length === 9 && /^[35789]/.test(digits)) return `0${digits}`;

  // Unrecognised shape. Hand back the digits rather than guessing at a form we
  // do not understand.
  return digits;
}
