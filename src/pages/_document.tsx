import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ro" className="dark">
      <Head />
      <body className="min-h-screen bg-anthracite-950 text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
