'use client';

import { useCallback } from 'react';
import { useLocaleContext } from './LocaleProvider';
import roMessages from './messages/ro.json';
import enMessages from './messages/en.json';

type Messages = Record<string, Record<string, string>>;

const allMessages: Record<string, Messages> = {
  ro: roMessages as unknown as Messages,
  en: enMessages as unknown as Messages,
};

export function useClientLocale() {
  return useLocaleContext();
}

export function useClientTranslations(namespace?: string) {
  const locale = useClientLocale();
  const messages = allMessages[locale] || allMessages.ro;

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
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
