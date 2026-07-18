'use client';

import Footer from '@/components/layout/Footer';
import { MessageSquare, CheckCircle2, Clock, Users, Target, Lightbulb } from 'lucide-react';
import { useState } from 'react';

const benefits = [
  { icon: Target, title: 'Plan Personalizat', desc: 'Strategie completă adaptată bugetului și spațiului tău.' },
  { icon: Users, title: 'Experți în Industrie', desc: 'Consultanți cu 10+ ani experiență în echiparea sălilor.' },
  { icon: Lightbulb, title: 'Soluții Optime', desc: 'Recomandări bazate pe date și tendințe de piață.' },
  { icon: Clock, title: 'Răspuns în 24h', desc: 'Echipa noastră te contactează în maxim 24 de ore.' },
];

const businessStages = [
  { value: 'idee', label: 'Idee – Încă mă documentez' },
  { value: 'în pregătire', label: 'În pregătire – Am planuri concrete' },
  { value: 'deja deschis', label: 'Deja deschis – Vreau să reechipez/extind' },
];

export default function ConsultationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessStage: '',
    budget: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'A apărut o eroare. Te rugăm să încerci din nou.');
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Eroare de conexiune. Verifică internetul și încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left - Info */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 rounded-full px-4 py-1.5 mb-6">
                <MessageSquare className="w-4 h-4 text-gold-400" />
                <span className="text-gold-400 text-sm font-medium">Consultanță Profesională</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Nu știi de unde să începi?
                <span className="block gold-gradient">Programează o sesiune de consultanță cu un expert.</span>
              </h1>

              <p className="text-anthracite-300 text-lg mb-8 leading-relaxed">
                Echipa noastră de experți te ajută să alegi echipamentele potrivite, 
                să optimizezi layout-ul și să obții cele mai bune prețuri de la furnizori verificați.
              </p>

              <div className="glass-card p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-anthracite-300">Preț consultanță</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gold-400">&euro;99</span>
                    <span className="text-anthracite-400 text-sm">/sesiune</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-anthracite-200">
                    <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    Sesiune video 60 minute cu expert
                  </li>
                  <li className="flex items-center gap-2 text-sm text-anthracite-200">
                    <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    Plan de echipare personalizat (PDF)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-anthracite-200">
                    <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    Lista de echipamente recomandate cu prețuri
                  </li>
                  <li className="flex items-center gap-2 text-sm text-anthracite-200">
                    <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    Conectare directă cu furnizori verificați
                  </li>
                  <li className="flex items-center gap-2 text-sm text-anthracite-200">
                    <CheckCircle2 className="w-4 h-4 text-gold-400" />
                    Follow-up gratuit 7 zile
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gold-400/10 rounded-lg flex items-center justify-center shrink-0">
                      <benefit.icon className="w-4 h-4 text-gold-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{benefit.title}</h4>
                      <p className="text-xs text-anthracite-400 mt-0.5">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Form */}
            <div className="glass-card p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Cerere Trimisă cu Succes!</h2>
                  <p className="text-anthracite-300 mb-4">
                    Mulțumim, {formData.name}! Cererea ta de consultanță a fost înregistrată.
                  </p>
                  <p className="text-anthracite-400 text-sm mb-6">
                    Vei primi un email de confirmare la <strong className="text-gold-400">{formData.email}</strong>. 
                    Echipa noastră te va contacta în maxim 24 de ore pentru programarea sesiunii.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', businessStage: '', budget: '', message: '' }); }}
                    className="btn-secondary"
                  >
                    Trimite altă cerere
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">Solicită Consultanță</h2>
                  <p className="text-anthracite-400 text-sm mb-8">Completează formularul și te contactăm în 24h.</p>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Nume complet *</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Ion Popescu"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Email *</label>
                        <input
                          type="email"
                          className="input-field"
                          placeholder="ion@email.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Telefon *</label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="+40 7XX XXX XXX"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Stadiul afacerii *</label>
                      <select
                        className="input-field"
                        required
                        value={formData.businessStage}
                        onChange={(e) => setFormData({ ...formData, businessStage: e.target.value })}
                      >
                        <option value="">Selectează stadiul...</option>
                        {businessStages.map((stage) => (
                          <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Buget estimat</label>
                      <select
                        className="input-field"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      >
                        <option value="">Selectează bugetul estimat</option>
                        <option value="50.000€ - 100.000€">50.000€ - 100.000€</option>
                        <option value="100.000€ - 200.000€">100.000€ - 200.000€</option>
                        <option value="200.000€ - 500.000€">200.000€ - 500.000€</option>
                        <option value="500.000€+">500.000€+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-anthracite-200 mb-1.5">Mesaj</label>
                      <textarea
                        className="input-field min-h-[120px] resize-y"
                        placeholder="Descrie pe scurt proiectul tău, dimensiunea sălii, tipul de echipamente dorite..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Se trimite...' : 'Trimite Cererea – €99/sesiune'}
                    </button>

                    <p className="text-xs text-anthracite-500 text-center">
                      Plata se procesează doar după confirmarea programării sesiunii.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
