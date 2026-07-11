'use client';

import Link from 'next/link';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Dumbbell, Users, TrendingUp, Shield, Star, Clock, Zap, ArrowRight, Flame, Megaphone } from 'lucide-react';

const features = [
  { icon: Dumbbell, title: 'Echipamente Premium', desc: 'Mii de produse de la furnizori verificați din toată Europa.' },
  { icon: Users, title: 'Rețea de Furnizori', desc: 'Conectează-te cu furnizori de încredere și construiește relații de business.' },
  { icon: TrendingUp, title: 'Crește-ți Afacerea', desc: 'Furnizori pot ajunge la piețe noi și își pot extinde baza de clienți.' },
  { icon: Shield, title: 'Calitate Garantată', desc: 'Toate produsele sunt verificate pentru calitate și autenticitate.' },
];

const ofertaZilei = {
  id: 1,
  name: 'Technogym Skillmill Connect',
  price: 6900,
  oldPrice: 8500,
  brand: 'Technogym',
  category: 'Cardio',
  description: 'Banda de alergare profesională cu conectivitate avansată, ecran tactil HD și programe personalizate. Ideală pentru săli de fitness comerciale cu trafic intens.',
  image: '/images/technogym-skillmill.jpg',
};

const anunturiZilei = [
  { id: 1, title: 'Lot 50 Gantere Chrome 1-50kg', supplier: 'FitPro Equipment', price: 12000, city: 'București' },
  { id: 2, title: 'Set Complet Cardio - 20 aparate', supplier: 'GymTech Solutions', price: 45000, city: 'Cluj-Napoca' },
  { id: 3, title: 'Rack-uri Squat x10 + Bare Olimpice', supplier: 'IronWorks RO', price: 8500, city: 'Timișoara' },
];

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

            <p className="text-xl text-anthracite-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Conectăm furnizori de echipamente fitness cu proprietari de săli din toată Europa. 
              Găsește, compară și achiziționează echipamente premium.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/products" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
                Explorează Echipamente
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/register/supplier" className="btn-secondary text-base px-8 py-4">
                Devino Furnizor
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

      {/* Oferta Zilei */}
      <section className="py-20 px-4 bg-anthracite-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <Flame className="w-8 h-8 text-red-500" />
            <h2 className="section-title">Oferta Zilei</h2>
            <span className="ml-auto flex items-center gap-2 text-anthracite-400 text-sm">
              <Clock className="w-4 h-4" />
              Se termină în 23:59:59
            </span>
          </div>

          <div className="card-hover relative overflow-hidden max-w-4xl mx-auto">
            <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg z-10">
              -{Math.round((1 - ofertaZilei.price / ofertaZilei.oldPrice) * 100)}% REDUCERE
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="h-64 md:h-80 bg-anthracite-700 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-24 h-24 text-anthracite-500" />
              </div>
              {/* Details */}
              <div className="flex flex-col justify-center py-4">
                <span className="text-sm text-gold-400 font-medium mb-2">{ofertaZilei.brand} &middot; {ofertaZilei.category}</span>
                <h3 className="text-2xl md:text-3xl text-white font-bold mb-4">{ofertaZilei.name}</h3>
                <p className="text-anthracite-300 mb-6 leading-relaxed">{ofertaZilei.description}</p>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl font-bold text-gold-400">&euro;{ofertaZilei.price.toLocaleString()}</span>
                  <span className="text-lg text-anthracite-400 line-through">&euro;{ofertaZilei.oldPrice.toLocaleString()}</span>
                </div>
                <Link href="/products" className="btn-primary inline-flex items-center gap-2 w-fit px-6 py-3">
                  Vezi Oferta <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anunțurile Zilei */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <Megaphone className="w-8 h-8 text-gold-400" />
            <h2 className="section-title">Anunțurile Zilei</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {anunturiZilei.map((item) => (
              <div key={item.id} className="card-hover">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-400/10 text-gold-400 border border-gold-400/20">
                    Nou
                  </span>
                  <span className="text-xs text-anthracite-400">{item.city}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-anthracite-400 mb-4">de la {item.supplier}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gold-400">&euro;{item.price.toLocaleString()}</span>
                  <Link href="/products" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                    Detalii <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-anthracite-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">De Ce <span className="gold-gradient">GymBuilder</span>?</h2>
            <p className="text-anthracite-300 max-w-2xl mx-auto">
              Platforma completă pentru echipamente de fitness comerciale din Europa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card-hover text-center">
                <div className="w-14 h-14 bg-gold-400/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-gold-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-anthracite-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12">
            <Zap className="w-12 h-12 text-gold-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Gata să începi?
            </h2>
            <p className="text-anthracite-300 mb-8 max-w-xl mx-auto">
              Înregistrează-te gratuit și conectează-te cu furnizori de echipamente fitness din toată Europa.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register/client" className="btn-primary px-8 py-4">
                Creează Cont Gratuit
              </Link>
              <Link href="/consultation" className="btn-secondary px-8 py-4">
                Consultanță Gratuită
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
