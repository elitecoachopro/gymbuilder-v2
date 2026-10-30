'use client';
import { useCallback } from 'react';
import { useClientLocale } from './client';
import english from './ui.en.json';
import { translateUi } from './translate';

// Source-language strings are keys; product names and other user content fall through.
export function useUiText() {
  const locale = useClientLocale();
  return useCallback(<T,>(value: T): T => translateUi(value, locale, english), [locale]);
}
