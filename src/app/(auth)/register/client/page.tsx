'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, Phone, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useClientTranslations } from '@/i18n/client';

export default function ClientRegisterPage() {
  const { t } = useClientTranslations('auth');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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

    if (form.password.length < 8) {
      setError(t('passwordMin'));
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
          phone: form.phone || undefined,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('registerError'));
        return;
      }

      setSuccess(data.message || t('registerSuccess'));
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-anthracite-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-gold-400" />
            <span className="text-2xl font-bold">
              <span className="text-white">Gym</span>
              <span className="text-gold-400">Builder</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">{t('createClientAccount')}</h1>
          <p className="text-anthracite-400">{t('clientSubtitle')}</p>
        </div>

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

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="email@exemplu.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('phoneLabel')}</label>
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
                {t('acceptTermsLabel')} <Link href="/terms" className="text-gold-400">{t('termsLink')}</Link> {t('and')}{' '}
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
              {t('hasAccount')}{' '}
              <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
                {t('loginButton')}
              </Link>
            </p>
            <p className="text-sm text-anthracite-400">
              {t('isSupplier')}{' '}
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
