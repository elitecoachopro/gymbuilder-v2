'use client';

import { useUiText } from '@/i18n/useUiText';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const ui = useUiText();
  const itemCount = useCartStore((s) => s.items.length);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? itemCount : 0;

  return (
    <Link
      href="/cos-cerere"
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center p-2 rounded-lg hover:bg-anthracite-700/50 transition-colors"
      aria-label={`${ui("Cererea mea")} (${count})`}
    >
      <ShoppingCart className="w-5 h-5 text-anthracite-300 hover:text-white transition-colors" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gold-400 text-anthracite-950 text-[10px] font-bold rounded-full flex items-center justify-center">
          {ui(count > 9 ? '9+' : count)}
        </span>
      )}
    </Link>
  );
}
