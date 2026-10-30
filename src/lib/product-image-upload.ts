type Folder = 'products' | 'products-360';
export function createProductImageUploader(fetcher: typeof fetch = fetch, wait = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds))) {
  const cache = new Map<File, Map<Folder, string>>();
  return async (file: File, folder: Folder): Promise<string> => {
    const cached = cache.get(file)?.get(folder);
    if (cached) return cached;
    for (let attempt = 0; attempt < 3; attempt++) {
      const form = new FormData(); form.set('file', file); form.set('folder', folder);
      const response = await fetcher('/api/upload', { method: 'POST', body: form });
      const data = await response.json();
      const retryAfter = Number(response.headers.get('Retry-After'));
      if (response.status === 429 && attempt < 2 && Number.isFinite(retryAfter) && retryAfter > 0 && retryAfter <= 60) { await wait(retryAfter * 1000); continue; }
      if (!response.ok || typeof data.url !== 'string' || !/^https?:\/\//.test(data.url)) throw new Error(typeof data.error === 'string' ? data.error : 'Eroare la încărcarea fișierului. Încearcă din nou.');
      const folders = cache.get(file) || new Map<Folder, string>(); folders.set(folder, data.url); cache.set(file, folders);
      return data.url;
    }
    throw new Error('Eroare la încărcarea fișierului. Încearcă din nou.');
  };
}
