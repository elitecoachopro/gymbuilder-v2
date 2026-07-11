function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0d', color: '#f4f4f5' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: '#e8b811', marginBottom: '1rem' }}>{statusCode || 'Error'}</h1>
        <p style={{ fontSize: '1.25rem' }}>
          {statusCode === 404 ? 'Pagina nu a fost găsită' : 'A apărut o eroare'}
        </p>
        <a href="/" style={{ color: '#e8b811', marginTop: '2rem', display: 'inline-block' }}>Înapoi la Pagina Principală</a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
