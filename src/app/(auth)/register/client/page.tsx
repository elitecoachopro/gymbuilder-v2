'use client';

import Link from 'next/link';
import { Dumbbell, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function ClientRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

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
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Creează Cont Client</h1>
          <p className="text-anthracite-400">Accesează catalogul complet de echipamente.</p>
        </div>

        <div className="glass-card p-8">
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
                <input type="email" className="input-field pl-11" placeholder="email@exemplu.com" />
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

            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded border-anthracite-600 bg-anthracite-800 text-gold-400 focus:ring-gold-400" />
              <label htmlFor="terms" className="text-xs text-anthracite-400">
                Accept <Link href="#" className="text-gold-400">Termenii și Condițiile</Link> și{' '}
                <Link href="#" className="text-gold-400">Politica de Confidențialitate</Link>.
              </label>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5">
              Creează Cont
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-anthracite-400">
              Ai deja cont?{' '}
              <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium">
                Autentifică-te
              </Link>
            </p>
            <p className="text-sm text-anthracite-400">
              Ești furnizor?{' '}
              <Link href="/register/supplier" className="text-gold-400 hover:text-gold-300 font-medium">
                Înregistrare Furnizor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
