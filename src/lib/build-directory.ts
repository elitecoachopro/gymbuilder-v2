import data from '@/data/build-directory.json';

export interface BuildText { ro: string; en: string }
export interface BuildCategory { slug: string; name: BuildText; group: string }
export interface BuildSupplier {
  id: string; name: string; country: string; contactUrl: string;
  phone: string | null; email: string | null;
}
export interface BuildListing {
  id: string; name: string; categories: string[]; supplierId: string;
  kind: string; sourceUrl: string; imageUrl: string;
  price: number | null; priceMax?: number | null; priceFrom?: boolean;
  currency: string; priceNote: BuildText; checkedAt: string;
}
export const buildDirectory: { categories: BuildCategory[]; suppliers: BuildSupplier[]; products: BuildListing[] } = data;
export const buildGroups: Record<string, BuildText> = {
  fitout: { ro: 'Amenajare și utilități', en: 'Fitout and utilities' },
  facilities: { ro: 'Spații pentru clienți', en: 'Customer facilities' },
  training: { ro: 'Echipamente de antrenament', en: 'Training equipment' },
  services: { ro: 'Dotări și servicii', en: 'Amenities and services' },
};
