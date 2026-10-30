import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supplierWebsite, supplierTelephone, supplierEmail, parsePublicContactEmail } from '../../src/lib/supplier-contact.ts';

test('supplier websites accept web addresses and reject executable links', () => {
  assert.equal(supplierWebsite('example.com/contact'), 'https://example.com/contact');
  assert.equal(supplierWebsite(' https://example.com '), 'https://example.com/');
  for (const value of [null, '', 'javascript:alert(1)', 'data:text/html,test', 'https://user:password@example.com', 'not a website']) {
    assert.equal(supplierWebsite(value), null);
  }
});

test('supplier telephone links preserve international dialing prefixes', () => {
  assert.equal(supplierTelephone('+86 (21) 1234-5678'), 'tel:+862112345678');
  assert.equal(supplierTelephone('0040 700 123 456'), 'tel:0040700123456');
  for (const value of [null, '', 'call me', '123', '+40;123456789']) assert.equal(supplierTelephone(value), null);
});

test('public contact email links cannot inject mail headers', () => {
  assert.equal(supplierEmail(' sales@example.com '), 'mailto:sales@example.com');
  for (const email of [null, '', 'bad address', 'a@example.com?bcc=other@example.com', 'a%0d%0a@example.com', 'a@example.com\r\nBcc:other@example.com']) assert.equal(supplierEmail(email), null);
});


test('public email input is optional, normalized, and rejects invalid values without rewriting them', () => {
  for (const value of [undefined, null, '', '  ']) assert.deepEqual(parsePublicContactEmail(value), { valid: true, email: null });
  assert.deepEqual(parsePublicContactEmail(' SALES+Gym@Example.COM '), { valid: true, email: 'sales+gym@example.com' });
  for (const value of [42, {}, ['sales@example.com'], 'sales @example.com', 'a@example.com?bcc=other@example.com', 'a@example.com\r\nBcc:other@example.com', 'a%0d%0a@example.com']) {
    assert.deepEqual(parsePublicContactEmail(value), { valid: false, email: null });
  }
});
