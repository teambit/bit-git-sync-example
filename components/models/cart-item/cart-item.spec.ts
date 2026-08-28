import { cartItemTotal, createCartItem, formatCartItemTotal } from './cart-item.js';

const mug = createCartItem({ sku: 'MUG-01', name: 'Mug', unitPrice: 12.5, quantity: 2 });

it('defaults the quantity to one', () => {
  expect(createCartItem({ sku: 'PEN-01', name: 'Pen', unitPrice: 1 }).quantity).toEqual(1);
});

it('multiplies the unit price by the quantity', () => {
  expect(cartItemTotal(mug)).toEqual(25);
});

it('formats the line total', () => {
  expect(formatCartItemTotal(mug)).toEqual('$25.00');
});
