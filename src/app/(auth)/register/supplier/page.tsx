'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, Building2, Globe, MapPin, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    country: '',
    city: '',
    website: '',
    phone: '',
    description: '',
    terms: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Toate câmpurile marcate cu * sunt obligatorii.');
      return false;
    }
    if (form.password.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Adresa de email nu este validă.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!form.companyName || !form.country || !form.city) {
      setError('Numele companiei, țara și orașul sunt obligatorii.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = (nextStep: number) => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!form.terms) {
      setError('Trebuie să accepți Termenii și Condițiile.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register/supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          country: form.country,
          city: form.city,
          website: form.website || undefined,
          phone: form.phone || undefined,
          description: form.description || undefined,
          plan: selectedPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Eroare la înregistrare.');
        return;
      }

      setSuccess(data.message || 'Înregistrare completă! Verifică emailul.');

      // Redirect to login after 4 seconds
      setTimeout(() => {
        router.push('/login');
      }, 4000);
    } catch (err) {
      setError('Eroare de conexiune. Verifică conexiunea la internet.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Messages */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-card p-8">
          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(2); }} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ion"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Prenume *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Popescu"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type="email"
                    className="input-field pl-11"
                    placeholder="email@companie.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={loading}
                  />
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
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    disabled={loading}
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
                type="submit"
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                Continuă <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: Company */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(3); }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume Companie *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type="text"
                    className="input-field pl-11"
                    placeholder="SC Exemplu SRL"
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Țară *</label>
                  <select
                    className="input-field"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Selectează...</option>
                    <option value="Romania">România</option>
                    <option value="Germany">Germania</option>
                    <option value="Italy">Italia</option>
                    <option value="Poland">Polonia</option>
                    <option value="Sweden">Suedia</option>
                    <option value="Hungary">Ungaria</option>
                    <option value="Bulgaria">Bulgaria</option>
                    <option value="Czech Republic">Cehia</option>
                    <option value="Austria">Austria</option>
                    <option value="France">Franța</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Oraș *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                    <input
                      type="text"
                      className="input-field pl-11"
                      placeholder="București"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type="url"
                    className="input-field pl-11"
                    placeholder="https://www.exemplu.com"
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type="tel"
                    className="input-field pl-11"
                    placeholder="+40 7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Descriere companie</label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  placeholder="Descrie pe scurt activitatea companiei..."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  disabled={loading}
                />
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
                  type="submit"
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
                    disabled={loading}
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
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 rounded border-anthracite-600 bg-anthracite-800 text-gold-400 focus:ring-gold-400"
                  checked={form.terms}
                  onChange={(e) => updateField('terms', e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor="terms" className="text-xs text-anthracite-400">
                  Accept <Link href="#" className="text-gold-400">Termenii și Condițiile</Link> și{' '}
                  <Link href="#" className="text-gold-400">Politica de Confidențialitate</Link>.
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Înapoi
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Se procesează...
                    </>
                  ) : (
                    'Finalizează Înregistrarea'
                  )}
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
