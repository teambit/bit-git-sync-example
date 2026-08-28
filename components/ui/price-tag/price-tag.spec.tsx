import { render, screen } from '@testing-library/react';
import { BasicPriceTag, EuroPriceTag } from './price-tag.compositions.js';

it('shows the formatted amount', () => {
  render(<BasicPriceTag />);
  expect(screen.getByTestId('price-tag').textContent).toEqual('$1,999.50');
});

it('shows another currency', () => {
  render(<EuroPriceTag />);
  expect(screen.getByTestId('price-tag').textContent).toEqual('12,00 €');
});
