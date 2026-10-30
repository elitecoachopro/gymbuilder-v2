import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const log = message => console.log(`${new Date().toISOString()} ${message}`);
async function command(file, args, timeout = 180000) {
  try { await exec(file, args, { cwd: root, timeout, maxBuffer: 4 * 1024 * 1024 }); }
  catch { throw new Error(`Local dependency command failed: ${file} ${args.join(' ')}. Check that Docker/Colima is available.`); }
}

try {
  await access(new URL('../.next/BUILD_ID', import.meta.url));
  try { await command('docker', ['info', '--format', '{{.ServerVersion}}'], 10000); }
  catch { log('Starting existing Colima VM.'); await command('colima', ['start']); }
  // Capture CLI output in memory: supabase start can print local API keys.
  await command('supabase', ['start']);
  log('Local dependencies ready; starting GymBuilder on 127.0.0.1:3000.');
  const server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)), 'start', '--hostname', '127.0.0.1', '--port', '3000'], { cwd: root, stdio: 'inherit' });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.kill(signal));
  server.on('error', () => { log('Failed to launch Next.js.'); process.exitCode = 1; });
  server.on('exit', (code, signal) => { log(`Next.js exited (${signal || code}).`); process.exitCode = code ?? 1; });
} catch (error) {
  log(error instanceof Error && error.message.startsWith('Local dependency') ? error.message : 'Local startup failed. Run npm ci and npm run build before installing the service.');
  process.exitCode = 1;
}
