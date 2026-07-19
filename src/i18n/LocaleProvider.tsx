'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const LocaleContext = createContext<string>('ro');

export function useLocaleContext() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ initialLocale, children }: { initialLocale: string; children: ReactNode }) {
  const [locale, setLocale] = useState(initialLocale);

  useEffect(() => {
    const handleLocaleChange = () => {
      const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
      const newLocale = match?.[1] || 'ro';
      setLocale(newLocale);
    };
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, []);

  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  );
}
