import sizeCodes from '../../test-data/size-codes.json';

/** Size labels rendered as filter checkboxes in the UI. */
export const UI_FILTER_SIZES: readonly string[] = sizeCodes.uiFilterSizes;

/** Every code observed in live products.json — UI codes plus legacy API-only codes. */
export const ALLOWED_API_SIZE_CODES: readonly string[] = sizeCodes.allowedApiSizeCodes;

const SPELLED_OUT_SIZE_PATTERN = /small|medium|large|extra/i;

export function isAllowedApiSizeCode(size: string): boolean {
  return ALLOWED_API_SIZE_CODES.includes(size);
}

export function validateProductSizeCodes(sizes: string[]): string | null {
  if (sizes.length === 0) {
    return 'must have at least one size';
  }

  for (const size of sizes) {
    if (SPELLED_OUT_SIZE_PATTERN.test(size)) {
      return `spelled-out size "${size}" is not allowed — use abbreviated codes only`;
    }
    if (!isAllowedApiSizeCode(size)) {
      return `unknown size code "${size}" — expected one of: ${ALLOWED_API_SIZE_CODES.join(', ')}`;
    }
  }

  return null;
}

export function sizesMatchUiFilters(actual: string[]): boolean {
  if (actual.length !== UI_FILTER_SIZES.length) return false;
  const expected = [...UI_FILTER_SIZES].sort();
  const received = [...actual].sort();
  return expected.every((size, index) => size === received[index]);
}
