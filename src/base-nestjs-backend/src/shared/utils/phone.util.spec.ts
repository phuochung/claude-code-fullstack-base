import { normalizeVnPhone } from './phone.util';

describe('normalizeVnPhone', () => {
  it('leaves an already-canonical national number untouched', () => {
    expect(normalizeVnPhone('0901234567')).toBe('0901234567');
  });

  it('converts the international forms to the national one', () => {
    expect(normalizeVnPhone('84901234567')).toBe('0901234567');
    expect(normalizeVnPhone('+84901234567')).toBe('0901234567');
    expect(normalizeVnPhone('+84 90 123 4567')).toBe('0901234567');
    expect(normalizeVnPhone('0084901234567')).toBe('0901234567');
  });

  it('strips separators and whitespace', () => {
    expect(normalizeVnPhone('090.123.4567')).toBe('0901234567');
    expect(normalizeVnPhone('090-123-4567')).toBe('0901234567');
    expect(normalizeVnPhone('  0901234567  ')).toBe('0901234567');
    expect(normalizeVnPhone('(090) 123 4567')).toBe('0901234567');
  });

  it('restores a dropped trunk 0 on a bare 9-digit mobile', () => {
    expect(normalizeVnPhone('901234567')).toBe('0901234567');
    expect(normalizeVnPhone('347123456')).toBe('0347123456');
  });

  it('keeps the 0 on a national number that itself starts with 84', () => {
    // The bare-84 rule must not fire here: this is a real 10-digit national
    // number, not 84 + subscriber.
    expect(normalizeVnPhone('0847123456')).toBe('0847123456');
  });

  it('does not treat a 10-digit number starting with 84 as international', () => {
    expect(normalizeVnPhone('8471234567')).toBe('8471234567');
  });

  it('returns empty for blank input', () => {
    expect(normalizeVnPhone('')).toBe('');
    expect(normalizeVnPhone('   ')).toBe('');
    expect(normalizeVnPhone(undefined)).toBe('');
    expect(normalizeVnPhone(null)).toBe('');
  });

  it('returns empty when the input carries no digits at all', () => {
    expect(normalizeVnPhone('khong co so')).toBe('');
  });

  it('hands back digits for an unrecognised shape rather than guessing', () => {
    expect(normalizeVnPhone('12345')).toBe('12345');
  });
});
