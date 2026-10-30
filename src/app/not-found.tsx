'use client';
import { useUiText } from '@/i18n/useUiText';
import Link from 'next/link';

export default function NotFound() {
  const ui = useUiText();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0d', color: '#f4f4f5' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: '#e8b811', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.25rem' }}>{ui("Pagina nu a fost găsită")}</p>
        <Link href="/" style={{ color: '#e8b811', marginTop: '2rem', display: 'inline-block' }}>{ui("Înapoi la Pagina Principală")}</Link>
      </div>
    </div>
  );
}
