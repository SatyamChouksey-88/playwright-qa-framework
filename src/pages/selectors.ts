/**
 * Raw CSS/attribute selectors shared by more than one page object.
 *
 * The app under test ships almost no `data-testid` hooks, so the few structural
 * selectors we depend on live here rather than being repeated per file.
 */
export const SELECTORS = {
  /** Product grid cards: the app's only stable structural hook for a card. */
  productCard: 'div[tabindex="1"]',
  sizeCheckbox: '[data-testid="checkbox"]',
  cartQuantityBadge: '[title="Products in cart quantity"]',
  removeFromCart: '[title="remove product from cart"]',
} as const;
