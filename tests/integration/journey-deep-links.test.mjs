import test from 'node:test';
import assert from 'node:assert/strict';
import { api, db, fixtureSupplier, fixtureUser, login, cleanupUsers } from './helpers.mjs';

test('conversation links retrieve an old request for its participants without exposing it to another account', async t => {
  const client = await fixtureUser(), stranger = await fixtureUser(), supplier = await fixtureSupplier(), otherSupplier = await fixtureSupplier();
  t.after(() => cleanupUsers([client, stranger, supplier, otherSupplier]));
  const rows = Array.from({length: 51}, (_,i)=>({client_id:client.id,client_name:'Audit link',client_email:client.email,supplier_id:supplier.supplierId,message:`Deep link ${i}`,status:'sent',created_at:new Date(Date.now()-i*1000).toISOString()}));
  const inserted = await db.from('contact_requests').insert(rows).select('id,message'); assert.equal(inserted.error,null);
  const target=inserted.data.find(r=>r.message==='Deep link 50').id;
  const c = await (await api(`/api/client/dashboard?chat=${target}`,{cookie:await login(client)})).json();
  assert.ok(c.contactRequests.some(r=>r.id===target));
  const s = await (await api(`/api/supplier/dashboard?chat=${target}`,{cookie:await login(supplier)})).json();
  assert.ok(s.recentRequests.some(r=>r.id===target));
  const deniedClient = await (await api(`/api/client/dashboard?chat=${target}`,{cookie:await login(stranger)})).json();
  const deniedSupplier = await (await api(`/api/supplier/dashboard?chat=${target}`,{cookie:await login(otherSupplier)})).json();
  assert.ok(!deniedClient.contactRequests.some(r=>r.id===target));
  assert.ok(!deniedSupplier.recentRequests.some(r=>r.id===target));
});
