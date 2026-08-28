import { PriceTag } from './price-tag.js';

export const BasicPriceTag = () => <PriceTag amount={1999.5} />;

export const EuroPriceTag = () => <PriceTag amount={12} currency="EUR" locale="de-DE" />;
