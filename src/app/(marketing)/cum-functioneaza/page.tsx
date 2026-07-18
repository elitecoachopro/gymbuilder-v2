'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft, Search, MessageSquare, CheckCircle, UserPlus, ShieldCheck, Package, Bell, Building2, ClipboardList, Ruler, ShoppingCart } from 'lucide-react';

function StepCard({ number, title, description, icon: Icon }: { number: number; title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="w-10 h-10 bg-gold-400/10 border border-gold-400/30 rounded-xl flex items-center justify-center">
          <span className="text-gold-400 font-bold text-sm">{number}</span>
        </div>
      </div>
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-gold-400" />
          <h4 className="text-white font-semibold text-sm">{title}</h4>
        </div>
        <p className="text-anthracite-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function CumFunctioneazaPage() {
  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Înapoi la homepage
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Cum funcționează GymBuilder</h1>
          <p className="text-anthracite-400 mb-14 max-w-2xl">
            GymBuilder conectează proprietarii de săli de fitness cu furnizori verificați de echipamente. 
            Iată cum funcționează platforma pentru fiecare tip de utilizator.
          </p>

          {/* Section 1: Client */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pentru Clienți</h2>
                <p className="text-anthracite-400 text-xs">Proprietari sau viitori proprietari de săli</p>
              </div>
            </div>
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-6">
              <StepCard
                number={1}
                icon={Search}
                title="Caută echipamente"
                description="Navighează catalogul cu sute de produse de la furnizori verificați. Filtrează după categorie (cardio, forță, funcțional), stare (nou/second-hand), preț sau brand."
              />
              <StepCard
                number={2}
                icon={ClipboardList}
                title="Compară ofertele"
                description="Vizualizează specificațiile, prețurile și review-urile altor clienți. Adaugă produse la Favorite pentru a le compara mai ușor."
              />
              <StepCard
                number={3}
                icon={MessageSquare}
                title="Trimite o cerere de ofertă"
                description="Contactează direct furnizorul prin platforma noastră. Descrie-ți nevoile, cere un preț personalizat sau negociază cantitățile."
              />
              <StepCard
                number={4}
                icon={CheckCircle}
                title="Primești oferta și finalizezi"
                description="Furnizorul îți răspunde cu o ofertă detaliată. Discutați detaliile prin chat-ul integrat și finalizați comanda direct."
              />
            </div>
            <div className="mt-4 text-center">
              <Link href="/register/client" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                Creează cont gratuit de client →
              </Link>
            </div>
          </div>

          {/* Section 2: Supplier */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pentru Furnizori</h2>
                <p className="text-anthracite-400 text-xs">Distribuitori și producători de echipamente fitness</p>
              </div>
            </div>
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-6">
              <StepCard
                number={1}
                icon={UserPlus}
                title="Înregistrează-te ca furnizor"
                description="Completează formularul de înregistrare cu datele companiei, portofoliul de produse și zona de livrare. Procesul durează sub 5 minute."
              />
              <StepCard
                number={2}
                icon={ShieldCheck}
                title="Verificare și aprobare"
                description="Echipa GymBuilder verifică datele companiei tale. După aprobare, profilul tău devine vizibil pe platformă și poți începe să vinzi."
              />
              <StepCard
                number={3}
                icon={Package}
                title="Adaugă produse"
                description="Încarcă produsele cu fotografii, specificații, prețuri și stoc. Poți importa în bulk din CSV sau adăuga manual, unul câte unul."
              />
              <StepCard
                number={4}
                icon={Bell}
                title="Primești cereri de ofertă"
                description="Clienții interesați te contactează direct. Primești notificări instant și poți răspunde prin chat-ul integrat al platformei."
              />
            </div>
            <div className="mt-4 text-center">
              <Link href="/register/supplier" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                Devino furnizor pe GymBuilder →
              </Link>
            </div>
          </div>

          {/* Section 3: Build from scratch */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-gold-400/10 border border-gold-400/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Construiește-ți sala de la 0</h2>
                <p className="text-anthracite-400 text-xs">Pentru cei care pornesc de la zero</p>
              </div>
            </div>
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-6">
              <StepCard
                number={1}
                icon={Ruler}
                title="Definește spațiul și bugetul"
                description="Spune-ne suprafața disponibilă, bugetul estimat și tipul de sală pe care ți-l dorești (crossfit, bodybuilding, funcțional, mixt). Folosește pagina 'Construiește-ți sala' pentru un ghid interactiv."
              />
              <StepCard
                number={2}
                icon={ClipboardList}
                title="Primești o recomandare personalizată"
                description="Pe baza datelor tale, platforma îți sugerează categorii de echipamente necesare, cantități recomandate și furnizori potriviți din rețeaua noastră."
              />
              <StepCard
                number={3}
                icon={ShoppingCart}
                title="Compară și alege echipamentele"
                description="Navighează produsele recomandate, compară prețuri de la mai mulți furnizori și trimite cereri de ofertă pentru pachetul complet."
              />
              <StepCard
                number={4}
                icon={MessageSquare}
                title="Consultanță dedicată (opțional)"
                description="Dacă ai nevoie de ghidare suplimentară, echipa noastră de consultanți te poate ajuta cu planificarea layout-ului, alegerea echipamentelor și negocierea cu furnizorii."
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-6">
              <Link href="/construieste-sala" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                Construiește-ți sala →
              </Link>
              <Link href="/consultation" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                Solicită consultanță →
              </Link>
            </div>
          </div>

          {/* FAQ teaser */}
          <div className="bg-gold-400/5 border border-gold-400/20 rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Ai alte întrebări?</h3>
            <p className="text-anthracite-400 text-sm mb-4">
              Echipa noastră este aici să te ajute. Contactează-ne oricând.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-gold-400 text-anthracite-950 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors"
            >
              Contactează-ne
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
