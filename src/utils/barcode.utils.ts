/**
 * Genera variantes seguras para buscar códigos que el scanner puede devolver con padding.
 */
export function getBarcodeLookupCandidates(value: string): string[] {
  const trimmedValue = value.trim();
  if (!trimmedValue) return [];

  const candidates = new Set<string>([trimmedValue]);
  const numericValue = trimmedValue.replace(/\D/g, '');
  const hasStandardLength = [8, 12, 13, 14].includes(numericValue.length);

  if (!numericValue) return [...candidates];

  candidates.add(numericValue);

  const withoutLeadingZeros = numericValue.replace(/^0+/, '');
  if (withoutLeadingZeros) candidates.add(withoutLeadingZeros);

  if (!hasStandardLength) {
    const withoutTrailingZeros = numericValue.replace(/0+$/, '');
    if (withoutTrailingZeros) candidates.add(withoutTrailingZeros);

    const withoutOuterZeros = numericValue.replace(/^0+|0+$/g, '');
    if (withoutOuterZeros) candidates.add(withoutOuterZeros);
  }

  if (numericValue.length === 13 && numericValue.startsWith('0')) {
    candidates.add(numericValue.slice(1));
  }

  if (numericValue.length === 14 && numericValue.startsWith('0')) {
    candidates.add(numericValue.slice(1));
  }

  return [...candidates];
}
