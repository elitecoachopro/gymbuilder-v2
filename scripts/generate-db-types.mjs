import { execFileSync } from 'node:child_process';
import { writeFileSync, renameSync } from 'node:fs';
const output = execFileSync('supabase', ['gen', 'types', 'typescript', '--local'], { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
const target = new URL('../src/types/database.generated.ts', import.meta.url);
const temporary = new URL('../src/types/database.generated.ts.tmp', import.meta.url);
writeFileSync(temporary, output);
renameSync(temporary, target);
