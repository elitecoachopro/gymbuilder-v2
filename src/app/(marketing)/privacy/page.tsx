'use client';

import { useUiText } from '@/i18n/useUiText';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useClientTranslations } from '@/i18n/client';

export default function PrivacyPage() {
  const ui = useUiText();
  const { t, locale } = useClientTranslations('privacy');
  const en = locale === 'en';

  return (
    <main className="min-h-screen">

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            {t('titlePart1')} <span className="gold-gradient">{t('titlePart2')}</span>
          </h1>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-anthracite-300">
            <p className="text-anthracite-400 text-sm">{t('lastUpdated')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s1Title')}</h2>
            <p>{t('s1Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s2Title')}</h2>
            <p>{t('s2Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s3Title')}</h2>
            <p>{t('s3Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s4Title')}</h2>
            <p>{t('s4Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s5Title')}</h2>
            <p>{t('s5Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s6Title')}</h2>
            <p>{t('s6Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s7Title')}</h2>
            <p>
              {t('s7Text')}{ui(' ')}
              <a href="mailto:contact@gymbuilder.app" className="text-gold-400 hover:text-gold-300"> contact@gymbuilder.app</a>
            </p>

            <section id="ai" className="scroll-mt-40 space-y-3">
              <h2 className="text-xl font-semibold text-white">{en ? 'AI project proposals' : 'Propuneri de proiect cu AI'}</h2>
              <p>{en ? 'The optional AI assistant uses the OpenAI API. Only after you agree and press Generate, Gym Builder sends the requirements you enter, dimensions, budget, selected zones and current project geometry/equipment for processing. Do not enter personal, confidential or health information. Manual configuration remains available without this transfer.' : 'Asistentul AI opțional folosește API-ul OpenAI. Numai după acordul tău și apăsarea butonului de generare, Gym Builder trimite spre procesare cerințele introduse, dimensiunile, bugetul, zonele selectate și geometria/dotările proiectului curent. Nu introduce date personale, confidențiale sau medicale. Configurarea manuală rămâne disponibilă fără acest transfer.'}</p>
              <p><a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline">{en ? 'OpenAI privacy policy' : 'Politica de confidențialitate OpenAI'}</a></p>
            </section>
            <section id="account-deletion" className="scroll-mt-40 space-y-3">
              <h2 className="text-xl font-semibold text-white">{en ? 'Account and associated data deletion' : 'Ștergerea contului și a datelor asociate'}</h2>
              <p>{en ? 'You can initiate deletion from account settings or the dedicated page below. Requests are processed manually within 30 days; submitting a request does not mean immediate deletion. Data required for legal obligations or disputes may be retained; applicable exceptions will be explained during processing.' : 'Poți iniția ștergerea din setările contului sau din pagina dedicată de mai jos. Cererile sunt procesate manual în maximum 30 de zile; trimiterea cererii nu înseamnă ștergere imediată. Datele necesare obligațiilor legale sau litigiilor pot fi păstrate; excepțiile aplicabile vor fi explicate la procesare.'}</p>
              <Link href="/delete-account" className="inline-flex min-h-11 items-center text-gold-400 underline">{en ? 'Delete your Gym Builder account' : 'Șterge contul Gym Builder'}</Link>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
