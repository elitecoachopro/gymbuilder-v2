'use client';
import { LocaleProvider } from '../../../../../src/i18n/LocaleProvider';
import GlobalHeader from '../../../../../src/components/layout/GlobalHeader';
import Services from '../../../../../src/app/(dashboard)/supplier/services/page';
export default function ServiceEditorCheck() {
  return <LocaleProvider initialLocale="ro"><GlobalHeader /><Services /></LocaleProvider>;
}
