'use client';

import { createContactSender } from '@/lib/contact-sender';
import { useSearchParams } from 'next/navigation';
import { useUiText } from '@/i18n/useUiText';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Send, Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

export default function ContactPage() {
  const ui = useUiText();
  const [sendContact] = useState(() => createContactSender('/api/contact'));
  const { t } = useClientTranslations('contact');
  const params = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: (params?.get('subject') || '').slice(0, 200),
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (status === 'success' || status === 'error') feedbackRef.current?.focus(); }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) return;

    setStatus('loading');
    try {
      const res = await sendContact(formData);
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || ui('Mesajul a fost înregistrat.'));
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || t('errorSend'));
      }
    } catch {
      setStatus('error');
      setErrorMsg(t('errorConnection'));
    }
  };

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t('backHome')}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{t('title')}</h1>
          <p className="text-anthracite-400 mb-12 max-w-2xl">
            {t('subtitle')}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form */}
            <div ref={feedbackRef} tabIndex={-1} className="lg:col-span-3">
              {status === 'success' ? (
                <div role="status" className="bg-anthracite-900 border border-emerald-500/30 rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('successTitle')}</h3>
                  <p className="text-anthracite-400 text-sm mb-6">
                    {ui(successMessage)}
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors"
                  >
                    {t('sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-anthracite-300 mb-1.5">{t('labelName')} *</label>
                      <input
                        type="text"
                        required
                        id="contact-name" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={ui(t('placeholderName'))}
                        className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-anthracite-300 mb-1.5">{t('labelEmail')} *</label>
                      <input
                        type="email"
                        required
                        id="contact-email" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={ui(t('placeholderEmail'))}
                        className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-anthracite-300 mb-1.5">{t('labelSubject')} *</label>
                    <input
                      type="text"
                      required
                      id="contact-subject" value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={ui(t('placeholderSubject'))}
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-anthracite-300 mb-1.5">{t('labelMessage')} *</label>
                    <textarea
                      required
                      rows={5}
                      id="contact-message" value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={ui(t('placeholderMessage'))}
                      className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <div role="alert" className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {ui(errorMsg)}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full sm:w-auto bg-gold-400 text-anthracite-950 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t('sending')}</>
                    ) : (
                      <><Send className="w-4 h-4" /> {t('sendButton')}</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar - Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact details */}
              <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 space-y-5">
                <h3 className="text-lg font-semibold text-white">{t('contactInfo')}</h3>
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
                      <p className="text-sm font-medium text-white group-hover:text-gold-400 transition-colors">{t('phone')}</p>
                      <p className="text-xs text-anthracite-400">0743 891 218</p>
                      <p className="text-xs text-anthracite-500">{t('phoneHours')}</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gold-400/10 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t('location')}</p>
                      <p className="text-xs text-anthracite-400">{ui("Mangalia, România")}</p>
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
                  <h3 className="text-sm font-semibold text-white">{t('consultTitle')}</h3>
                </div>
                <p className="text-xs text-anthracite-400 leading-relaxed mb-4">
                  {t('consultDesc')}
                </p>
                <Link
                  href="/consultation"
                  className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-xs font-medium transition-colors"
                >
                  {t('consultCta')}
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
