'use client';

import Link from 'next/link';

import { Dumbbell, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-anthracite-950 border-t border-anthracite-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="w-7 h-7 text-gold-400" />
              <span className="text-lg font-bold">
                <span className="text-white">Gym</span>
                <span className="text-gold-400">Builder</span>
              </span>
            </Link>
            <p className="text-anthracite-400 text-sm leading-relaxed">
              Platforma completă pentru echipamente de fitness comerciale. 
              Conectăm furnizori verificați cu proprietari de săli.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platformă</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Echipamente</Link></li>
              <li><Link href="/suppliers" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Furnizori</Link></li>
              <li><Link href="/pricing" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Pachete & Prețuri</Link></li>
              <li><Link href="/consultation" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Consultanță</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">Cont</h4>
            <ul className="space-y-3">
              <li><Link href="/register/supplier" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Devino Furnizor</Link></li>
              <li><Link href="/register/client" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Înregistrare Client</Link></li>
              <li><Link href="/login" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Autentificare</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-anthracite-400 text-sm">
                <Mail className="w-4 h-4 text-gold-400" />
                contact@gymbuilder.app
              </li>
              <li className="flex items-center gap-2 text-anthracite-400 text-sm">
                <Phone className="w-4 h-4 text-gold-400" />
                +40 700 000 000
              </li>
              <li className="flex items-center gap-2 text-anthracite-400 text-sm">
                <MapPin className="w-4 h-4 text-gold-400" />
                București, România
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-anthracite-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-anthracite-500 text-sm">
            &copy; {new Date().getFullYear()} GymBuilder. Toate drepturile rezervate.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-anthracite-500 hover:text-gold-400 text-sm transition-colors">
              Termeni & Condiții
            </Link>
            <Link href="#" className="text-anthracite-500 hover:text-gold-400 text-sm transition-colors">
              Politica de Confidențialitate
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
