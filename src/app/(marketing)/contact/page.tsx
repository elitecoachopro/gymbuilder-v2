'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Send, Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Eroare la trimiterea mesajului.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Eroare de conexiune. Încearcă din nou.');
    }
  };

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Înapoi la homepage
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Contact</h1>
          <p className="text-anthracite-400 mb-12 max-w-2xl">
            Ai o întrebare, o sugestie sau ai nevoie de ajutor? Completează formularul de mai jos sau contactează-ne direct.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              {status === 'success' ? (
                <div className="bg-anthracite-900 border border-emerald-500/30 rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Mesaj trimis cu succes!</h3>
                  <p className="text-anthracite-400 text-sm mb-6">
                    Mulțumim pentru mesaj. Îți vom răspunde în maxim 24 de ore lucrătoare.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors"
                  >
                    Trimite alt mesaj
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-anthracite-300 mb-1.5">Nume complet *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ion Popescu"
                        className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-anthracite-300 mb-1.5">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ion@exemplu.ro"
                        className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-anthracite-300 mb-1.5">Subiect *</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Întrebare despre platformă"
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-anthracite-300 mb-1.5">Mesaj *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Scrie mesajul tău aici..."
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full sm:w-auto bg-gold-400 text-anthracite-950 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Se trimite...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Trimite mesajul</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar - Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact details */}
              <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 space-y-5">
                <h3 className="text-lg font-semibold text-white">Date de contact</h3>
                <div className="space-y-4">
                  <a href="mailto:contact@gymbuilder.app" className="flex items-start gap-3 group">
                    <div className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-gold-400 transition-colors">Email</p>
                      <p className="text-xs text-anthracite-400">contact@gymbuilder.app</p>
                    </div>
                  </a>
                  <a href="tel:+40743891218" className="flex items-start gap-3 group">
                    <div className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-gold-400 transition-colors">Telefon</p>
                      <p className="text-xs text-anthracite-400">0743 891 218</p>
                      <p className="text-xs text-anthracite-500">Luni – Vineri, 9:00 – 18:00</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Locație</p>
                      <p className="text-xs text-anthracite-400">Mangalia, România</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation CTA */}
              <div className="bg-gold-400/5 border border-gold-400/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-gold-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Cauți consultanță?</h3>
                </div>
                <p className="text-xs text-anthracite-400 leading-relaxed mb-4">
                  Dacă vrei ajutor personalizat pentru planificarea sau echiparea sălii tale de fitness, 
                  echipa noastră de consultanți te poate ghida.
                </p>
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-xs font-medium transition-colors"
                >
                  Solicită consultanță — €99/sesiune →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
