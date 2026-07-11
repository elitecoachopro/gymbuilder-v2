export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0d', color: '#f4f4f5' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: '#e8b811', marginBottom: '1rem' }}>404</h1>
        <p style={{ fontSize: '1.25rem' }}>Pagina nu a fost găsită</p>
        <a href="/" style={{ color: '#e8b811', marginTop: '2rem', display: 'inline-block' }}>Înapoi la Pagina Principală</a>
      </div>
    </div>
  );
}
