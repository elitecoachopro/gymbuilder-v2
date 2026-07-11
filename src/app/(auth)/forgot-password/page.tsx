'use client';

import Link from 'next/link';
import { Dumbbell, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
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
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Resetează Parola</h1>
          <p className="text-anthracite-400">Introdu emailul și îți trimitem un link de resetare.</p>
        </div>

        <div className="glass-card p-8">
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-anthracite-400" />
                <input type="email" className="input-field pl-11" placeholder="email@exemplu.com" />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5">
              Trimite Link de Resetare
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400">
              <ArrowLeft className="w-4 h-4" />
              Înapoi la autentificare
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
