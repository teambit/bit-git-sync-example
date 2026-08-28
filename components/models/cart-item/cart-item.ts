import { formatPrice } from '@bitdev/git-sync-demo.utils.format-price';

/**
 * One line of a shopping cart.
 */
export type CartItem = {
  /** the stock keeping unit, unique per product */
  sku: string;
  /** the product name that the cart shows */
  name: string;
  /** the price of one unit */
  unitPrice: number;
  /** how many units the cart holds */
  quantity: number;
};

/**
 * Creates a cart item. The quantity defaults to one.
 */
export function createCartItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }): CartItem {
  return { ...item, quantity: item.quantity ?? 1 };
}

/**
 * The total of one line: the unit price times the quantity.
 */
export function cartItemTotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

/**
 * The total of one line, formatted for display.
 */
export function formatCartItemTotal(item: CartItem, currency?: string, locale?: string): string {
  return formatPrice(cartItemTotal(item), currency, locale);
}
