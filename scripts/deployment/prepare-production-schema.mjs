import { readFile, writeFile } from 'node:fs/promises';

// This bundle targets the inspected legacy GymBuilder database, not a new database.
const migrationNames = [
  '20261019000100_complete_application_schema',
  '20261019000200_application_access_boundaries',
  '20261019000300_account_token_lifecycle',
  '20261019000400_atomic_request_messages',
  '20261019000500_data_invariants',
  '20261019000600_complete_aggregates_and_quotas',
  '20261019000700_verified_subscription_entitlements',
  '20261019000800_registration_upload_capabilities',
  '20261019000900_enquiry_idempotency',
  '20261019001000_shared_rate_limits',
  '20261019001100_public_promotions',
  '20261019001200_searchable_catalog',
  '20261019001300_directory_aggregates',
  '20261019001400_contact_message_idempotency',
  '20261020000100_gym_studio_configuration',
  '20261021000100_regional_catalogs',
  '20261021000200_public_source_directory',
  '20261021000300_editorial_catalog_capacity',
  '20261021000400_published_price_currency',
  '20261021000500_legacy_schema_compatibility',
];
const sections = await Promise.all(migrationNames.map(async name => `\n-- ${name}\n${await readFile(new URL(`../../supabase/migrations/${name}.sql`, import.meta.url), 'utf8')}`));
const destination = process.argv[2];
if (!destination) throw new Error('Pass an output SQL path.');
await writeFile(destination, `BEGIN;\nSET LOCAL lock_timeout = '10s';\n${sections.join('\n')}\nROLLBACK;\n`);
console.log(`Prepared a rollback-only schema rehearsal with ${migrationNames.length} migrations.`);
