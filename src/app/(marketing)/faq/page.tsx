'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, ShoppingCart, Package, CreditCard, Shield } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ElementType;
  color: string;
  items: FAQItem[];
}

function AccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-anthracite-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-1 text-left group"
      >
        <span className={`text-sm font-medium transition-colors ${isOpen ? 'text-gold-400' : 'text-white group-hover:text-gold-400'}`}>
          {question}
        </span>
        <ChevronDown className={`w-4 h-4 text-anthracite-400 shrink-0 ml-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold-400' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
        <p className="text-anthracite-400 text-sm leading-relaxed px-1">{answer}</p>
      </div>
    </div>
  );
}

const faqData: FAQCategory[] = [
  {
    title: 'Pentru Clienți',
    icon: ShoppingCart,
    color: 'blue',
    items: [
      {
        question: 'Cum trimit o cerere de ofertă?',
        answer: 'Navighează la produsul dorit sau la profilul furnizorului și apasă butonul "Solicită Ofertă" sau "Contactează Furnizorul". Completează formularul cu detaliile cererii tale (cantitate, specificații, termen de livrare dorit) și furnizorul va primi notificarea instant. Vei primi răspunsul direct în dashboard-ul tău.',
      },
      {
        question: 'Ce diferență este între echipamente Noi și Second-Hand?',
        answer: 'Echipamentele Noi sunt produse direct de la producător sau distribuitor, cu garanție completă. Echipamentele Second-Hand sunt folosite anterior, verificate de furnizor, și oferite la prețuri reduse (de obicei 40-70% din prețul de nou). Fiecare produs second-hand are starea detaliată în descriere (uzură, funcționalitate, ani de utilizare).',
      },
      {
        question: 'Trebuie să plătesc pentru a folosi platforma ca client?',
        answer: 'Nu. Înregistrarea și utilizarea platformei sunt complet gratuite pentru clienți. Poți căuta echipamente, compara prețuri, trimite cereri de ofertă și comunica cu furnizorii fără niciun cost. Plătești doar echipamentele pe care le comanzi, direct furnizorului.',
      },
      {
        question: 'Cum funcționează pagina "Construiește-ți sala"?',
        answer: 'Pagina "Construiește-ți sala" te ghidează pas cu pas în planificarea unei săli de fitness de la zero. Introduci suprafața disponibilă, bugetul și tipul de sală dorit, iar platforma îți recomandă categorii de echipamente, cantități și furnizori potriviți din rețeaua noastră.',
      },
    ],
  },
  {
    title: 'Pentru Furnizori',
    icon: Package,
    color: 'emerald',
    items: [
      {
        question: 'Cât costă înregistrarea ca furnizor?',
        answer: 'Înregistrarea de bază pe platformă este gratuită. După aprobare, poți lista produse și primi cereri de ofertă fără costuri. Pentru vizibilitate sporită, oferim pachete de promovare (Professional și Enterprise) cu beneficii suplimentare: poziționare prioritară, badge verificat, analytics avansate și Oferta Zilei.',
      },
      {
        question: 'Cum funcționează promovarea "Oferta Zilei"?',
        answer: 'Oferta Zilei este un slot de promovare premium afișat pe homepage-ul platformei timp de 24 de ore. Produsul tău apare în secțiunea dedicată, vizibil tuturor vizitatorilor. Poți rezerva un slot din dashboard-ul de furnizor. Costul este de €19/zi sau inclus în pachetele Professional/Enterprise.',
      },
      {
        question: 'Cât durează procesul de aprobare?',
        answer: 'Verificarea datelor companiei durează de obicei 1-3 zile lucrătoare. Echipa noastră verifică: existența juridică a firmei (CUI valid), datele de contact, și calitatea portofoliului de produse. Vei primi notificare pe email când contul este aprobat.',
      },
      {
        question: 'Pot importa produse în bulk?',
        answer: 'Da. Din dashboard-ul de furnizor ai opțiunea de import CSV. Pregătește un fișier cu coloanele: nume produs, categorie, preț, stare, descriere, specificații. Platforma validează datele și creează listările automat. Poți adăuga fotografiile ulterior pentru fiecare produs.',
      },
    ],
  },
  {
    title: 'Plăți și Prețuri',
    icon: CreditCard,
    color: 'gold',
    items: [
      {
        question: 'Ce metode de plată sunt acceptate pentru pachete?',
        answer: 'Pachetele de promovare și serviciile de consultanță se plătesc prin card bancar (Visa, Mastercard, American Express) procesate securizat prin Stripe. Plata pentru echipamentele achiziționate se face direct cu furnizorul, conform condițiilor agreate între părți.',
      },
      {
        question: 'Pot anula un abonament de promovare?',
        answer: 'Da. Poți anula oricând din dashboard-ul de furnizor. Anularea intră în vigoare la sfârșitul perioadei de facturare curente — beneficiile rămân active până atunci. Nu se percepe nicio taxă de anulare. Poți reactiva abonamentul oricând.',
      },
      {
        question: 'Cât costă serviciul de consultanță?',
        answer: 'Consultanța pentru planificarea sălii de fitness costă €99 per sesiune. O sesiune include: analiza spațiului disponibil, recomandări de echipamente, estimare buget, și un plan de achiziție personalizat. Sesiunile suplimentare beneficiază de discount.',
      },
    ],
  },
  {
    title: 'Cont și Securitate',
    icon: Shield,
    color: 'purple',
    items: [
      {
        question: 'Cum îmi resetez parola?',
        answer: 'Accesează pagina de autentificare și apasă "Am uitat parola". Introdu adresa de email asociată contului și vei primi un link de resetare valid 1 oră. Dacă nu primești emailul, verifică folderul Spam sau contactează-ne la contact@gymbuilder.app.',
      },
      {
        question: 'Cum pot solicita ștergerea contului?',
        answer: 'Conform GDPR Art. 17, ai dreptul de a solicita ștergerea completă a contului. Din dashboard-ul tău, secțiunea "Setări Cont", apasă butonul "Solicită ștergerea contului". Cererea va fi procesată în maxim 30 de zile, iar toate datele personale vor fi șterse permanent.',
      },
      {
        question: 'Datele mele sunt în siguranță?',
        answer: 'Da. Folosim criptare SSL/TLS pentru toate conexiunile, datele sunt stocate pe servere securizate în UE, iar plățile sunt procesate prin Stripe (certificat PCI DSS Level 1). Nu stocăm niciodată datele cardului tău. Consultă Politica de Confidențialitate pentru detalii complete.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    gold: 'bg-gold-400/10 border-gold-400/30 text-gold-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Înapoi la homepage
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Întrebări Frecvente</h1>
          <p className="text-anthracite-400 mb-12 max-w-2xl">
            Răspunsuri la cele mai comune întrebări despre GymBuilder. Nu găsești ce cauți?{' '}
            <Link href="/contact" className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors">
              Contactează-ne
            </Link>
          </p>

          <div className="space-y-8">
            {faqData.map((category, catIdx) => {
              const Icon = category.icon;
              return (
                <div key={catIdx} className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-9 h-9 border rounded-lg flex items-center justify-center ${colorMap[category.color]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{category.title}</h2>
                  </div>
                  <div>
                    {category.items.map((item, itemIdx) => {
                      const key = `${catIdx}-${itemIdx}`;
                      return (
                        <AccordionItem
                          key={key}
                          question={item.question}
                          answer={item.answer}
                          isOpen={!!openItems[key]}
                          onToggle={() => toggleItem(key)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gold-400/5 border border-gold-400/20 rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Nu ai găsit răspunsul?</h3>
            <p className="text-anthracite-400 text-sm mb-4">
              Echipa noastră îți răspunde în maxim 24 de ore lucrătoare.
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
