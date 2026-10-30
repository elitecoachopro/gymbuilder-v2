interface PolicyOptions {
  isDevelopment: boolean;
  supabaseOrigin: string;
  devConnections: string;
}

export function contentSecurityPolicy({ isDevelopment, supabaseOrigin, devConnections }: PolicyOptions) {
  const devScripts = isDevelopment ? " 'unsafe-eval'" : '';
  // Three decodes embedded GLB images with fetch(blob:); Next soft navigation retains the document policy.
  return `default-src 'self'; script-src 'self' 'unsafe-inline'${devScripts}; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:${supabaseOrigin}; font-src 'self'; connect-src 'self' blob:${supabaseOrigin}${devConnections}`;
}
