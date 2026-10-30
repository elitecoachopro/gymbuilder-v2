export const markets = [
  { slug: 'asia', name: 'Asia', description: 'Descoperă echipamente și furnizori din Asia.' },
  { slug: 'rest-of-world', name: 'Restul lumii', description: 'Explorează furnizori din Europa și din celelalte regiuni, în afara Asiei și României.' },
  { slug: 'romania', name: 'România', description: 'Găsește echipamente și contactează furnizori din România.' },
] as const;

export type Market = typeof markets[number]['slug'];

export function isMarket(value: string): value is Market {
  return markets.some(market => market.slug === value);
}

export function marketName(value: string | null | undefined) {
  return markets.find(market => market.slug === value)?.name;
}
