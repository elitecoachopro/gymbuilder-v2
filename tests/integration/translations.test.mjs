import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { api } from './helpers.mjs';
test('API errors follow the selected interface language', async () => {
  const english = await api('/api/client/favorites',{method:'GET',cookie:'locale=en'});
  assert.equal(english.status,401); assert.equal((await english.json()).error,'Not logged in.');
  const romanian = await api('/api/client/favorites',{method:'GET',cookie:'locale=ro'});
  assert.equal((await romanian.json()).error,'Neautentificat.');
});
test('password validation is translated before any account is created', async () => {
  const response = await api('/api/auth/register/client',{cookie:'locale=en',body:{email:`audit-${randomUUID()}@example.test`,password:'weak',firstName:'Audit',lastName:'Client'}});
  assert.equal(response.status,400);assert.equal((await response.json()).error,'Password must contain at least 8 characters.');
});
