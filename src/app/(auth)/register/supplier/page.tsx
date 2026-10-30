'use client';

import VerificationResult from '@/components/VerificationResult';
import { requestedPlan } from '@/lib/journeys';
import { useSearchParams } from 'next/navigation';
import { useUiText } from '@/i18n/useUiText';
import { supplierCountries } from '@/lib/supplier-countries';
import { isStrongPassword } from '@/lib/sanitize';
import { parsePublicContactEmail } from '@/lib/supplier-contact';
import Image from 'next/image';

import Link from 'next/link';
import { Mail, Lock, Building2, Globe, MapPin, Phone, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Loader2, CheckCircle, AlertCircle, Camera, X, Upload,  } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useClientTranslations } from '@/i18n/client';

export default function SupplierRegisterPage() {
  const ui = useUiText();
  const { t, locale } = useClientTranslations('auth');
  const countries = useMemo(() => supplierCountries(locale), [locale]);
  const [step, setStep] = useState(1);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { stepHeadingRef.current?.focus(); }, [step]);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(() => requestedPlan(searchParams?.get('plan') ?? null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photos, setPhotos] = useState<{ path: string; url: string }[]>([]);
  const [restoringPhotos, setRestoringPhotos] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => {
    if (step !== 3) return;
    const controller = new AbortController();
    setRestoringPhotos(true);
    fetch('/api/upload/registration/session', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Previzualizarea nu a putut fi creata.');
      if (!controller.signal.aborted) setPhotos(data.photos || []);
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Conexiune indisponibila.'); })
      .finally(() => { if (!controller.signal.aborted) setRestoringPhotos(false); });
    return () => controller.abort();
  }, [step]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 1, title: locale === 'en' ? 'Account' : 'Cont' },
    { id: 2, title: locale === 'en' ? 'Company' : 'Firmă' },
    { id: 3, title: locale === 'en' ? 'Verification' : 'Verificare' },
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
    contactEmail: '',
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
    const passwordCheck = isStrongPassword(form.password);
    if (!passwordCheck.valid) {
      setError(locale === 'en' ? 'Use 8–128 characters, an uppercase letter, a lowercase letter and a number.' : passwordCheck.message);
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
    if (!parsePublicContactEmail(form.contactEmail).valid) {
      setError(locale === 'en' ? 'Enter a valid public contact email or leave the field empty.' : 'Introdu un email public de contact valid sau lasă câmpul gol.');
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
    setError('');
    setStep(nextStep);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    setError('');

    try {
      const sessionResponse = await fetch('/api/upload/registration/session', { method: 'POST' });
      if (!sessionResponse.ok) {
        const data = await sessionResponse.json();
        setError(data.error || 'Sesiunea de upload nu a putut fi creata.');
        return;
      }
      const existingCount = sessionResponse.status === 201 ? 0 : photos.length;
      if (sessionResponse.status === 201) setPhotos([]);
      for (let i = 0; i < files.length; i++) {
        if (existingCount + i >= 10) break; // Max 10 photos

        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setError(`Fișierul "${file.name}" depășește 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload/registration', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setPhotos(prev => [...prev, { path: data.path, url: data.url }]);
        } else {
          const data = await res.json();
          if (res.status === 401) { setPhotos([]); setError('Sesiunea pozelor a expirat. Încarcă din nou pozele de verificare.'); break; }
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

  const removePhoto = async (index: number) => {
    const path = photos[index].path;
    try {
      const response = await fetch('/api/upload/registration', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
      if (response.status === 401) { setPhotos([]); setError('Sesiunea pozelor a expirat. Încarcă din nou pozele de verificare.'); return; }
      if (!response.ok) { setError('Poza nu a putut fi stearsa. Incearca din nou.'); return; }
      setPhotos(prev => prev.filter(photo => photo.path !== path));
    } catch { setError('Conexiune indisponibila.'); }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) { setStep(1); return; }
    if (!validateStep2()) { setStep(2); return; }
    if (!validateStep3()) return;
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
          contactEmail: form.contactEmail.trim() || undefined,
          description: form.description || undefined,
          plan: selectedPlan,
          verificationPhotos: photos.map(photo => photo.path),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('registerError'));
        return;
      }

      setSuccess(`${data.message || t('supplierRegisterSuccess')} ${selectedPlan !== 'free' ? t('paidPlanPending') : ''}`);

    } catch {
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
          <Link href="/" className="inline-flex"><Image src="/logo-bold-v2.png" alt="Gym Builder" width={1120} height={488} className="h-20 w-auto rounded object-contain" /></Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">{t('becomeSupplier')}</h1>
          <p className="text-anthracite-300">{locale === 'en' ? 'Create your account, verify your company and publish your equipment after approval.' : 'Creează contul, verifică firma și publică echipamentele după aprobare.'}</p>
          <p className="mt-3 text-sm text-gold-400">{locale === 'en' ? `Requested plan: ${selectedPlan} · No payment at registration` : `Plan solicitat: ${selectedPlan} · Fără plată la înregistrare`}</p>
        </div>

        {/* Progress Steps */}
        <nav aria-label={locale === 'en' ? 'Registration steps' : 'Pașii înregistrării'} className="flex items-center justify-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} aria-current={step === s.id ? 'step' : undefined} className="flex items-center">
              <div className={`flex items-center gap-1.5 ${step >= s.id ? 'text-gold-400' : 'text-anthracite-500'}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 ${
                  step > s.id ? 'bg-gold-400 border-gold-400 text-anthracite-950' :
                  step === s.id ? 'border-gold-400 text-gold-400' :
                  'border-anthracite-600 text-anthracite-500'
                }`}>
                  {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span className="text-xs font-medium">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 sm:w-10 h-0.5 mx-1 ${step > s.id ? 'bg-gold-400' : 'bg-anthracite-700'}`} />
              )}
            </div>
          ))}
        </nav>

        {/* Messages */}
        {success && <VerificationResult email={form.email} message={`${success} ${locale === 'en' ? 'Your company will be reviewed before publication.' : 'Firma va fi verificată înainte de publicare.'}`} />}
        {error && (
          <div ref={errorRef} role="alert" tabIndex={-1} className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{ui(error)}</p>
          </div>
        )}

        {/* Form Card */}
        {!success && <div className="glass-card p-5 sm:p-8">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="mb-5 scroll-mt-40 text-lg font-semibold text-white outline-none">{locale === 'en' ? `Step ${step} of 3` : `Pasul ${step} din 3`} · {steps[step - 1].title}</h2>
          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(2); }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="auth-register-supplier-0" className="block text-sm font-medium text-anthracite-200 mb-1.5">{locale === 'en' ? 'First name' : 'Prenume'} *</label>
                  <input id="auth-register-supplier-0"
                    required
                    autoComplete="given-name"
                    type="text"
                    className="input-field"
                    placeholder="Ion"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="auth-register-supplier-1" className="block text-sm font-medium text-anthracite-200 mb-1.5">{locale === 'en' ? 'Last name' : 'Nume'} *</label>
                  <input id="auth-register-supplier-1"
                    required
                    autoComplete="family-name"
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
                <label htmlFor="field-registersupplier-10328" className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input id="field-registersupplier-10328"
                    required
                    autoComplete="email"
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
                <label htmlFor="auth-register-supplier-3" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('password')} *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input id="auth-register-supplier-3"
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-11 pr-11"
                    placeholder={ui(t('passwordPlaceholder'))}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    aria-label={ui(showPassword ? 'Ascunde parola' : 'Arată parola')} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-anthracite-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-anthracite-300">{locale === 'en' ? 'Password: 8–128 characters, including uppercase, lowercase and a number.' : 'Parola: 8–128 caractere, cu literă mare, literă mică și cifră.'}</p>

              <div>
                <label htmlFor="auth-register-supplier-4" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('confirmPassword')} *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input id="auth-register-supplier-4"
                    required
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field pl-11 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}`}
                    placeholder={ui(t('confirmPasswordPlaceholder'))}
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
                <label htmlFor="auth-register-supplier-5" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('companyName')} *</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input id="auth-register-supplier-5"
                    required
                    autoComplete="organization"
                    type="text"
                    className="input-field pl-11"
                    placeholder="SC Exemplu SRL"
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplier-country" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('country')} *</label>
                  <select id="supplier-country"
                    required
                    autoComplete="country-name"
                    className="input-field"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">{t('selectCountry')}</option>
                    {countries.map(country => <option key={country.code} value={country.value}>{country.label}</option>)}
                  </select>
                  <p className="mt-2 text-xs text-anthracite-400">{ui("Țara în care se află furnizorul, folosită pentru secțiunea din catalog.")}</p>
                </div>
                <div>
                  <label htmlFor="auth-register-supplier-7" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('city')} *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                    <input id="auth-register-supplier-7"
                    required
                    autoComplete="address-level2"
                      type="text"
                      className="input-field pl-11"
                      placeholder={ui("București")}
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="field-registersupplier-16301" className="block text-sm font-medium text-anthracite-200 mb-1.5">{ui("Telefon / WhatsApp *")}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input id="field-registersupplier-16301"
                    autoComplete="tel"
                    type="tel"
                    className="input-field pl-11"
                    placeholder="+40 7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <p className="text-xs text-anthracite-500 mt-1">{ui("Vizibil pe profilul public. Clienții vă pot contacta direct.")}</p>
              </div>

              <div>
                <label htmlFor="supplier-public-email" className="mb-1.5 block text-sm font-medium text-anthracite-200">{locale === 'en' ? 'Public contact email (optional)' : 'Email public de contact (opțional)'}</label>
                <input id="supplier-public-email" type="email" autoComplete="off" inputMode="email" maxLength={254} className="input-field" placeholder="vanzari@companie.ro" value={form.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} disabled={loading} aria-describedby="supplier-public-email-help" />
                <p id="supplier-public-email-help" className="mt-2 text-sm text-anthracite-300">{locale === 'en' ? 'Visible to customers on your profile and products. Leave empty to keep your login email private.' : 'Vizibil clienților pe profil și produse. Lasă gol dacă nu dorești să publici o adresă. Emailul de autentificare rămâne privat.'}</p>
              </div>

              <details className="rounded-lg border border-anthracite-700 p-4">
                <summary className="min-h-11 cursor-pointer text-gold-400">{locale === 'en' ? 'Website and company description (optional)' : 'Website și descrierea firmei (opțional)'}</summary>
                <div className="mt-3 space-y-4">
              <div>
                <label htmlFor="field-registersupplier-17123" className="block text-sm font-medium text-anthracite-200 mb-1.5">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                  <input id="field-registersupplier-17123"
                    autoComplete="url"
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
                <label htmlFor="auth-register-supplier-10" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('companyDescription')}</label>
                <textarea id="auth-register-supplier-10"
                  className="input-field min-h-[80px] resize-y"
                  placeholder={ui(t('companyDescPlaceholder'))}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  disabled={loading}
                />
              </div>

                </div>
              </details>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(1); }}
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
                  {ui("Poze de verificare")}</h3>
                <p className="text-sm text-anthracite-400 mb-1">
                  {ui("Încărcați minim ")}<strong className="text-gold-400">{ui("3 poze")}</strong> {ui("care demonstrează că sunteți un furnizor real:")}</p>
                <ul className="text-xs text-anthracite-500 list-disc list-inside mb-4 space-y-0.5">
                  <li>{ui("Showroom sau magazin fizic")}</li>
                  <li>{ui("Depozit cu echipamente")}</li>
                  <li>{ui("Echipă sau birou")}</li>
                  <li>{ui("Produse în stoc")}</li>
                </ul>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-anthracite-700 group">
                    <img src={photo.url} alt={ui(`Verificare ${index + 1}`)} className="w-full h-full object-cover" />
                    <button aria-label={ui("Elimină imaginea")}
                      type="button"
                      disabled={uploadingPhoto || restoringPhotos}
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 min-w-11 min-h-11 bg-red-500 rounded-full flex items-center justify-center"
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
                    disabled={uploadingPhoto || restoringPhotos}
                    className="aspect-square rounded-lg border-2 border-dashed border-anthracite-600 hover:border-gold-400 flex flex-col items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-anthracite-400" />
                        <span className="text-xs text-anthracite-400">{ui("Adaugă")}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input aria-label={ui("Poze de verificare")}
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />

              {/* Counter */}
              <div role="status" className={`text-sm font-medium ${photos.length >= 3 ? 'text-green-400' : 'text-amber-400'}`}>
                {photos.length >= 3 ? (
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {photos.length}{ui("/10 poze încărcate — cerința minimă îndeplinită")}</span>
                ) : (
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {photos.length}{ui("/3 poze minime — mai adăugați ")}{3 - photos.length}</span>
                )}
              </div>

              <div className="rounded-lg border border-gold-400/30 bg-gold-400/5 p-4">
                <p className="font-medium text-white">{locale === 'en' ? 'Selected plan' : 'Plan selectat'}: {selectedPlan === 'free' ? (locale === 'en' ? 'Free · €0' : 'Gratuit · 0 €') : plans.find(plan => plan.id === selectedPlan)?.name}</p>
                <p className="mt-1 text-sm text-anthracite-300">{locale === 'en' ? 'Payment is not collected at registration. Paid plans require separate activation.' : 'Nu se încasează bani la înregistrare. Planurile plătite necesită activare separată.'}</p>
              </div>
              <details className="rounded-lg border border-anthracite-700 p-4">
                <summary className="min-h-11 cursor-pointer font-medium text-gold-400">{locale === 'en' ? 'Compare other plans (optional)' : 'Compară alte planuri (opțional)'}</summary>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    type="button"
                    aria-pressed={selectedPlan === plan.id}
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
                          <span className="font-semibold text-white">{ui(plan.name)}</span>
                          {plan.popular && (
                            <span className="text-xs bg-gold-400/10 text-gold-400 px-2 py-0.5 rounded-full">Popular</span>
                          )}
                        </div>
                        <p className="text-xs text-anthracite-400 mt-0.5">{ui(plan.desc)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">&euro;{ui(plan.price)}</span>
                        {plan.price > 0 && <span className="text-xs text-anthracite-400">/{t('month')}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              </details>

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
                  {t('acceptTermsLabel')} <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-gold-400">{t('termsLink')}</Link> {t('and')}{ui(' ')}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-400">{t('privacyLink')}</Link>.
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(2); }}
                  disabled={loading}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('back')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || uploadingPhoto || restoringPhotos}
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
        </div>}

        <div className="mt-6 text-center">
          <p className="text-sm text-anthracite-400">
            {t('hasAccount')}{ui(' ')}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
              {t('loginButton')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
