import { formatPrice } from '@bitdev/git-sync-demo.utils.format-price';

export type PriceTagProps = {
  /** the amount to show */
  amount: number;
  /** an ISO 4217 currency code. The default is USD. */
  currency?: string;
  /** a BCP 47 locale. The default is en-US. */
  locale?: string;
  /** an optional class name for the wrapping element */
  className?: string;
};

/**
 * Shows one amount of money, formatted with `utils/format-price`.
 */
export function PriceTag({ amount, currency, locale, className }: PriceTagProps) {
  return (
    <span className={className} data-testid="price-tag">
      {formatPrice(amount, currency, locale)}
    </span>
  );
}
