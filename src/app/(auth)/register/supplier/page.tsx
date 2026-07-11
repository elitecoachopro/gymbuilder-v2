'use client';

import Link from 'next/link';
import { Dumbbell, Mail, Lock, Building2, Globe, MapPin, Phone, FileText, Eye, EyeOff, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';

const steps = [
  { id: 1, title: 'Cont', description: 'Date de autentificare' },
  { id: 2, title: 'Companie', description: 'Informații firmă' },
  { id: 3, title: 'Pachet', description: 'Alege planul' },
];

const plans = [
  { id: 'free', name: 'Free', price: 0, desc: '3 produse, profil de bază' },
  { id: 'starter', name: 'Starter', price: 49, desc: '25 produse, promovări' },
  { id: 'professional', name: 'Professional', price: 149, desc: '100 produse, badge verificat', popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 399, desc: 'Nelimitat, suport dedicat' },
];

export default function SupplierRegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-anthracite-950">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-gold-400" />
            <span className="text-2xl font-bold">
              <span className="text-white">Gym</span>
              <span className="text-gold-400">Builder</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Devino Furnizor</h1>
          <p className="text-anthracite-400">Înregistrare în 3 pași simpli.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${step >= s.id ? 'text-gold-400' : 'text-anthracite-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  step > s.id ? 'bg-gold-400 border-gold-400 text-anthracite-950' :
                  step === s.id ? 'border-gold-400 text-gold-400' :
                  'border-anthracite-600 text-anthracite-500'
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-12 h-0.5 mx-2 ${step > s.id ? 'bg-gold-400' : 'bg-anthracite-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-card p-8">
          {/* Step 1: Account */}
          {step === 1 && (
            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume *</label>
                  <input type="text" className="input-field" placeholder="Ion" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Prenume *</label>
                  <input type="text" className="input-field" placeholder="Popescu" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input type="email" className="input-field pl-11" placeholder="email@companie.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Parolă *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-11 pr-11"
                    placeholder="Minim 8 caractere"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-anthracite-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                Continuă <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: Company */}
          {step === 2 && (
            <form className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume Companie *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input type="text" className="input-field pl-11" placeholder="SC Exemplu SRL" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Țară *</label>
                  <select className="input-field">
                    <option value="">Selectează...</option>
                    <option value="Romania">România</option>
                    <option value="Germany">Germania</option>
                    <option value="Italy">Italia</option>
                    <option value="Poland">Polonia</option>
                    <option value="Sweden">Suedia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Oraș *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                    <input type="text" className="input-field pl-11" placeholder="București" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input type="url" className="input-field pl-11" placeholder="https://www.exemplu.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input type="tel" className="input-field pl-11" placeholder="+40 7XX XXX XXX" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Descriere companie</label>
                <textarea className="input-field min-h-[100px] resize-y" placeholder="Descrie pe scurt activitatea companiei..." />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Înapoi
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
                >
                  Continuă <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Plan */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-anthracite-300 mb-4">Alege pachetul care ți se potrivește. Poți face upgrade oricând.</p>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      selectedPlan === plan.id
                        ? 'border-gold-400 bg-gold-400/5'
                        : 'border-anthracite-700 hover:border-anthracite-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{plan.name}</span>
                          {plan.popular && (
                            <span className="text-xs bg-gold-400/10 text-gold-400 px-2 py-0.5 rounded-full">Popular</span>
                          )}
                        </div>
                        <p className="text-xs text-anthracite-400 mt-0.5">{plan.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">&euro;{plan.price}</span>
                        {plan.price > 0 && <span className="text-xs text-anthracite-400">/lună</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-2 mt-4">
                <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded border-anthracite-600 bg-anthracite-800 text-gold-400 focus:ring-gold-400" />
                <label htmlFor="terms" className="text-xs text-anthracite-400">
                  Accept <Link href="#" className="text-gold-400">Termenii și Condițiile</Link> și{' '}
                  <Link href="#" className="text-gold-400">Politica de Confidențialitate</Link>.
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Înapoi
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1 py-3.5"
                >
                  Finalizează Înregistrarea
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-anthracite-400">
            Ai deja cont?{' '}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
              Autentifică-te
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
