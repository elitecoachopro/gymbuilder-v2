'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { Calculator, ArrowLeft, ArrowRight, CheckCircle, Save, Loader2, Building2, Ruler, Target } from 'lucide-react';

// Zone definitions with cost per sqm (min/max) and recommended equipment
const zones = [
  {
    id: 'reception',
    name: 'Recepție',
    category: 'reception',
    costPerSqm: { min: 150, max: 350 },
    equipment: ['Mobilier recepție', 'Sistem control acces', 'Canapele așteptare', 'Rafturi produse'],
    sqmRatio: 0.05, // % of total area
  },
  {
    id: 'lockers',
    name: 'Vestiare',
    category: 'lockers',
    costPerSqm: { min: 200, max: 450 },
    equipment: ['Dulapuri metalice', 'Bănci vestiar', 'Cuiere', 'Oglinzi mari'],
    sqmRatio: 0.10,
  },
  {
    id: 'cardio',
    name: 'Cardio',
    category: 'cardio',
    costPerSqm: { min: 400, max: 900 },
    equipment: ['Benzi de alergare', 'Biciclete staționare', 'Eliptice', 'Ergometre canotaj', 'Scări simulate'],
    sqmRatio: 0.15,
  },
  {
    id: 'freeweights',
    name: 'Greutăți Libere',
    category: 'strength',
    costPerSqm: { min: 350, max: 750 },
    equipment: ['Gantere (set complet)', 'Discuri olimpice', 'Bare olimpice', 'Rack-uri gantere', 'Bănci reglabile'],
    sqmRatio: 0.12,
  },
  {
    id: 'machines',
    name: 'Aparate de Forță',
    category: 'strength',
    costPerSqm: { min: 500, max: 1100 },
    equipment: ['Aparat piept', 'Aparat spate (lat pulldown)', 'Aparat picioare (leg press)', 'Aparat umeri', 'Cable crossover'],
    sqmRatio: 0.15,
  },
  {
    id: 'functional',
    name: 'Zona Funcțional/Crossfit',
    category: 'functional',
    costPerSqm: { min: 300, max: 700 },
    equipment: ['Rack-uri squat', 'Bare pull-up', 'Kettlebell-uri', 'Sănii de împins', 'Cutii pliometrice', 'Frânghii battle rope'],
    sqmRatio: 0.12,
  },
  {
    id: 'studio',
    name: 'Zona Studio',
    category: 'accessories',
    costPerSqm: { min: 200, max: 500 },
    equipment: ['Oglinzi perete complet', 'Bare ballet', 'Saltele yoga/pilates', 'Sistem sunet profesional', 'Iluminat ambient'],
    sqmRatio: 0.08,
  },
  {
    id: 'stretching',
    name: 'Stretching & Mobility',
    category: 'accessories',
    costPerSqm: { min: 100, max: 300 },
    equipment: ['Saltele stretching', 'Role spumă (foam rollers)', 'Benzi elastice', 'Mingii fitness', 'Blocuri yoga'],
    sqmRatio: 0.05,
  },
  {
    id: 'spa',
    name: 'Zona Spa & Recovery',
    category: 'wellness',
    costPerSqm: { min: 600, max: 1500 },
    equipment: ['Saună finlandeză', 'Jacuzzi', 'Cadă crioterapie', 'Duș experiențial', 'Șezlonguri relaxare'],
    sqmRatio: 0.08,
  },
  {
    id: 'lounge',
    name: 'Zona Lounge/Bar',
    category: 'reception',
    costPerSqm: { min: 150, max: 400 },
    equipment: ['Mese și scaune', 'Blender-e profesionale', 'Frigidere vitrină', 'Aparat cafea', 'Sistem POS'],
    sqmRatio: 0.05,
  },
];

// Gym type multipliers
const gymTypes: Record<string, { label: string; multiplier: number; recommendedZones: string[] }> = {
  crossfit: {
    label: 'Crossfit',
    multiplier: 0.85,
    recommendedZones: ['reception', 'lockers', 'functional', 'freeweights', 'stretching'],
  },
  bodybuilding: {
    label: 'Bodybuilding',
    multiplier: 1.1,
    recommendedZones: ['reception', 'lockers', 'freeweights', 'machines', 'cardio', 'stretching'],
  },
  studio: {
    label: 'Studio Fitness',
    multiplier: 0.9,
    recommendedZones: ['reception', 'lockers', 'studio', 'cardio', 'stretching'],
  },
  mixed: {
    label: 'Sală Mixtă',
    multiplier: 1.0,
    recommendedZones: ['reception', 'lockers', 'cardio', 'freeweights', 'machines', 'functional', 'stretching'],
  },
};

