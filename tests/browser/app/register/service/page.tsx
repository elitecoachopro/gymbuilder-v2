'use client';
import { LocaleProvider } from '../../../../../src/i18n/LocaleProvider';
import Registration from '../../../../../src/app/(auth)/register/supplier/page';
export default function ServiceRegistrationCheck() {
  return <LocaleProvider initialLocale="ro"><Registration /></LocaleProvider>;
}
