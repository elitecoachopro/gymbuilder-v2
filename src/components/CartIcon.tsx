'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const totalItems = useCartStore((s) => s.totalItems);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? totalItems() : 0;

  return (
    <Link
      href="/cos-cerere"
      className="relative p-2 rounded-lg hover:bg-anthracite-700/50 transition-colors"
      aria-label="Coș cerere"
    >
      <ShoppingCart className="w-5 h-5 text-anthracite-300 hover:text-white transition-colors" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gold-400 text-anthracite-950 text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
