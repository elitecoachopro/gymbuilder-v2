'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen">

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Înapoi la homepage
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            De Ce Am Creat <span className="gold-gradient">GymBuilder</span>
          </h1>

          <div className="border-2 border-gold-400 rounded-2xl p-10 md:p-14">
            <p className="text-white leading-relaxed text-base md:text-lg">
              GymBuilder s-a născut din experiența reală a unui antreprenor care a deschis mai multe săli de fitness de la zero. Am trăit personal dificultatea de a găsi furnizori corecți, de a compara prețuri și de a lua decizii bune cu un buget limitat. Nu exista nicio platformă care să conecteze viitorii proprietari de săli cu furnizorii de echipamente din întreaga lume. Astăzi GymBuilder rezolvă exact această problemă — o piață globală de echipamente fitness unde transparența și calitatea sunt prioritatea numărul unu.
            </p>
          </div>

          <div className="mt-12 space-y-8 text-anthracite-300 leading-relaxed">
            <p>
              Când am deschis prima sală, am petrecut luni întregi căutând furnizori pe Google, la târguri internaționale și prin recomandări. Am plătit prețuri prea mari pentru că nu aveam cu cine compara. Am comandat echipamente care nu corespundeau așteptărilor. Am pierdut timp și bani.
            </p>
            <p>
              GymBuilder există pentru ca tu să nu treci prin aceeași experiență. Platforma noastră îți oferă acces la furnizori verificați din toată lumea, prețuri transparente și consultanță de la cineva care a fost exact în locul tău.
            </p>
            <p>
              Misiunea noastră este simplă: să facem procesul de echipare a unei săli de fitness mai transparent, mai eficient și mai accesibil pentru toți antreprenorii din industria fitness.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