interface EstimateResult {
  totalMin: number;
  totalMax: number;
  zoneBreakdown: {
    zone: typeof zones[0];
    allocatedSqm: number;
    costMin: number;
    costMax: number;
  }[];
}

export default function BudgetEstimatorPage() {
  const [step, setStep] = useState(1); // 1: form, 2: results
  const [area, setArea] = useState('');
  const [gymType, setGymType] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUser(data.user);
        }
      } catch {}
    }
    checkSession();
  }, []);

  const toggleZone = (zoneId: string) => {
    setSelectedZones(prev =>
      prev.includes(zoneId) ? prev.filter(z => z !== zoneId) : [...prev, zoneId]
    );
  };

  const calculateEstimate = () => {
    const totalArea = Number(area);
    if (!totalArea || !gymType || selectedZones.length === 0) return;

    const multiplier = gymTypes[gymType]?.multiplier || 1;
    const totalRatio = selectedZones.reduce((sum, zId) => {
      const zone = zones.find(z => z.id === zId);
      return sum + (zone?.sqmRatio || 0.1);
    }, 0);

    const breakdown = selectedZones.map(zId => {
      const zone = zones.find(z => z.id === zId)!;
      const allocatedSqm = Math.round((zone.sqmRatio / totalRatio) * totalArea);
      const costMin = Math.round(allocatedSqm * zone.costPerSqm.min * multiplier);
      const costMax = Math.round(allocatedSqm * zone.costPerSqm.max * multiplier);
      return { zone, allocatedSqm, costMin, costMax };
    });

    const totalMin = breakdown.reduce((sum, b) => sum + b.costMin, 0);
    const totalMax = breakdown.reduce((sum, b) => sum + b.costMax, 0);

    setResult({ totalMin, totalMax, zoneBreakdown: breakdown });
    setStep(2);
  };

  const saveEstimate = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      await fetch('/api/budget-estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: Number(area),
          gymType,
          selectedZones,
          totalMin: result.totalMin,
          totalMax: result.totalMax,
          breakdown: result.zoneBreakdown.map(b => ({
            zoneId: b.zone.id,
            zoneName: b.zone.name,
            sqm: b.allocatedSqm,
            costMin: b.costMin,
            costMax: b.costMax,
          })),
        }),
      });
      setSaved(true);
    } catch {}
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-anthracite-950">

      <section className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Link href="/construieste-sala" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" /> Înapoi la Construiește Sala
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-gold-400" />
            Estimator Buget Sală
          </h1>
          <p className="text-anthracite-400 mb-8">
            Calculează un buget orientativ pentru echiparea sălii tale, bazat pe suprafață, tip și zone dorite.
          </p>

          {step === 1 && (
            <div className="space-y-8">
              {/* Area Input */}
              <div className="bg-anthracite-900 border border-anthracite-700 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Ruler className="w-4 h-4 text-gold-400" />
                  Suprafață totală (mp) *
                </label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-3 text-white placeholder-anthracite-500 focus:border-gold-400/50 focus:outline-none transition-colors text-lg"
                  placeholder="ex: 500"
                  min="50"
                  max="10000"
                />
                <p className="text-xs text-anthracite-500 mt-2">Minim 50 mp, maxim 10.000 mp</p>
              </div>

              {/* Gym Type */}
              <div className="bg-anthracite-900 border border-anthracite-700 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Target className="w-4 h-4 text-gold-400" />
                  Tipul sălii *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(gymTypes).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setGymType(key);
                        setSelectedZones(type.recommendedZones);
                      }}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        gymType === key
                          ? 'bg-gold-400/10 border-gold-400/50 text-gold-400'
                          : 'bg-anthracite-800 border-anthracite-700 text-anthracite-300 hover:border-anthracite-500'
                      }`}
                    >
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
                {gymType && (
                  <p className="text-xs text-anthracite-500 mt-3">
                    Zonele recomandate au fost pre-selectate. Poți modifica mai jos.
                  </p>
                )}
              </div>

              {/* Zones Selection */}
              <div className="bg-anthracite-900 border border-anthracite-700 rounded-xl p-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Building2 className="w-4 h-4 text-gold-400" />
                  Zone incluse *
                </label>
                <p className="text-xs text-anthracite-500 mb-4">Selectează zonele pe care vrei să le incluzi în sală.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => toggleZone(zone.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        selectedZones.includes(zone.id)
                          ? 'bg-gold-400/10 border-gold-400/40 text-white'
                          : 'bg-anthracite-800 border-anthracite-700 text-anthracite-400 hover:border-anthracite-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedZones.includes(zone.id)
                          ? 'bg-gold-400 border-gold-400'
                          : 'border-anthracite-600'
                      }`}>
                        {selectedZones.includes(zone.id) && (
                          <svg className="w-3 h-3 text-anthracite-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{zone.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateEstimate}
                disabled={!area || Number(area) < 50 || !gymType || selectedZones.length === 0}
                className="w-full bg-gold-400 text-anthracite-950 font-bold py-4 rounded-xl hover:bg-gold-300 transition-colors flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-5 h-5" />
                Calculează Estimarea
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && result && (
            <div className="space-y-8">
              {/* Total Estimate */}
              <div className="bg-gradient-to-br from-gold-400/10 to-anthracite-900 border border-gold-400/30 rounded-2xl p-8 text-center">
                <p className="text-sm text-anthracite-400 uppercase tracking-wider mb-2">Buget Estimat Total</p>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  €{result.totalMin.toLocaleString()} — €{result.totalMax.toLocaleString()}
                </div>
                <p className="text-anthracite-400 text-sm">
                  Pentru o sală de <span className="text-white font-semibold">{area} mp</span> de tip{' '}
                  <span className="text-gold-400 font-semibold">{gymTypes[gymType]?.label}</span> cu{' '}
                  <span className="text-white font-semibold">{selectedZones.length} zone</span>
                </p>
                <p className="text-xs text-anthracite-500 mt-3">
                  * Estimare orientativă. Prețurile reale variază în funcție de brand, condiție (nou/SH) și furnizor.
                </p>
              </div>

              {/* Save Button */}
              {user && !saved && (
                <button
                  onClick={saveEstimate}
                  disabled={saving}
                  className="w-full bg-anthracite-800 border border-anthracite-600 text-white font-semibold py-3 rounded-xl hover:bg-anthracite-700 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Se salvează...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Salvează estimarea în Dashboard</>
                  )}
                </button>
              )}
              {saved && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-3">
                  <CheckCircle className="w-4 h-4" />
                  Estimarea a fost salvată în Client Dashboard
                </div>
              )}
              {!user && (
                <div className="text-center text-sm text-anthracite-500 bg-anthracite-900 border border-anthracite-700 rounded-xl py-3">
                  <Link href="/login" className="text-gold-400 hover:underline">Autentifică-te</Link> pentru a salva estimarea în dashboard.
                </div>
              )}

              {/* Zone Breakdown */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Detaliere pe Zone</h2>
                {result.zoneBreakdown.map((item) => (
                  <div key={item.zone.id} className="bg-anthracite-900 border border-anthracite-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{item.zone.name}</h3>
                        <p className="text-xs text-anthracite-500">~{item.allocatedSqm} mp alocați</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gold-400 font-bold">
                          €{item.costMin.toLocaleString()} — €{item.costMax.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Recommended Equipment */}
                    <div className="mb-3">
                      <p className="text-xs text-anthracite-400 uppercase tracking-wider mb-2">Echipamente recomandate:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.zone.equipment.map((eq) => (
                          <span key={eq} className="text-xs bg-anthracite-800 border border-anthracite-700 text-anthracite-300 px-2.5 py-1 rounded-lg">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Link to products */}
                    <Link
                      href={`/products?category=${item.zone.category}`}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Vezi echipamente {item.zone.name.toLowerCase()} →
                    </Link>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => { setStep(1); setResult(null); setSaved(false); }}
                  className="flex-1 bg-anthracite-800 border border-anthracite-600 text-white font-semibold py-3 rounded-xl hover:bg-anthracite-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Recalculează
                </button>
                <Link
                  href="/consultation"
                  className="flex-1 bg-gold-400 text-anthracite-950 font-bold py-3 rounded-xl hover:bg-gold-300 transition-colors flex items-center justify-center gap-2 text-center"
                >
                  Consultanță Personalizată — €99
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
