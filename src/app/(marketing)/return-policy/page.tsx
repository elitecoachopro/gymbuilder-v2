'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Înapoi la homepage
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Politica de Retur / Anulare</h1>
          <p className="text-anthracite-400 text-sm mb-10">Ultima actualizare: 18 iulie 2026</p>

          <div className="space-y-8 text-anthracite-300 leading-relaxed">

            {/* Section 1 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Domeniul de aplicare</h2>
              <p>
                Prezenta politică se aplică tuturor serviciilor plătite oferite prin platforma GymBuilder, inclusiv:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li><strong className="text-white">Pachete de promovare pentru furnizori</strong> (Professional, Enterprise)</li>
                <li><strong className="text-white">Promovări punctuale</strong> (Oferta Zilei, Anunțurile Zilei)</li>
                <li><strong className="text-white">Servicii de consultanță</strong> pentru planificarea și echiparea sălilor de fitness</li>
              </ul>
              <p className="mt-3">
                GymBuilder este o platformă de tip marketplace care facilitează conexiunea între furnizori de echipamente 
                și proprietari/viitori proprietari de săli de fitness. Tranzacțiile directe de echipamente între furnizori 
                și cumpărători sunt supuse politicilor proprii ale fiecărui furnizor.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Dreptul de retragere (14 zile)</h2>
              <p>
                Conform <strong className="text-white">OUG 34/2014</strong> privind drepturile consumatorilor în cadrul 
                contractelor încheiate cu profesioniștii (transpunerea Directivei 2011/83/UE), aveți dreptul de a vă retrage 
                din contract în termen de <strong className="text-white">14 zile calendaristice</strong> de la data achiziției, 
                fără a fi necesară invocarea unui motiv și fără a suporta alte costuri decât cele prevăzute de lege.
              </p>
              <div className="mt-4 bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-5">
                <p className="text-white font-medium mb-2">Termenul de 14 zile începe să curgă:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Pentru pachete de promovare — de la data confirmării plății</li>
                  <li>Pentru promovări punctuale — de la data confirmării plății</li>
                  <li>Pentru consultanță — de la data confirmării rezervării</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Excepții de la dreptul de retragere</h2>
              <p>
                Conform Art. 16 din OUG 34/2014, dreptul de retragere <strong className="text-white">nu se aplică</strong> în 
                următoarele situații:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>
                  <strong className="text-white">Servicii executate integral</strong> — dacă prestarea serviciului a fost 
                  finalizată și executarea a început cu acordul prealabil expres al consumatorului și cu confirmarea că 
                  acesta și-a pierdut dreptul de retragere odată ce contractul a fost executat integral.
                </li>
                <li>
                  <strong className="text-white">Promovări deja publicate</strong> — dacă promovarea (Oferta Zilei, Anunțul Zilei) 
                  a fost deja afișată pe platformă conform programului convenit, serviciul se consideră executat.
                </li>
                <li>
                  <strong className="text-white">Consultanță efectuată</strong> — dacă sesiunea de consultanță a avut loc 
                  (integral sau parțial) cu acordul consumatorului.
                </li>
              </ul>
              <div className="mt-4 bg-gold-400/5 border border-gold-400/20 rounded-xl p-5">
                <p className="text-gold-400 text-sm font-medium">
                  Important: La achiziția oricărui serviciu, veți fi informat explicit dacă executarea începe în interiorul 
                  termenului de retragere și vi se va solicita acordul expres, conform legii.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Procedura de retragere</h2>
              <p className="mb-3">
                Pentru a vă exercita dreptul de retragere, trebuie să ne informați printr-o declarație neechivocă 
                (de exemplu, email) cu privire la decizia dumneavoastră de a vă retrage din contract.
              </p>
              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-5 space-y-3">
                <p className="text-white font-medium">Pași de urmat:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Trimiteți un email la <strong className="text-gold-400">contact@gymbuilder.app</strong> cu subiectul 
                    &quot;Retragere din contract&quot;</li>
                  <li>Includeți în email: numele complet, adresa de email asociată contului, serviciul achiziționat, 
                    data achiziției și numărul tranzacției (dacă este disponibil)</li>
                  <li>Veți primi o confirmare de primire în maxim 24 de ore lucrătoare</li>
                  <li>Rambursarea se procesează în termen de maxim 14 zile de la primirea solicitării</li>
                </ol>
              </div>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Rambursarea</h2>
              <p>
                În cazul exercitării valide a dreptului de retragere, vă vom rambursa toate sumele plătite, 
                inclusiv costurile de livrare (dacă este cazul), fără întârzieri nejustificate și în orice caz 
                în termen de cel mult <strong className="text-white">14 zile calendaristice</strong> de la data 
                la care am fost informați despre decizia dumneavoastră de retragere.
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>Rambursarea se efectuează prin aceeași metodă de plată utilizată pentru tranzacția inițială (card bancar prin Stripe)</li>
                <li>Nu se percep comisioane suplimentare pentru procesarea rambursării</li>
                <li>Dacă serviciul a fost parțial executat (cu acordul dumneavoastră) înainte de retragere, 
                  veți datora o sumă proporțională cu serviciile furnizate până la momentul retragerii</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Anularea abonamentelor</h2>
              <p>
                Pachetele de promovare cu plată recurentă (lunară) pot fi anulate în orice moment:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>Anularea intră în vigoare la sfârșitul perioadei de facturare curente</li>
                <li>Beneficiile pachetului rămân active până la expirarea perioadei plătite</li>
                <li>Nu se efectuează rambursări pro-rata pentru perioada rămasă din luna curentă</li>
                <li>Puteți reactiva abonamentul în orice moment</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Formular-tip de retragere</h2>
              <p className="mb-3">
                Conform Anexei la OUG 34/2014, puteți utiliza următorul model (completarea și transmiterea 
                acestui formular nu este obligatorie):
              </p>
              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-5 text-sm space-y-2">
                <p className="italic text-anthracite-300">
                  Către: GymBuilder — contact@gymbuilder.app
                </p>
                <p className="italic text-anthracite-300">
                  Subsemnatul/Subsemnata [numele dumneavoastră], notific prin prezenta retragerea mea din contractul 
                  privind prestarea următorului serviciu: [descrierea serviciului]
                </p>
                <p className="italic text-anthracite-300">
                  Data comenzii: [data] / Data primirii: [data]
                </p>
                <p className="italic text-anthracite-300">
                  Numele consumatorului: [...]
                </p>
                <p className="italic text-anthracite-300">
                  Adresa consumatorului: [...]
                </p>
                <p className="italic text-anthracite-300">
                  Semnătura consumatorului (doar în cazul comunicării pe hârtie): [...]
                </p>
                <p className="italic text-anthracite-300">
                  Data: [...]
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Soluționarea litigiilor</h2>
              <p>
                În cazul unor neînțelegeri, vă încurajăm să ne contactați mai întâi la{' '}
                <strong className="text-gold-400">contact@gymbuilder.app</strong> pentru o rezolvare amiabilă.
              </p>
              <p className="mt-3">
                Dacă nu se ajunge la o soluție, puteți apela la:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>
                  <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 underline underline-offset-2">
                    ANPC (Autoritatea Națională pentru Protecția Consumatorilor)
                  </a>
                </li>
                <li>
                  <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 underline underline-offset-2">
                    Platforma SOL (Soluționarea Online a Litigiilor)
                  </a>
                </li>
              </ul>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Contact</h2>
              <p>
                Pentru orice întrebări legate de returnări, anulări sau rambursări:
              </p>
              <ul className="list-none space-y-1 mt-3">
                <li><strong className="text-white">Email:</strong> contact@gymbuilder.app</li>
                <li><strong className="text-white">Telefon:</strong> +40 700 000 000 (Luni – Vineri, 9:00 – 18:00)</li>
                <li><strong className="text-white">Timp de răspuns:</strong> maxim 24 de ore lucrătoare</li>
              </ul>
            </div>

          </div>

          {/* Related links */}
          <div className="mt-12 pt-8 border-t border-anthracite-800">
            <p className="text-anthracite-400 text-sm mb-4">Pagini conexe:</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                Termeni și Condiții
              </Link>
              <Link href="/privacy" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                Politica de Confidențialitate
              </Link>
              <Link href="/cookie-policy" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                Politica de Cookie-uri
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
