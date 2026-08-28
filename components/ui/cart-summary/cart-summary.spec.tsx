import { render } from '@testing-library/react';
import { BasicCartSummary, EmptyCartSummary } from './cart-summary.compositions.js';

it('shows one line per item and the total', () => {
  const { container } = render(<BasicCartSummary />);
  expect(container.querySelectorAll('tbody tr').length).toEqual(2);
  expect(container.querySelector('.cart-summary-total')?.textContent).toEqual('$45.00');
});

it('shows a zero total for an empty cart', () => {
  const { container } = render(<EmptyCartSummary />);
  expect(container.querySelector('.cart-summary-total')?.textContent).toEqual('$0.00');
});
