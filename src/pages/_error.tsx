import { useEffect, useState } from 'react';
import type { NextPageContext } from 'next';
import Link from 'next/link';
function Error({ statusCode }: { statusCode?: number }) {
  const [english, setEnglish] = useState(false);
  useEffect(() => { setEnglish(/(?:^|; )locale=en(?:;|$)/.test(document.cookie)); }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0d', color: '#f4f4f5' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: '#e8b811', marginBottom: '1rem' }}>{statusCode || 'Error'}</h1>
        <p style={{ fontSize: '1.25rem' }}>
          {english ? (statusCode === 404 ? 'Page not found' : 'An error occurred') : (statusCode === 404 ? 'Pagina nu a fost găsită' : 'A apărut o eroare')}
        </p>
        <Link href="/" style={{ color: '#e8b811', marginTop: '2rem', display: 'inline-block' }}>{english ? 'Back to homepage' : 'Înapoi la Pagina Principală'}</Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
