import type { CartItem } from '@bitdev/git-sync-demo.models.cart-item';
import { cartItemTotal } from '@bitdev/git-sync-demo.models.cart-item';
import { PriceTag } from '@bitdev/git-sync-demo.ui.price-tag';

export type CartSummaryProps = {
  /** the lines of the cart */
  items: CartItem[];
  /** an ISO 4217 currency code. The default is USD. */
  currency?: string;
  /** a BCP 47 locale. The default is en-US. */
  locale?: string;
  /** an optional class name for the wrapping element */
  className?: string;
};

/**
 * Lists the lines of a cart and shows the total.
 * Every amount goes through `ui/price-tag`.
 */
export function CartSummary({ items, currency, locale, className }: CartSummaryProps) {
  const total = items.reduce((sum, item) => sum + cartItemTotal(item), 0);
  return (
    <table className={className} data-testid="cart-summary">
      <tbody>
        {items.map((item) => (
          <tr key={item.sku}>
            <td>{item.name}</td>
            <td>× {item.quantity}</td>
            <td>
              <PriceTag amount={cartItemTotal(item)} currency={currency} locale={locale} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2}>Total</td>
          <td>
            <PriceTag amount={total} currency={currency} locale={locale} className="cart-summary-total" />
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
