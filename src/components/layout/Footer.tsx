'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Dumbbell, Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-anthracite-950 border-t border-anthracite-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="w-7 h-7 text-gold-400" />
              <span className="text-lg font-bold">
                <span className="text-white">Gym</span>
                <span className="text-gold-400">Builder</span>
              </span>
            </Link>
            <p className="text-anthracite-400 text-sm leading-relaxed">
              Platforma completă pentru echipamente de fitness comerciale. 
              Conectăm furnizori verificați cu proprietari de săli.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platformă</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Echipamente</Link></li>
              <li><Link href="/suppliers" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Furnizori</Link></li>
              <li><Link href="/pricing" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Pachete & Prețuri</Link></li>
              <li><Link href="/consultation" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Consultanță</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">Cont</h4>
            <ul className="space-y-3">
              <li><Link href="/register/supplier" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Devino Furnizor</Link></li>
              <li><Link href="/register/client" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Înregistrare Client</Link></li>
              <li><Link href="/login" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">Autentificare</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@gymbuilder.app" className="flex items-center gap-2 text-anthracite-400 hover:text-gold-400 text-sm transition-colors">
                  <Mail className="w-4 h-4 text-gold-400" />
                  contact@gymbuilder.app
                </a>
              </li>
              <li>
                <a href="tel:+40700000000" className="flex items-center gap-2 text-anthracite-400 hover:text-gold-400 text-sm transition-colors">
                  <Phone className="w-4 h-4 text-gold-400" />
                  +40 700 000 000
                </a>
              </li>
              <li className="flex items-center gap-2 text-anthracite-400 text-sm">
                <MapPin className="w-4 h-4 text-gold-400" />
                București, România
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-anthracite-800 pt-8 pb-8">
          <NewsletterForm />
        </div>

        {/* Bottom */}
        <div className="border-t border-anthracite-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-anthracite-500 text-sm">
            &copy; {new Date().getFullYear()} GymBuilder. Toate drepturile rezervate.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <Link href="/terms" className="text-anthracite-500 hover:text-gold-400 text-sm transition-colors">
              Termeni & Condiții
            </Link>
            <Link href="/privacy" className="text-anthracite-500 hover:text-gold-400 text-sm transition-colors">
              Politica de Confidențialitate
            </Link>
            <Link href="/cookie-policy" className="text-anthracite-500 hover:text-gold-400 text-sm transition-colors">
              Politica de Cookie-uri
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Abonat cu succes!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Eroare la abonare.');
      }
    } catch {
      setStatus('error');
      setMessage('Eroare de conexiune.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        <p className="text-emerald-400 text-sm font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <h4 className="text-white font-semibold mb-2">Abonează-te la Newsletter</h4>
      <p className="text-anthracite-400 text-sm mb-4">Primește noutăți despre echipamente, oferte și sfaturi pentru sala ta.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
          placeholder="adresa@email.com"
          className="flex-1 bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="bg-gold-400 text-anthracite-950 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Abonare
        </button>
      </form>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-2">{message}</p>
      )}
    </div>
  );
}
