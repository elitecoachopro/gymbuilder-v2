'use client';

import { useEffect, useState, useCallback } from 'react';

type Messages = Record<string, Record<string, string>>;

let cachedMessages: Messages | null = null;
let cachedLocale: string | null = null;

function getCookieLocale(): string {
  if (typeof document === 'undefined') return 'ro';
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  return match?.[1] || 'ro';
}

async function loadMessages(locale: string): Promise<Messages> {
  if (cachedMessages && cachedLocale === locale) return cachedMessages;
  const msgs = locale === 'en'
    ? (await import('../../messages/en.json')).default
    : (await import('../../messages/ro.json')).default;
  cachedMessages = msgs as unknown as Messages;
  cachedLocale = locale;
  return cachedMessages;
}

export function useClientLocale() {
  const [locale, setLocale] = useState<string>(getCookieLocale());

  useEffect(() => {
    const handleLocaleChange = () => {
      const newLocale = getCookieLocale();
      if (newLocale !== locale) {
        setLocale(newLocale);
        cachedMessages = null; // invalidate cache
      }
    };

    // Listen for custom event dispatched by LanguageSwitcher
    window.addEventListener('locale-changed', handleLocaleChange);
    return () => window.removeEventListener('locale-changed', handleLocaleChange);
  }, [locale]);

  return locale;
}

export function useClientTranslations(namespace?: string) {
  const locale = useClientLocale();
  const [messages, setMessages] = useState<Messages | null>(cachedMessages);

  useEffect(() => {
    loadMessages(locale).then(setMessages);
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    if (!messages) return key;
    
    const parts = namespace ? `${namespace}.${key}`.split('.') : key.split('.');
    let value: unknown = messages;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    
    if (typeof value !== 'string') return key;
    
    // Simple interpolation: {year} -> params.year
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }
    return value;
  }, [messages, namespace]);

  return { t, locale };
}
