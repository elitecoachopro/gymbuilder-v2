'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareProduct {
  id: string | number;
  name: string;
  price: number;
  category: string;
  condition: string;
  brand: string;
  supplier: string;
  images?: string[];
}

interface CompareState {
  items: CompareProduct[];
  addItem: (product: CompareProduct) => boolean;
  removeItem: (productId: string | number) => void;
  clearAll: () => void;
  isInCompare: (productId: string | number) => boolean;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        if (items.length >= MAX_COMPARE) return false;
        if (items.some((i) => i.id === product.id)) return false;
        set({ items: [...items, product] });
        return true;
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },
      clearAll: () => set({ items: [] }),
      isInCompare: (productId) => get().items.some((i) => i.id === productId),
    }),
    { name: 'gymbuilder-compare' }
  )
);
