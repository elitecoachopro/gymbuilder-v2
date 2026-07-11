'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ShoppingCart, User, Dumbbell } from 'lucide-react';

const navLinks = [
  { href: '/suppliers', label: 'Furnizori' },
  { href: '/products', label: 'Echipamente' },
  { href: '/pricing', label: 'Pachete' },
  { href: '/consultation', label: 'Consultanță' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-anthracite-950/80 backdrop-blur-xl border-b border-anthracite-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Dumbbell className="w-8 h-8 text-gold-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xl font-bold">
              <span className="text-white">Gym</span>
              <span className="text-gold-400">Builder</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn-ghost text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Autentificare
            </Link>
            <Link href="/register/supplier" className="btn-primary text-sm">
              Devino Furnizor
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-anthracite-300 hover:text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-anthracite-900 border-b border-anthracite-700">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-anthracite-200 hover:text-white hover:bg-anthracite-800 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-anthracite-700 space-y-2">
              <Link href="/login" className="block px-4 py-3 text-anthracite-200 hover:text-white">
                Autentificare
              </Link>
              <Link href="/register/supplier" className="block btn-primary text-center text-sm">
                Devino Furnizor
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
