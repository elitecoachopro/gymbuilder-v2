import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const label = 'com.gymbuilder.local';
const domain = `gui/${process.getuid?.()}`;
const target = `${domain}/${label}`;
const plist = path.join(homedir(), 'Library/LaunchAgents', `${label}.plist`);
const logs = path.join(homedir(), 'Library/Logs/GymBuilder');
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const ctl = args => execFileSync('/bin/launchctl', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
function loaded() { try { ctl(['print', target]); return true; } catch { return false; } }
function owned() {
  if (existsSync(plist) && !readFileSync(plist, 'utf8').includes(`<string>${xml(path.join(root, 'scripts/local-runtime.mjs'))}</string>`)) throw new Error('This service label belongs to another checkout; refusing to replace or remove it.');
}

try {
  if (process.platform !== 'darwin') throw new Error('This local service requires macOS launchd.');
  const action = process.argv[2] || 'status';
  if (action === 'status') {
    if (!loaded()) console.log('GymBuilder service is not loaded.');
    else {
      const state = ctl(['print', target]).split('\n').filter(line => /^\t(state|pid|last exit code|runs) =/.test(line));
      console.log([label, ...state, 'URL: http://127.0.0.1:3000/configurator', `Logs: ${logs}`].join('\n'));
    }
  } else if (action === 'install') {
    owned();
    if (!existsSync(path.join(root, '.next/BUILD_ID'))) throw new Error('Run npm run build before installing the service.');
    mkdirSync(path.dirname(plist), { recursive: true });
    mkdirSync(logs, { recursive: true, mode: 0o700 });
    for (const name of ['server.log', 'server-error.log']) { writeFileSync(path.join(logs, name), '', { flag: 'a', mode: 0o600 }); chmodSync(path.join(logs, name), 0o600); }
    const contents = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(path.join(root, 'scripts/local-runtime.mjs'))}</string></array>
<key>WorkingDirectory</key><string>${xml(homedir())}</string>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string><key>NODE_ENV</key><string>production</string></dict>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>30</integer><key>Umask</key><integer>63</integer>
<key>StandardOutPath</key><string>${xml(path.join(logs, 'server.log'))}</string>
<key>StandardErrorPath</key><string>${xml(path.join(logs, 'server-error.log'))}</string>
</dict></plist>\n`;
    if (loaded()) ctl(['bootout', target]);
    writeFileSync(plist, contents, { mode: 0o600 });
    execFileSync('/usr/bin/plutil', ['-lint', plist], { stdio: 'ignore' });
    ctl(['bootstrap', domain, plist]);
    console.log('GymBuilder installed: starts at login and restarts after an exit, independently of ChatGPT.');
  } else if (action === 'restart') {
    owned();
    if (!loaded()) throw new Error('Service is not loaded. Run npm run local:install first.');
    ctl(['kickstart', '-k', target]);
    console.log('GymBuilder restart requested.');
  } else if (action === 'uninstall') {
    owned();
    if (loaded()) ctl(['bootout', target]);
    if (existsSync(plist)) unlinkSync(plist);
    console.log('GymBuilder service removed. Database volumes and local configuration are preserved.');
  } else throw new Error('Usage: node scripts/local-service.mjs install|status|restart|uninstall');
} catch (error) {
  // launchctl can include process environment in verbose output; expose only our messages.
  console.error(error instanceof Error && !('status' in error) ? error.message : 'macOS service operation failed. Check launchd access and the local service log.');
  process.exitCode = 1;
}
