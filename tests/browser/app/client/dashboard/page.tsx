"use client";
import { Suspense } from 'react';
import ClientDashboard from '../../../../../src/app/(dashboard)/client/dashboard/page';
import { LocaleProvider } from '../../../../../src/i18n/LocaleProvider';
export default function Fixture() { return <LocaleProvider initialLocale="ro"><Suspense><ClientDashboard /></Suspense></LocaleProvider>; }
