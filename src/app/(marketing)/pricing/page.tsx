'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Check, X, Star, Zap, Crown, Rocket, Building2 } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    icon: Star,
    price: 0,
    period: '',
    description: 'Începe gratuit și testează platforma.',
    features: [
      { text: '3 produse listate', included: true },
      { text: '1 imagine per produs', included: true },
      { text: 'Profil de bază', included: true },
      { text: 'Vizibilitate în catalog', included: true },
      { text: 'Promovări', included: false },
      { text: 'Analytics', included: false },
      { text: 'Badge Verificat', included: false },
      { text: 'Suport prioritar', included: false },
    ],
    cta: 'Începe Gratuit',
    popular: false,
  },
  {
    name: 'Starter',
    icon: Zap,
    price: 49,
    period: '/lună',
    description: 'Pentru furnizori care vor să crească.',
    features: [
      { text: '25 produse listate', included: true },
      { text: '5 imagini per produs', included: true },
      { text: 'Profil complet', included: true },
      { text: 'Vizibilitate prioritară', included: true },
      { text: '1 promovare/lună', included: true },
      { text: 'Analytics de bază', included: true },
      { text: 'Badge Verificat', included: false },
      { text: 'Suport prioritar', included: false },
    ],
    cta: 'Alege Starter',
    popular: false,
  },
  {
    name: 'Professional',
    icon: Rocket,
    price: 149,
    period: '/lună',
    description: 'Cel mai popular pachet pentru furnizori serioși.',
    features: [
      { text: '100 produse listate', included: true },
      { text: '10 imagini per produs', included: true },
      { text: 'Profil premium cu video', included: true },
      { text: 'Top vizibilitate', included: true },
      { text: '5 promovări/lună', included: true },
      { text: 'Analytics avansat', included: true },
      { text: 'Badge Verificat', included: true },
      { text: 'Suport prioritar', included: false },
    ],
    cta: 'Alege Professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Crown,
    price: 399,
    period: '/lună',
    description: 'Pentru distribuitori mari și producători.',
    features: [
      { text: 'Produse nelimitate', included: true },
      { text: 'Imagini nelimitate', included: true },
      { text: 'Profil premium cu video', included: true },
      { text: 'Poziție #1 în catalog', included: true },
      { text: 'Promovări nelimitate', included: true },
      { text: 'Analytics complet + export', included: true },
      { text: 'Badge Verificat + Featured', included: true },
      { text: 'Suport dedicat 24/7', included: true },
    ],
    cta: 'Alege Enterprise',
    popular: false,
  },
  {
    name: 'Custom',
    icon: Building2,
    price: null,
    period: '',
    description: 'Soluție personalizată pentru nevoi speciale.',
    features: [
      { text: 'Tot din Enterprise +', included: true },
      { text: 'API access', included: true },
      { text: 'White-label options', included: true },
      { text: 'Integrare ERP/CRM', included: true },
      { text: 'Account manager dedicat', included: true },
      { text: 'SLA garantat', included: true },
      { text: 'Training echipă', included: true },
      { text: 'Dezvoltare custom', included: true },
    ],
    cta: 'Contactează-ne',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Pachete & <span className="gold-gradient">Prețuri</span>
          </h1>
          <p className="text-anthracite-300 text-lg max-w-2xl mx-auto">
            Alege pachetul potrivit pentru afacerea ta. Upgrade sau downgrade oricând.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-b from-gold-400/10 to-anthracite-800 border-2 border-gold-400/50 shadow-lg shadow-gold-400/10'
                    : 'bg-anthracite-800 border border-anthracite-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-anthracite-950 text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <div className="w-10 h-10 bg-gold-400/10 rounded-lg flex items-center justify-center mb-3">
                    <plan.icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-anthracite-400 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">&euro;{plan.price}</span>
                      <span className="text-anthracite-400 text-sm">{plan.period}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-white">La cerere</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-anthracite-600 mt-0.5 shrink-0" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-anthracite-200' : 'text-anthracite-500'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register/supplier"
                  className={`block text-center py-3 rounded-lg text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gold-400 text-anthracite-950 hover:bg-gold-300'
                      : 'border border-gold-400/30 text-gold-400 hover:bg-gold-400/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
