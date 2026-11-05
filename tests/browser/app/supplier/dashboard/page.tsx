"use client";
import { Suspense } from 'react';
import SupplierDashboard from '../../../../../src/app/(dashboard)/supplier/dashboard/page';
import { LocaleProvider } from '../../../../../src/i18n/LocaleProvider';
export default function Fixture() { return <LocaleProvider initialLocale="ro"><Suspense><SupplierDashboard /></Suspense></LocaleProvider>; }
