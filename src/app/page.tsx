'use client';

import Link from 'next/link';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Star, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-400/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold-400/3 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 rounded-full px-4 py-1.5 mb-8">
              <Star className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">Platforma #1 pentru echipamente de fitness comerciale</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Construiește Sala
              <span className="block gold-gradient">Perfectă</span>
            </h1>

            <p className="text-xl text-anthracite-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Conectăm furnizori de echipamente fitness cu proprietari de săli din toată Europa. 
              Găsește, compară și achiziționează echipamente premium.
            </p>

            {/* 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 - CLIENT */}
              <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 text-left">
                <span className="text-xs font-bold text-gold-400 tracking-wider uppercase mb-3 block">Client</span>
                <h3 className="text-xl font-bold text-white mb-3">Deschizi o sală de fitness?</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">Găsește echipamente premium la prețuri corecte direct de la furnizori verificați din toată lumea.</p>
                <Link href="/products" className="inline-block bg-gold-400 text-anthracite-950 font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors">
                  CAUTĂ ECHIPAMENTE
                </Link>
              </div>

              {/* Card 2 - FURNIZOR */}
              <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 text-left">
                <span className="text-xs font-bold text-gold-400 tracking-wider uppercase mb-3 block">Furnizor</span>
                <h3 className="text-xl font-bold text-white mb-3">Ești furnizor de echipamente?</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">Promovează-te gratuit și ajunge la proprietarii de săli din toată Europa și din întreaga lume.</p>
                <Link href="/register/supplier" className="inline-block bg-gold-400 text-anthracite-950 font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors">
                  DEVINO FURNIZOR
                </Link>
              </div>

              {/* Card 3 - CONSULTANȚĂ */}
              <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 text-left">
                <span className="text-xs font-bold text-gold-400 tracking-wider uppercase mb-3 block">Consultanță</span>
                <h3 className="text-xl font-bold text-white mb-3">Vrei să deschizi o sală?</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">Consultanță personalizată de la un antreprenor care a deschis mai multe săli de fitness de la zero.</p>
                <Link href="/consultation" className="inline-block bg-gold-400 text-anthracite-950 font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors">
                  REZERVĂ CONSULTANȚĂ
                </Link>
              </div>
            </div>

            {/* Link to About */}
            <div className="mt-8">
              <Link href="/about" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                Află povestea din spatele GymBuilder <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold text-gold-400">500+</div>
                <div className="text-sm text-anthracite-400 mt-1">Produse</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">50+</div>
                <div className="text-sm text-anthracite-400 mt-1">Furnizori</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">16+</div>
                <div className="text-sm text-anthracite-400 mt-1">Branduri</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
