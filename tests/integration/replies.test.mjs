import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, api, fixtureUser, fixtureSupplier, cleanupUsers, login } from './helpers.mjs';

test('supplier reply persists its text and is visible to the client conversation', async t => {
  const supplier = await fixtureSupplier(), client = await fixtureUser();
  t.after(() => cleanupUsers([supplier, client]));
  const supplierCookie = await login(supplier), clientCookie = await login(client);
  const { data: request, error } = await db.from('contact_requests').insert({ supplier_id: supplier.supplierId, client_id: client.id, client_name: 'Audit Client', client_email: client.email, message: 'Initial quotation' }).select('id').single();
  assert.equal(error, null);
  const response = await api('/api/contact/reply', { cookie: supplierCookie, body: { requestId: request.id, replyMessage: 'Available for delivery next week' } });
  assert.equal(response.status, 200);
  const delivery = await response.json();
  assert.equal(delivery.recorded, true);
  assert.equal(delivery.emailSent, false, 'saving a reply must not claim email delivery without a provider');
  const { data: notification } = await db.from('notifications').select('link').eq('user_id', client.id).eq('type', 'reply_received').single();
  assert.equal(notification.link, `/client/dashboard?chat=${request.id}#cereri`);
  const conversation = await api(`/api/messages?request_id=${request.id}`, { cookie: clientCookie });
  const result = await conversation.json();
  assert.ok(result.messages.some(message => message.content === 'Available for delivery next week'));
  const { data: status } = await db.from('contact_requests').select('status').eq('id', request.id).single();
  assert.equal(status.status, 'replied');
});
