'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dumbbell, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useClientTranslations } from '@/i18n/client';

export default function ResetPasswordPage() {
  const { t } = useClientTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError(t('tokenMissing'));
      return;
    }

    if (!password || password.length < 8) {
      setError(t('passwordMin'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsMismatch'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('resetError'));
        return;
      }

      setSuccess(data.message || t('resetSuccess'));

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-anthracite-950">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">{t('invalidLink')}</h1>
          <p className="text-anthracite-400 mb-6">{t('tokenInvalid')}</p>
          <Link href="/forgot-password" className="btn-primary px-6 py-3">
            {t('requestNewLink')}
          </Link>
        </div>
      </main>
    );
  }

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
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">{t('newPasswordTitle')}</h1>
          <p className="text-anthracite-400">{t('newPasswordSubtitle')}</p>
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
            <div>
              <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('newPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <label className="block text-sm font-medium text-anthracite-200 mb-1.5">{t('confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('resetting')}
                </>
              ) : (
                t('resetButton')
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
