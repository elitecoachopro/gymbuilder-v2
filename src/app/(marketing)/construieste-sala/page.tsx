'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Building2, ArrowRight, DoorOpen, Lock, Heart, Dumbbell, Cog, Swords, Music, StretchHorizontal, Waves, Coffee, Calculator } from 'lucide-react';

const gymZones = [
  {
    id: 1,
    title: 'Recepție',
    description: 'Mobilier și accesorii recepție — birouri, scaune, sisteme acces, display-uri',
    icon: DoorOpen,
    category: 'reception',
    color: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'hover:border-blue-500/40',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  {
    id: 2,
    title: 'Vestiare',
    description: 'Bănci, dulapuri metalice, cuiere, oglinzi, uscătoare de păr',
    icon: Lock,
    category: 'lockers',
    color: 'from-violet-500/20 to-violet-600/5',
    borderColor: 'hover:border-violet-500/40',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10',
  },
  {
    id: 3,
    title: 'Cardio',
    description: 'Benzi de alergare, biciclete staționare, eliptice, stepper-e, rowing',
    icon: Heart,
    category: 'cardio',
    color: 'from-red-500/20 to-red-600/5',
    borderColor: 'hover:border-red-500/40',
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10',
  },
  {
    id: 4,
    title: 'Greutăți Libere',
    description: 'Gantere, discuri, bare olimpice, rack-uri, suporturi gantere',
    icon: Dumbbell,
    category: 'strength',
    color: 'from-orange-500/20 to-orange-600/5',
    borderColor: 'hover:border-orange-500/40',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
  },
  {
    id: 5,
    title: 'Aparate de Forță',
    description: 'Aparate piept, spate, picioare, umeri — selectorized și plate-loaded',
    icon: Cog,
    category: 'strength',
    color: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'hover:border-emerald-500/40',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: 6,
    title: 'Zona Funcțional / Crossfit',
    description: 'Rack-uri squat, bare pull-up, kettlebell, sănii, cutii pliometrice, frânghii',
    icon: Swords,
    category: 'functional',
    color: 'from-yellow-500/20 to-yellow-600/5',
    borderColor: 'hover:border-yellow-500/40',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
  },
  {
    id: 7,
    title: 'Zona Studio',
    description: 'Oglinzi, bare ballet, saltele yoga/pilates, sisteme sunet, iluminat ambiant',
    icon: Music,
    category: 'accessories',
    color: 'from-pink-500/20 to-pink-600/5',
    borderColor: 'hover:border-pink-500/40',
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/10',
  },
  {
    id: 8,
    title: 'Stretching & Mobility',
    description: 'Saltele, role spumă, benzi elastice, mingi medicinale, echipamente mobilitate',
    icon: StretchHorizontal,
    category: 'accessories',
    color: 'from-teal-500/20 to-teal-600/5',
    borderColor: 'hover:border-teal-500/40',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/10',
  },
  {
    id: 9,
    title: 'Zona Spa & Recovery',
    description: 'Saună, jacuzzi, cadă crioterapie, pistoale masaj, dispozitive recovery',
    icon: Waves,
    category: 'wellness',
    color: 'from-cyan-500/20 to-cyan-600/5',
    borderColor: 'hover:border-cyan-500/40',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10',
  },
  {
    id: 10,
    title: 'Zona Lounge / Bar',
    description: 'Mese, scaune, blender-e, frigidere vitrină, dozatoare apă, espressoare',
    icon: Coffee,
    category: 'reception',
    color: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'hover:border-amber-500/40',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
];

export default function ConstruiesteSalaPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-400/5 via-transparent to-transparent" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 rounded-full px-4 py-1.5 mb-6">
            <Building2 className="w-4 h-4 text-gold-400" />
            <span className="text-gold-400 text-sm font-medium">Planificator Sală Fitness</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Construiește-ți Sala <span className="gold-gradient">de la Zero</span>
          </h1>

          <p className="text-lg text-anthracite-300 max-w-2xl mx-auto leading-relaxed mb-4">
            Alege zona pe care vrei să o echipezi și descoperă toate echipamentele disponibile. 
            Fiecare categorie te duce direct la produsele potrivite.
          </p>

          <p className="text-sm text-anthracite-500 mb-6">
            10 zone · Navigare liberă · Fără cont necesar
          </p>

          <Link
            href="/estimator-buget"
            className="inline-flex items-center gap-2 bg-gold-400 text-anthracite-950 font-bold px-6 py-3 rounded-xl hover:bg-gold-300 transition-colors text-sm"
          >
            <Calculator className="w-4 h-4" />
            Estimează Bugetul Sălii Tale
          </Link>
        </div>
      </section>

      {/* Zones Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-5">
            {gymZones.map((zone) => (
              <Link
                key={zone.id}
                href={`/products?category=${zone.category}`}
                className={`group relative bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 transition-all duration-200 ${zone.borderColor} hover:shadow-lg hover:shadow-black/20`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${zone.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative flex items-start gap-4">
                  <div className={`w-12 h-12 ${zone.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <zone.icon className={`w-6 h-6 ${zone.iconColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-white font-bold text-base group-hover:text-gold-400 transition-colors">
                        {zone.title}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-anthracite-500 group-hover:text-gold-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <p className="text-sm text-anthracite-400 leading-relaxed">
                      {zone.description}
                    </p>
                  </div>
                </div>

                <div className="relative mt-4 pt-3 border-t border-anthracite-700/50">
                  <span className="text-xs text-anthracite-500 group-hover:text-anthracite-300 transition-colors">
                    Click pentru a vedea echipamentele disponibile →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-10">
            <h2 className="text-2xl font-bold text-white mb-3">Nu știi de unde să începi?</h2>
            <p className="text-anthracite-300 mb-6 max-w-lg mx-auto">
              Programează o sesiune de consultanță cu un expert care a deschis mai multe săli de fitness de la zero.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/estimator-buget" className="inline-flex items-center gap-2 bg-gold-400 text-anthracite-950 font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-300 transition-colors">
                <Calculator className="w-4 h-4" />
                Estimează Bugetul
              </Link>
              <Link href="/consultation" className="inline-block bg-anthracite-700 border border-anthracite-600 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-anthracite-600 transition-colors">
                Consultanță — €99/sesiune
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
