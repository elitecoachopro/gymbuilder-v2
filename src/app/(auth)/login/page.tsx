'use client';

import { safeReturnPath } from '@/lib/journeys';
import { useUiText } from '@/i18n/useUiText';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dumbbell, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useClientTranslations } from '@/i18n/client';

export default function LoginPage() {
  const ui = useUiText();
  const { t } = useClientTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (!searchParams) return;
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');
    if (verified === 'true') {
      setSuccess(t('emailVerified'));
    }
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('loginError'));
        return;
      }

      // Save user to store
      setUser(data.user);

      localStorage.removeItem('session_token');


      // Only this explicit internal return destination is allowed.
      const returnTo = safeReturnPath(searchParams?.get('redirect'));
      if (returnTo) {
        router.push(returnTo);
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'supplier') {
        router.push('/supplier/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || t('connectionError'));
      else setSuccess(data.message);
    } catch { setError(t('connectionError')); }
    finally { setResending(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-anthracite-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-gold-400" />
            <span className="text-2xl font-bold">
              <span className="text-white">Gym </span>
              <span className="text-gold-400">Builder</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">{t('welcomeBack')}</h1>
          <p className="text-anthracite-400">{t('loginSubtitle')}</p>
        </div>

        {/* Messages */}
        {success && (
          <div role="status" className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{ui(success)}</p>
          </div>
        )}
        {error && (
          <div id="form-error" ref={errorRef} tabIndex={-1} role="alert" className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{ui(error)}</p>
          </div>
        )}

        {/* Form */}
        <button type="button" onClick={resendVerification} disabled={!email || resending} className="mb-4 text-sm text-gold-400 disabled:opacity-50">
          {ui(resending ? t('sending') : t('resendVerification'))}
        </button>
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="field-authlogin-4432" className="block text-sm font-medium text-anthracite-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input id="field-authlogin-4432"
                  aria-describedby={error ? "form-error" : undefined} type="email"
                  className="input-field pl-11"
                  placeholder="email@exemplu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-login-1" className="block text-sm font-medium text-anthracite-200">{t('password')}</label>
                <Link href="/forgot-password" className="text-xs text-gold-400 hover:text-gold-300">
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input id="auth-login-1"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('loggingIn')}
                </>
              ) : (
                t('loginButton')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-anthracite-400">
              {t('noAccount')}{ui(' ')}
              <Link href={safeReturnPath(searchParams?.get("redirect")) ? `/register/client?redirect=${encodeURIComponent(safeReturnPath(searchParams?.get("redirect"))!)}` : "/register/client"} className="text-gold-400 hover:text-gold-300 font-medium">
                {t('register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
