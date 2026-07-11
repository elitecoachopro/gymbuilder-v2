'use client';

import Link from 'next/link';
import { Dumbbell, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-anthracite-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-gold-400" />
            <span className="text-2xl font-bold">
              <span className="text-white">Gym</span>
              <span className="text-gold-400">Builder</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Bine ai revenit!</h1>
          <p className="text-anthracite-400">Autentifică-te pentru a continua.</p>
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input type="email" className="input-field pl-11" placeholder="email@exemplu.com" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-anthracite-200">Parolă</label>
                <Link href="/forgot-password" className="text-xs text-gold-400 hover:text-gold-300">
                  Ai uitat parola?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
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

            <button type="submit" className="btn-primary w-full py-3.5">
              Autentificare
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-anthracite-400">
              Nu ai cont?{' '}
              <Link href="/register/client" className="text-gold-400 hover:text-gold-300 font-medium">
                Înregistrează-te
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
