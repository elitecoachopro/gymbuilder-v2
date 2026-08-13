'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, Building2, Globe, MapPin, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Loader2, CheckCircle, AlertCircle, Camera, X, Upload,  } from 'lucide-react';
import { useState, useRef } from 'react';
import { useClientTranslations } from '@/i18n/client';

export default function SupplierRegisterPage() {
  const { t } = useClientTranslations('auth');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [registrationToken] = useState(() => {
    // Generate a unique token for this registration session (used for photo uploads)
    const arr = new Uint8Array(16);
    if (typeof window !== 'undefined') {
      window.crypto.getRandomValues(arr);
    }
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  });

  const steps = [
    { id: 1, title: 'Cont', description: 'Date de acces' },
    { id: 2, title: 'Firmă', description: 'Identificare & contact' },
    { id: 3, title: 'Poze', description: 'Verificare identitate' },
    { id: 4, title: 'Plan', description: 'Abonament' },
  ];

  const plans = [
    { id: 'free', name: 'Free', price: 0, desc: t('planFreeDesc') },
    { id: 'starter', name: 'Starter', price: 49, desc: t('planStarterDesc') },
    { id: 'professional', name: 'Professional', price: 149, desc: t('planProDesc'), popular: true },
    { id: 'enterprise', name: 'Enterprise', price: 399, desc: t('planEnterpriseDesc') },
  ];

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
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
      setError(t('requiredFields'));
      return false;
    }
    if (form.password.length < 8) {
      setError(t('passwordMin'));
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('passwordsMismatch'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError(t('invalidEmail'));
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!form.companyName || !form.country || !form.city) {
      setError(t('companyRequired'));
      return false;
    }
    if (!form.phone || form.phone.trim().length < 6) {
      setError('Numărul de telefon/WhatsApp este obligatoriu.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep3 = () => {
    if (photos.length < 3) {
      setError('Trebuie să încărcați minim 3 poze de verificare (showroom, depozit, echipă sau birou).');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = (nextStep: number) => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(nextStep);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        if (photos.length + i >= 10) break; // Max 10 photos

        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError(`Fișierul "${file.name}" depășește 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('token', registrationToken);

        const res = await fetch('/api/upload/registration', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setPhotos(prev => [...prev, data.url]);
        } else {
          const data = await res.json();
          setError(data.error || 'Eroare la upload.');
        }
      }
    } catch {
      setError('Eroare la încărcarea pozelor. Încearcă din nou.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.terms) {
      setError(t('acceptTerms'));
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
          phone: form.phone,
          description: form.description || undefined,
          plan: selectedPlan,
          verificationPhotos: photos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('registerError'));
        return;
      }

      setSuccess(data.message || t('supplierRegisterSuccess'));

      setTimeout(() => {
        router.push('/login');
      }, 4000);
    } catch (err) {
      setError(t('connectionError'));
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
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">{t('becomeSupplier')}</h1>
          <p className="text-anthracite-400">{t('supplierSubtitle')}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-1.5 ${step >= s.id ? 'text-gold-400' : 'text-anthracite-500'}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 ${
                  step > s.id ? 'bg-gold-400 border-gold-400 text-anthracite-950' :
                  step === s.id ? 'border-gold-400 text-gold-400' :
                  'border-anthracite-600 text-anthracite-500'
                }`}>
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 sm:w-10 h-0.5 mx-1 ${step > s.id ? 'bg-gold-400' : 'bg-anthracite-700'}`} />
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
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('firstName')} *</label>
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
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('lastName')} *</label>
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
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('password')} *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-11 pr-11"
                    placeholder={t('passwordPlaceholder')}
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

              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('confirmPassword')} *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field pl-11 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}`}
                    placeholder={t('confirmPasswordPlaceholder')}
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    disabled={loading}
                  />
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {t('passwordsMismatch')}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                {t('continue')} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: Company + Contact */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(3); }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('companyName')} *</label>
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
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('country')} *</label>
                  <select
                    className="input-field"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">{t('selectCountry')}</option>
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
                    <option value="China">China</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('city')} *</label>
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
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Telefon / WhatsApp *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input
                    type="tel"
                    className="input-field pl-11"
                    placeholder="+40 7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <p className="text-xs text-anthracite-500 mt-1">Vizibil pe profilul public. Clienții vă pot contacta direct.</p>
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
                <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('companyDescription')}</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  placeholder={t('companyDescPlaceholder')}
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
                  <ArrowLeft className="w-4 h-4" /> {t('back')}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2"
                >
                  {t('continue')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Verification Photos */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-gold-400" />
                  Poze de verificare
                </h3>
                <p className="text-sm text-anthracite-400 mb-1">
                  Încărcați minim <strong className="text-gold-400">3 poze</strong> care demonstrează că sunteți un furnizor real:
                </p>
                <ul className="text-xs text-anthracite-500 list-disc list-inside mb-4 space-y-0.5">
                  <li>Showroom sau magazin fizic</li>
                  <li>Depozit cu echipamente</li>
                  <li>Echipă sau birou</li>
                  <li>Produse în stoc</li>
                </ul>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-3">
                {photos.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-anthracite-700 group">
                    <img src={url} alt={`Verificare ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-anthracite-900/80 text-xs text-white px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}

                {/* Upload Button */}
                {photos.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="aspect-square rounded-lg border-2 border-dashed border-anthracite-600 hover:border-gold-400 flex flex-col items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-anthracite-400" />
                        <span className="text-xs text-anthracite-400">Adaugă</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />

              {/* Counter */}
              <div className={`text-sm font-medium ${photos.length >= 3 ? 'text-green-400' : 'text-amber-400'}`}>
                {photos.length >= 3 ? (
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {photos.length}/10 poze încărcate — cerința minimă îndeplinită</span>
                ) : (
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {photos.length}/3 poze minime — mai adăugați {3 - photos.length}</span>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('back')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNext(4)}
                  disabled={photos.length < 3}
                  className={`flex-1 py-3.5 flex items-center justify-center gap-2 rounded-lg font-medium transition-all ${
                    photos.length >= 3
                      ? 'btn-primary'
                      : 'bg-anthracite-700 text-anthracite-500 cursor-not-allowed'
                  }`}
                >
                  {t('continue')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Plan */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-anthracite-300 mb-4">{t('choosePlan')}</p>

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
                        {plan.price > 0 && <span className="text-xs text-anthracite-400">/{t('month')}</span>}
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
                  {t('acceptTermsLabel')} <Link href="/terms" className="text-gold-400">{t('termsLink')}</Link> {t('and')}{' '}
                  <Link href="/privacy" className="text-gold-400">{t('privacyLink')}</Link>.
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('back')}
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
                      {t('processing')}
                    </>
                  ) : (
                    t('finishRegistration')
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-anthracite-400">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
              {t('loginButton')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
