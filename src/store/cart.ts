'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  id: string;
  name: string;
  price_eur: number;
  images: string[];
  category: string;
  condition: string;
  supplier_id: string;
  supplier_name: string;
}

interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  getGroupedBySupplier: () => Record<string, { supplierName: string; items: CartItem[] }>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          // Already in cart, don't add again
          return;
        } else {
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.length,
      getGroupedBySupplier: () => {
        const groups: Record<string, { supplierName: string; items: CartItem[] }> = {};
        for (const item of get().items) {
          const sid = item.product.supplier_id;
          if (!groups[sid]) {
            groups[sid] = { supplierName: item.product.supplier_name, items: [] };
          }
          groups[sid].items.push(item);
        }
        return groups;
      },
    }),
    { name: 'gymbuilder-cart' }
  )
);
