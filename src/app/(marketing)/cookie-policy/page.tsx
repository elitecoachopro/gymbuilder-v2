'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Înapoi la homepage
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Politica de Cookie-uri</h1>
          <p className="text-anthracite-400 text-sm mb-10">Ultima actualizare: 18 iulie 2026</p>

          <div className="prose-custom space-y-8 text-anthracite-300 leading-relaxed">
            {/* Section 1 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Ce sunt cookie-urile?</h2>
              <p>
                Cookie-urile sunt fișiere text de mici dimensiuni stocate pe dispozitivul dumneavoastră (computer, telefon, tabletă) 
                atunci când vizitați un site web. Acestea permit site-ului să vă recunoască dispozitivul și să rețină anumite informații 
                despre vizita dumneavoastră, cum ar fi preferințele de limbă sau starea de autentificare.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Tipuri de cookie-uri utilizate</h2>
              
              <h3 className="text-lg font-medium text-white mt-6 mb-2">2.1 Cookie-uri strict necesare (esențiale)</h3>
              <p className="mb-3">
                Aceste cookie-uri sunt indispensabile pentru funcționarea site-ului. Fără ele, funcționalități de bază precum 
                autentificarea, navigarea între pagini și accesarea zonelor securizate nu ar fi posibile. 
                <strong className="text-white"> Nu necesită consimțământ</strong> deoarece sunt esențiale pentru furnizarea serviciului solicitat.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-anthracite-700 rounded-lg overflow-hidden">
                  <thead className="bg-anthracite-800">
                    <tr>
                      <th className="text-left px-4 py-2 text-white font-medium">Cookie</th>
                      <th className="text-left px-4 py-2 text-white font-medium">Scop</th>
                      <th className="text-left px-4 py-2 text-white font-medium">Durată</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-anthracite-700">
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-gold-400">session_token</td>
                      <td className="px-4 py-2">Menține sesiunea de autentificare a utilizatorului</td>
                      <td className="px-4 py-2">7 zile</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-gold-400">gymbuilder_cookie_consent</td>
                      <td className="px-4 py-2">Stochează preferința de consimțământ cookie (localStorage)</td>
                      <td className="px-4 py-2">Persistent</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium text-white mt-6 mb-2">2.2 Cookie-uri de analiză (analytics)</h3>
              <p className="mb-3">
                Aceste cookie-uri ne ajută să înțelegem cum interacționează vizitatorii cu site-ul, furnizând informații despre 
                paginile vizitate, timpul petrecut pe site și eventualele erori întâlnite. Datele sunt anonimizate și agregate.
                <strong className="text-white"> Se activează doar cu consimțământul dumneavoastră explicit.</strong>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-anthracite-700 rounded-lg overflow-hidden">
                  <thead className="bg-anthracite-800">
                    <tr>
                      <th className="text-left px-4 py-2 text-white font-medium">Furnizor</th>
                      <th className="text-left px-4 py-2 text-white font-medium">Scop</th>
                      <th className="text-left px-4 py-2 text-white font-medium">Durată</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-anthracite-700">
                    <tr>
                      <td className="px-4 py-2">Vercel Analytics</td>
                      <td className="px-4 py-2">Măsurarea performanței și a traficului pe site</td>
                      <td className="px-4 py-2">Sesiune</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium text-white mt-6 mb-2">2.3 Cookie-uri de marketing</h3>
              <p className="mb-3">
                În prezent, GymBuilder <strong className="text-white">nu utilizează cookie-uri de marketing sau publicitate</strong>. 
                Dacă în viitor vom implementa astfel de cookie-uri (pentru retargetare, reclame personalizate etc.), 
                această politică va fi actualizată și veți fi notificat prin banner-ul de consimțământ.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Cum gestionați cookie-urile?</h2>
              <p className="mb-3">
                Aveți mai multe opțiuni pentru gestionarea cookie-urilor:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-white">Banner-ul de consimțământ:</strong> La prima vizită, puteți alege între „Acceptă toate" (activează și cookie-urile de analiză) sau „Doar esențiale" (blochează cookie-urile non-esențiale).</li>
                <li><strong className="text-white">Setările browserului:</strong> Puteți configura browserul să blocheze sau să șteargă cookie-urile. Consultați documentația browserului dumneavoastră pentru instrucțiuni specifice.</li>
                <li><strong className="text-white">Ștergerea consimțământului:</strong> Puteți șterge datele locale ale site-ului (localStorage) din setările browserului pentru a reseta preferința de cookie-uri.</li>
              </ul>
              <p className="mt-3 text-sm text-anthracite-400">
                Notă: Blocarea cookie-urilor esențiale poate afecta funcționarea corectă a site-ului (de exemplu, nu veți putea rămâne autentificat).
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Temeiul legal</h2>
              <p>
                Utilizarea cookie-urilor esențiale se bazează pe interesul nostru legitim de a furniza un serviciu funcțional 
                (Art. 6(1)(f) GDPR). Cookie-urile de analiză și marketing se bazează pe consimțământul dumneavoastră explicit 
                (Art. 6(1)(a) GDPR), conform cerințelor Directivei ePrivacy (2002/58/CE) transpusă în legislația românească 
                prin Legea nr. 506/2004 privind prelucrarea datelor cu caracter personal și protecția vieții private în sectorul 
                comunicațiilor electronice.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Transferuri internaționale</h2>
              <p>
                Unii furnizori de servicii (de exemplu, Vercel pentru hosting și analiză) pot procesa date în afara Spațiului 
                Economic European (SEE). În aceste cazuri, transferurile sunt protejate prin Clauze Contractuale Standard (SCC) 
                aprobate de Comisia Europeană sau prin alte mecanisme de transfer conforme GDPR.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Drepturile dumneavoastră</h2>
              <p className="mb-3">
                Conform GDPR, aveți dreptul de a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Retrage consimțământul în orice moment (prin ștergerea datelor locale din browser)</li>
                <li>Solicita informații despre datele colectate prin cookie-uri</li>
                <li>Solicita ștergerea datelor asociate cookie-urilor</li>
                <li>Depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Actualizări ale politicii</h2>
              <p>
                Această politică poate fi actualizată periodic pentru a reflecta modificări ale practicilor noastre sau ale 
                cerințelor legale. Data ultimei actualizări este afișată la începutul paginii. Vă recomandăm să consultați 
                periodic această pagină.
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Contact</h2>
              <p>
                Pentru orice întrebări legate de utilizarea cookie-urilor pe GymBuilder, ne puteți contacta la:
              </p>
              <ul className="list-none space-y-1 mt-3">
                <li><strong className="text-white">Email:</strong> contact@gymbuilder.app</li>
                <li><strong className="text-white">Adresă:</strong> București, România</li>
              </ul>
            </div>
          </div>

          {/* Related links */}
          <div className="mt-12 pt-8 border-t border-anthracite-800">
            <p className="text-anthracite-400 text-sm mb-4">Pagini conexe:</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                Politica de Confidențialitate
              </Link>
              <Link href="/terms" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                Termeni și Condiții
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
