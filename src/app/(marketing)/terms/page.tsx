'use client';

import Footer from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen">

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Termeni & <span className="gold-gradient">Condiții</span>
          </h1>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-anthracite-300">
            <p className="text-anthracite-400 text-sm">Ultima actualizare: Ianuarie 2024</p>

            <h2 className="text-xl font-semibold text-white mt-8">1. Acceptarea Termenilor</h2>
            <p>
              Prin accesarea și utilizarea platformei GymBuilder.app, acceptați să fiți obligat de acești Termeni și Condiții. 
              Dacă nu sunteți de acord cu oricare parte a acestor termeni, nu aveți permisiunea de a accesa serviciul.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">2. Descrierea Serviciului</h2>
            <p>
              GymBuilder este o platformă B2B care conectează furnizori de echipamente fitness cu proprietari de săli de fitness 
              și centre sportive. Platforma oferă servicii de listare produse, consultanță și facilitare tranzacții.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">3. Conturi de Utilizator</h2>
            <p>
              Pentru a utiliza anumite funcționalități ale platformei, trebuie să vă creați un cont. Sunteți responsabil pentru 
              menținerea confidențialității contului și parolei dvs. și pentru restricționarea accesului la computer.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">4. Condiții pentru Furnizori</h2>
            <p>
              Furnizorii care listează produse pe platformă garantează că au dreptul legal de a vinde produsele respective și 
              că informațiile furnizate sunt corecte și complete. GymBuilder își rezervă dreptul de a verifica și aproba furnizorii.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">5. Plăți și Abonamente</h2>
            <p>
              Anumite funcționalități ale platformei necesită un abonament plătit. Prețurile sunt afișate pe pagina de prețuri 
              și pot fi modificate cu un preaviz de 30 de zile.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">6. Limitarea Răspunderii</h2>
            <p>
              GymBuilder nu este responsabil pentru tranzacțiile directe între furnizori și cumpărători. Platforma servește doar 
              ca intermediar pentru facilitarea conexiunilor comerciale.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8">7. Contact</h2>
            <p>
              Pentru întrebări legate de acești termeni, ne puteți contacta la: 
              <a href="mailto:contact@gymbuilder.app" className="text-gold-400 hover:text-gold-300"> contact@gymbuilder.app</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
