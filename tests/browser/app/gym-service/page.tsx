'use client';
import { LocaleProvider } from '../../../../src/i18n/LocaleProvider';
import GlobalHeader from '../../../../src/components/layout/GlobalHeader';
import Directory from '../../../../src/app/(marketing)/suppliers/page';
export default function ServiceDirectoryCheck() {
  return <LocaleProvider initialLocale="ro"><GlobalHeader /><Directory /></LocaleProvider>;
}
