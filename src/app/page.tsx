'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Star, ArrowRight, Flame, Dumbbell, Megaphone, Loader2, Sparkles, RefreshCw, Building2 } from 'lucide-react';

interface OfertaZilei {
  id: string;
  title: string;
  description: string | null;
  price_eur: number;
  supplier_profiles?: { company_name: string; country: string } | null;
  products?: { name: string; brand: string; images: string[] | null; category: string } | null;
}

interface AnuntZilei {
  id: string;
  title: string;
  description: string | null;
  price_eur: number;
  supplier_profiles?: { company_name: string; country: string } | null;
  products?: { name: string; brand: string; images: string[] | null; category: string } | null;
}

export default function HomePage() {
  const [ofertaZilei, setOfertaZilei] = useState<OfertaZilei | null>(null);
  const [anunturiZilei, setAnunturiZilei] = useState<AnuntZilei[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ products: number; suppliers: number; brands: number }>({ products: 0, suppliers: 0, brands: 0 });

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await fetch('/api/promotions');
        if (res.ok) {
          const data = await res.json();
          setOfertaZilei(data.ofertaZilei || null);
          setAnunturiZilei(data.anunturiZilei || []);
        }
      } catch {
        // Keep null/empty state - will show "no offers" message
      } finally {
        setLoading(false);
      }
    }
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {}
    }
    fetchPromotions();
    fetchStats();
  }, []);

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
              Deschizi o sală de fitness sau vrei să o modernizezi? GymBuilder îți pune la dispoziție cel mai complet catalog de echipamente fitness din Europa, instrumente de planificare și experți care au trecut prin același drum.
            </p>

            {/* 3 Main CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CTA 1 - Echipamente Noi */}
              <Link href="/products?condition=new" className="group bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 text-left hover:border-emerald-500/40 transition-all duration-200">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Echipamente Noi</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">Echipamente noi de la distribuitori autorizați și producători premium din toată Europa.</p>
                <span className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm group-hover:gap-3 transition-all">
                  VEZI CATALOG NOU <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* CTA 2 - Second-Hand */}
              <Link href="/products?condition=used" className="group bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 text-left hover:border-amber-500/40 transition-all duration-200">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <RefreshCw className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Second-Hand</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">Echipamente verificate și recondiţionate la prețuri accesibile. Economisești până la 60%.</p>
                <span className="inline-flex items-center gap-2 text-amber-400 font-bold text-sm group-hover:gap-3 transition-all">
                  VEZI SECOND-HAND <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* CTA 3 - Construiește-ți sala */}
              <Link href="/construieste-sala" className="group bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 text-left hover:border-gold-400/40 transition-all duration-200">
                <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-400/20 transition-colors">
                  <Building2 className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Construiește-ți Sala de la 0</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">Planifică fiecare zonă a sălii tale. 10 categorii pe zone, de la recepție la zona spa.</p>
                <span className="inline-flex items-center gap-2 text-gold-400 font-bold text-sm group-hover:gap-3 transition-all">
                  PLANIFICĂ SALA <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            {/* Secondary links */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              <Link href="/register/supplier" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                Ești furnizor? Înregistrează-te gratuit <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/consultation" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                Consultanță personalizată — €99/sesiune <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/about" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                Despre GymBuilder <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.products}</div>
                <div className="text-sm text-anthracite-400 mt-1">Produse</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.suppliers}</div>
                <div className="text-sm text-anthracite-400 mt-1">Furnizori</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.brands}</div>
                <div className="text-sm text-anthracite-400 mt-1">Branduri</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Oferta Zilei */}
      <section className="py-16 px-4 bg-anthracite-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="w-6 h-6 text-gold-400" />
            <h2 className="text-2xl font-bold text-white">Oferta Zilei</h2>
          </div>

          {loading ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-12 text-center">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">Se încarcă oferta...</p>
            </div>
          ) : ofertaZilei ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="h-64 md:h-72 bg-anthracite-700 flex items-center justify-center">
                  {ofertaZilei.products?.images && ofertaZilei.products.images.length > 0 ? (
                    <img 
                      src={ofertaZilei.products.images[0]} 
                      alt={ofertaZilei.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Dumbbell className="w-20 h-20 text-anthracite-500" />
                  )}
                </div>
                {/* Details */}
                <div className="p-8 flex flex-col justify-center">
                  <span className="inline-flex items-center gap-1.5 bg-gold-400/10 border border-gold-400/20 rounded-full px-3 py-1 text-xs font-bold text-gold-400 w-fit mb-4">
                    <Flame className="w-3 h-3" /> OFERTA ZILEI
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{ofertaZilei.title}</h3>
                  <p className="text-sm text-anthracite-400 mb-3">
                    de la {ofertaZilei.supplier_profiles?.company_name || 'Furnizor'}
                    {ofertaZilei.products?.brand && ` · ${ofertaZilei.products.brand}`}
                  </p>
                  {ofertaZilei.description && (
                    <p className="text-sm text-anthracite-300 mb-5 leading-relaxed">{ofertaZilei.description}</p>
                  )}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-2xl font-bold text-gold-400">&euro;{Number(ofertaZilei.price_eur).toLocaleString()}</span>
                  </div>
                  <Link href="/products" className="inline-block bg-gold-400 text-anthracite-950 font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors w-fit">
                    Vezi Oferta
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-12 text-center">
              <Dumbbell className="w-12 h-12 text-anthracite-600 mx-auto mb-4" />
              <p className="text-anthracite-400">Nicio ofertă disponibilă momentan</p>
            </div>
          )}
        </div>
      </section>

      {/* Anunțurile Zilei */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Megaphone className="w-6 h-6 text-gold-400" />
            <h2 className="text-2xl font-bold text-white">Anunțurile Zilei</h2>
          </div>

          {loading ? (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-12 text-center">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto mb-3" />
              <p className="text-anthracite-400 text-sm">Se încarcă anunțurile...</p>
            </div>
          ) : anunturiZilei.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {anunturiZilei.map((item) => (
                <div key={item.id} className="min-w-[280px] max-w-[300px] bg-anthracite-800 border border-anthracite-700 rounded-2xl overflow-hidden flex-shrink-0 snap-start">
                  {/* Image */}
                  <div className="h-40 bg-anthracite-700 flex items-center justify-center">
                    {item.products?.images && item.products.images.length > 0 ? (
                      <img 
                        src={item.products.images[0]} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Dumbbell className="w-12 h-12 text-anthracite-500" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-anthracite-400 mb-3">
                      de la {item.supplier_profiles?.company_name || 'Furnizor'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gold-400">&euro;{Number(item.price_eur).toLocaleString()}</span>
                      <Link href="/products" className="text-xs font-medium text-gold-400 hover:text-gold-300 flex items-center gap-1">
                        Detalii <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-12 text-center">
              <Megaphone className="w-12 h-12 text-anthracite-600 mx-auto mb-4" />
              <p className="text-anthracite-400">Niciun anunț disponibil</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
