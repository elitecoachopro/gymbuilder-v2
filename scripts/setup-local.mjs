import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const status = JSON.parse(execFileSync('supabase', ['status', '-o', 'json'], { encoding: 'utf8' }));
const values = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};
let contents = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
for (const [name, value] of Object.entries(values)) {
  if (!value) throw new Error(`Supabase local nu a returnat ${name}.`);
  const pattern = new RegExp(`^${name}=.*$`, 'm');
  contents = pattern.test(contents)
    ? contents.replace(pattern, `${name}=${value}`)
    : `${contents.trimEnd()}\n${name}=${value}\n`;
}
writeFileSync('.env.local', contents.trimStart(), { mode: 0o600 });
console.log('Configurarea locala a fost salvata in .env.local. Pornire: npm run dev');
