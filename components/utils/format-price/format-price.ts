/**
 * Formats an amount of money for display. Rejects NaN and infinities.
 * Example: formatPrice(1999.5) returns "$1,999.50".
 * The currency and the locale are optional. The default is US dollars in
 * the en-US locale.
 *
 * This is the component that the bit-git-sync example edits in every flow.
 * A change here auto-tags its dependents: models/cart-item, ui/price-tag and
 * ui/cart-summary.
 */
export function formatPrice(amount: number, currency = 'USD', locale = 'en-US'): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`formatPrice: the amount must be a finite number, got ${amount}`);
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
