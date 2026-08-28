import { createCartItem } from '@bitdev/git-sync-demo.models.cart-item';
import { CartSummary } from './cart-summary.js';

const items = [
  createCartItem({ sku: 'MUG-01', name: 'Mug', unitPrice: 12.5, quantity: 2 }),
  createCartItem({ sku: 'TEE-01', name: 'T-shirt', unitPrice: 20 }),
];

export const BasicCartSummary = () => <CartSummary items={items} />;

export const EmptyCartSummary = () => <CartSummary items={[]} />;
