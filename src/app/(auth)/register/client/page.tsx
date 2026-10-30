'use client';

import { useSearchParams } from 'next/navigation';
import { safeReturnPath } from '@/lib/journeys';
import VerificationResult from '@/components/VerificationResult';
import { isStrongPassword } from '@/lib/sanitize';
import { useUiText } from '@/i18n/useUiText';

import Link from 'next/link';
import { Dumbbell, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useClientTranslations } from '@/i18n/client';

export default function ClientRegisterPage() {
  const ui = useUiText();
  const returnTo = safeReturnPath(useSearchParams()?.get('redirect'));
  const { t } = useClientTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError(t('requiredFields'));
      return;
    }

    const passwordCheck = isStrongPassword(form.password);
    if (!passwordCheck.valid) {
      setError(ui(passwordCheck.message));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t('passwordsMismatch'));
      return;
    }

    if (!form.terms) {
      setError(t('acceptTerms'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('registerError'));
        return;
      }

      setSuccess(data.message || t('registerSuccess'));
      

    } catch {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) return <main className="min-h-screen px-4 py-12"><div className="mx-auto max-w-lg"><VerificationResult returnTo={returnTo} email={form.email} message={success} /></div></main>;
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-anthracite-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-gold-400" />
            <span className="text-2xl font-bold">
              <span className="text-white">Gym </span>
              <span className="text-gold-400">Builder</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">{t('createClientAccount')}</h1>
          <p className="text-anthracite-400">{ui("Salvează proiecte, urmărește cereri și păstrează echipamentele favorite. Catalogul este public.")}</p>
        </div>

        {error && (
          <div id="form-error" ref={errorRef} tabIndex={-1} role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{ui(error)}</p>
          </div>
        )}

        <div className="glass-card p-8">
          <p id="password-rules" className="mb-4 text-sm text-anthracite-300">{ui("Parola: 8–128 caractere, cu literă mare, literă mică și cifră.")}</p><form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="auth-register-client-0" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('firstName')} *</label>
                <input id="auth-register-client-0"
                  type="text"
                  className="input-field"
                  placeholder="Ion"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="auth-register-client-1" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('lastName')} *</label>
                <input id="auth-register-client-1"
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
              <label htmlFor="field-registerclient-4673" className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input id="field-registerclient-4673"
                  aria-describedby={error ? "form-error" : undefined} type="email"
                  className="input-field pl-11"
                  placeholder="email@exemplu.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>


            <div>
              <label htmlFor="auth-register-client-4" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('password')} *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input id="auth-register-client-4"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  minLength={8} maxLength={128} aria-describedby={error ? "password-rules form-error" : "password-rules"} placeholder={ui(t('passwordPlaceholder'))}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label={ui(showPassword ? 'Ascunde parola' : 'Arată parola')} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-anthracite-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="auth-register-client-5" className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('confirmPassword')} *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input id="auth-register-client-5"
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

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 rounded border-anthracite-600 bg-anthracite-800 text-gold-400 focus:ring-gold-400"
                checked={form.terms}
                onChange={(e) => updateField('terms', e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="terms" className="text-xs text-anthracite-400">
                {t('acceptTermsLabel')} <Link href="/terms" className="text-gold-400">{t('termsLink')}</Link> {t('and')}{ui(' ')}
                <Link href="/privacy" className="text-gold-400">{t('privacyLink')}</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('creatingAccount')}
                </>
              ) : (
                t('createAccount')
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-anthracite-400">
              {t('hasAccount')}{ui(' ')}
              <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
                {t('loginButton')}
              </Link>
            </p>
            <p className="text-sm text-anthracite-400">
              {t('isSupplier')}{ui(' ')}
              <Link href="/register/supplier" className="text-gold-400 hover:text-gold-300 font-medium">
                {t('supplierRegister')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
