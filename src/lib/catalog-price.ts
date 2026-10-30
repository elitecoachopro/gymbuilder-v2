export interface PublishedPrice {
  listed_price_amount?: number | null;
  listed_price_currency?: string | null;
}

export function formatCatalogPrice(value: number | null | undefined, locale: string, published?: PublishedPrice): string {
  const hasPublishedPrice = published?.listed_price_amount != null && !!published.listed_price_currency;
  const amount = hasPublishedPrice ? published.listed_price_amount : value;
  const currency = hasPublishedPrice ? published.listed_price_currency! : 'EUR';
  if (amount === null || amount === undefined) return locale === 'en' ? 'Price on request' : 'Preț la cerere';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: currency === 'EUR' ? 'symbol' : 'code', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}
