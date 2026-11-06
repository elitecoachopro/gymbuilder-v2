export const WEB_PROMOTIONS = {
 super_pret: { name: 'Super preț', amount: 1200, hours: 12 },
 oferta_zilei: { name: 'Oferta zilei', amount: 2000, hours: 24 },
 anunturile_zilei: { name: 'Ofertele săptămânii', amount: 1000, hours: 168 },
} as const;
export type WebPromotionType = keyof typeof WEB_PROMOTIONS;
