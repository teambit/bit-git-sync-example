import { formatPrice } from './format-price.js';

it('formats US dollars by default', () => {
  expect(formatPrice(1999.5)).toEqual('$1,999.50');
});

it('formats another currency', () => {
  expect(formatPrice(12, 'EUR', 'de-DE')).toEqual('12,00 €');
});

it('keeps two decimals for a whole number', () => {
  expect(formatPrice(3)).toEqual('$3.00');
});
