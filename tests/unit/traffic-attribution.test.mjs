import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trafficSource, trafficContact } from '../../src/lib/traffic-attribution.ts';

test('traffic attribution reduces campaigns and referrers to fixed categories', () => {
  assert.equal(trafficSource('?utm_source=Instagram&email=secret', '', 'https://www.gymbuilder.app'), 'instagram');
  assert.equal(trafficSource('?fbclid=private-click-id', '', 'https://www.gymbuilder.app'), 'facebook');
  assert.equal(trafficSource('', 'https://l.facebook.com/path?secret=yes', 'https://www.gymbuilder.app'), 'facebook');
  assert.equal(trafficSource('', 'https://www.google.ro/search?q=secret', 'https://www.gymbuilder.app'), 'google');
  assert.equal(trafficSource('', 'https://www.gymbuilder.app/products', 'https://www.gymbuilder.app'), 'direct');
  assert.equal(trafficSource('?utm_source=custom-private-name', '', 'https://www.gymbuilder.app'), 'campaign');
  assert.equal(trafficSource('', 'https://facebook.com.evil.test/', 'https://www.gymbuilder.app'), 'referral');
  assert.equal(trafficSource('', '', 'https://www.gymbuilder.app'), 'direct');
});

test('contact tracking classifies links without collecting numbers or messages', () => {
  assert.equal(trafficContact('tel:+40700000000'), 'phone');
  assert.equal(trafficContact('https://wa.me/40700000000?text=private'), 'whatsapp');
  assert.equal(trafficContact('https://api.whatsapp.com/send?phone=40700000000'), 'whatsapp');
  for (const link of ['mailto:private@example.com', 'https://whatsapp.com.evil.test/', 'https://example.com/wa.me/', 'javascript:alert(1)', '/suppliers']) assert.equal(trafficContact(link), null);
});
