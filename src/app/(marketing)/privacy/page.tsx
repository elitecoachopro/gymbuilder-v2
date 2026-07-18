'use client';

import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Politica de <span className="gold-gradient">Confidențialitate</span>
          </h1>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-anthracite-300">
            <p className="text-anthracite-400 text-sm">Ultima actualizare: Ianuarie 2024</p>

            <h2 className="text-xl font-semibold text-white mt-8">1. Informații Colectate</h2>
            <p>
              Colectăm informații pe care ni le furnizați direct: nume, adresă de email, număr de telefon, 
              informații despre companie și alte date necesare pentru funcționarea contului dvs.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">2. Utilizarea Informațiilor</h2>
            <p>
              Folosim informațiile colectate pentru: furnizarea și îmbunătățirea serviciilor, comunicarea cu dvs., 
              procesarea tranzacțiilor, și personalizarea experienței pe platformă.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">3. Partajarea Informațiilor</h2>
            <p>
              Nu vindem informațiile personale terților. Putem partaja informații cu: furnizori de servicii care ne 
              ajută să operăm platforma, parteneri de business în contextul tranzacțiilor pe platformă, și autorități 
              când este cerut de lege.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">4. Securitatea Datelor</h2>
            <p>
              Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja informațiile personale împotriva 
              accesului neautorizat, modificării, divulgării sau distrugerii.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">5. Cookie-uri</h2>
            <p>
              Utilizăm cookie-uri pentru a îmbunătăți experiența pe site, a analiza traficul și a personaliza conținutul. 
              Puteți controla cookie-urile prin setările browserului.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">6. Drepturile Dvs. (GDPR)</h2>
            <p>
              Aveți dreptul la: acces la datele personale, rectificarea datelor inexacte, ștergerea datelor, 
              restricționarea prelucrării, portabilitatea datelor, și opoziția la prelucrare.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">7. Contact</h2>
            <p>
              Pentru exercitarea drepturilor sau întrebări: 
              <a href="mailto:contact@gymbuilder.app" className="text-gold-400 hover:text-gold-300"> contact@gymbuilder.app</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
