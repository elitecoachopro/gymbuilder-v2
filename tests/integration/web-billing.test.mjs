import {before,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import Stripe from 'stripe';
import {db,api,origin,fixtureSupplier,fixtureProduct,cleanupUsers,login,fixtureUser} from './helpers.mjs';
const fixturePath=process.env.TEST_WEB_BILLING_FIXTURE_PATH;
const account='acct_GymBuilderFixture';
async function clearFixtureOrders(user){const {data}=await db.from('web_promotion_orders').select('promotion_id').eq('user_id',user.id);await db.from('web_promotion_orders').delete().eq('user_id',user.id);const ids=(data || []).map(o=>o.promotion_id).filter(Boolean);if(ids.length)await db.from('promotions').delete().in('id',ids);}
async function cleanupBillingUsers(users){await db.from('web_promotion_orders').delete().in('user_id',users.map(u=>u.id));await cleanupUsers(users);}
before(async()=>{if(fixturePath){const fixture=JSON.parse(fs.readFileSync(fixturePath));await clearFixtureOrders(fixture.user);}});
async function reserve(user,product,type='super_pret',live=false,key=randomUUID()){
 return db.rpc('reserve_web_promotion',{p_user:user.id,p_product:product.id,p_type:type,p_key:key,p_account:account,p_live:live});
}
async function fulfill(order,session='cs_fixture',extra={}){
 return db.rpc('fulfill_web_promotion',{p_order:order.id,p_session:session,p_payment:'pi_'+order.id,p_amount:order.amount_cents,p_currency:'eur',p_account:account,p_live:order.livemode,...extra});
}
async function signedEvent(type,object){
 const payload=JSON.stringify({id:'evt_'+randomUUID(),object:'event',type,livemode:false,data:{object}});
 const signature=Stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_gymbuilder_fixture'});
 return fetch(origin+'/api/promotions/payments/webhook',{method:'POST',headers:{'content-type':'application/json','stripe-signature':signature},body:payload});
}
test('web reservations enforce ownership, verified approval, exact tariffs, exclusivity and replay binding',async t=>{
 const a=await fixtureSupplier(),b=await fixtureSupplier();t.after(()=>cleanupBillingUsers([a,b]));const product=await fixtureProduct(a.supplierId);
 assert.ok((await reserve(b,product)).error);
 const key=randomUUID(),order=await reserve(a,product,'super_pret',true,key);assert.ifError(order.error);assert.equal(order.data.amount_cents,1200);
 const replay=await reserve(a,product,'super_pret',true,key);assert.equal(replay.data.id,order.data.id);
 assert.ok((await reserve(a,product,'oferta_zilei',true,key)).error);
 assert.ok((await reserve(b,await fixtureProduct(b.supplierId))).error);
 const {data:promo}=await db.from('promotions').select('*').eq('id',order.data.promotion_id).single();assert.equal(promo.status,'pending');
 assert.equal((await db.from('public_promotions').select('id').eq('id',promo.id)).data.length,0);
});
test('confirmed payments activate once for the complete period, cannot be forged, and full refunds revoke the placement',async t=>{
 const user=await fixtureSupplier();t.after(()=>cleanupBillingUsers([user]));const product=await fixtureProduct(user.supplierId);
 for(const [type,fee,hours] of [['super_pret',1200,12],['oferta_zilei',2000,24],['anunturile_zilei',1000,168]]){
  const {data:o,error}=await reserve(user,product,type,true);assert.ifError(error);assert.equal(o.amount_cents,fee);
  assert.ifError((await db.rpc('attach_web_checkout',{p_order:o.id,p_session:'cs_'+o.id})).error);
  assert.ok((await fulfill(o,'cs_'+o.id,{p_amount:1})).error);assert.ok((await fulfill(o,'cs_wrong')).error);
  assert.ifError((await fulfill(o,'cs_'+o.id)).error);
  const first=(await db.from('promotions').select('*').eq('id',o.promotion_id).single()).data;assert.equal(first.status,'active');assert.equal((Date.parse(first.ends_at)-Date.parse(first.starts_at))/3600000,hours);
  assert.ifError((await fulfill(o,'cs_'+o.id)).error);assert.deepEqual((await db.from('promotions').select('*').eq('id',o.promotion_id).single()).data,first);
  assert.equal((await db.from('public_promotions').select('id').eq('id',o.promotion_id)).data.length,1);
  assert.ifError((await db.rpc('refund_web_promotion',{p_payment:'pi_'+o.id,p_amount:fee,p_currency:'eur',p_account:account,p_live:true})).error);
  assert.equal((await db.from('public_promotions').select('id').eq('id',o.promotion_id)).data.length,0);
 }
});
test('test payments stay private; unavailable paid products remain traceable for review; refund-first cannot activate',async t=>{
 const user=await fixtureSupplier();t.after(()=>cleanupBillingUsers([user]));const product=await fixtureProduct(user.supplierId);
 const {data:o}=await reserve(user,product,'anunturile_zilei');await db.rpc('attach_web_checkout',{p_order:o.id,p_session:'cs_fixture'});assert.ifError((await fulfill(o)).error);
 assert.equal((await db.from('public_promotions').select('id').eq('id',o.promotion_id)).data.length,0);
 const {data:next}=await reserve(user,product,'anunturile_zilei',false);await db.rpc('attach_web_checkout',{p_order:next.id,p_session:'cs_second'});
 await db.from('products').update({status:'inactive'}).eq('id',product.id);
 const review=await fulfill(next,'cs_second');assert.ifError(review.error);assert.equal(review.data.state,'needs_review');assert.ok(review.data.paid_at);
 await db.from('products').update({status:'active'}).eq('id',product.id);
 const {data:refund}=await reserve(user,product,'anunturile_zilei');await db.rpc('attach_web_checkout',{p_order:refund.id,p_session:'cs_refund'});
 const result=await fulfill(refund,'cs_refund',{p_refunded:true});assert.ifError(result.error);assert.equal(result.data.state,'refunded');
});
test('web checkout and signed receipt webhook complete the real local API/SQL path with a simulated processor', {skip:!fixturePath},async t=>{
 const f=JSON.parse(fs.readFileSync(fixturePath));await clearFixtureOrders(f.user);t.after(()=>clearFixtureOrders(f.user));const cookie=await login(f.user);
 let response=await api('/api/promotions/checkout',{cookie});assert.equal(response.status,200);assert.equal((await response.json()).enabled,true);
 assert.equal((await api('/api/promotions/checkout',{body:{productId:f.product.id,type:'super_pret',requestKey:randomUUID()}})).status,401);
 const body={productId:f.product.id,type:'super_pret',requestKey:randomUUID()};
 response=await api('/api/promotions/checkout',{cookie,body});assert.equal(response.status,200,await response.clone().text());const result=await response.json();assert.ok(result.url.startsWith('https://checkout.stripe.com/'));
 const again=await api('/api/promotions/checkout',{cookie,body});assert.equal((await again.json()).orderId,result.orderId);
 const order=(await db.from('web_promotion_orders').select('*').eq('id',result.orderId).single()).data;assert.equal(order.state,'checkout');
 const bad=await fetch(origin+'/api/promotions/payments/webhook',{method:'POST',body:'{}'});assert.equal(bad.status,400);
 response=await signedEvent('checkout.session.completed',{id:order.checkout_session});assert.equal(response.status,200);assert.equal((await db.from('web_promotion_orders').select('state').eq('id',order.id).single()).data.state,'checkout');
 await fetch('http://127.0.0.1:3115/_test/settle',{method:'POST',body:JSON.stringify({id:order.checkout_session})});
 response=await signedEvent('checkout.session.completed',{id:order.checkout_session});assert.equal(response.status,200,await response.clone().text());
 let status=await api('/api/promotions/payments/status?id='+order.id,{cookie});assert.equal((await status.json()).order.state,'active');
 const before=(await db.from('promotions').select('starts_at,ends_at').eq('id',order.promotion_id).single()).data;
 await signedEvent('checkout.session.completed',{id:order.checkout_session});assert.deepEqual((await db.from('promotions').select('starts_at,ends_at').eq('id',order.promotion_id).single()).data,before);
 const otherCookie=await login(f.other);assert.equal((await api('/api/promotions/payments/status?id='+order.id,{cookie:otherCookie})).status,404);
 const charge={id:'ch_fixture',object:'charge',refunded:true,payment_intent:order.payment_intent || (await db.from('web_promotion_orders').select('payment_intent').eq('id',order.id).single()).data.payment_intent,amount_refunded:1200,currency:'eur'};
 assert.equal((await signedEvent('charge.refunded',charge)).status,200);
 status=await api('/api/promotions/payments/status?id='+order.id,{cookie});assert.equal((await status.json()).order.state,'refunded');
});
test('anonymous database roles cannot read orders or call grant/reservation functions',async t=>{
 const {createClient}=await import('@supabase/supabase-js');const anon=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 const user=await fixtureSupplier();t.after(()=>cleanupBillingUsers([user]));const product=await fixtureProduct(user.supplierId);
 assert.equal((await anon.from('web_promotion_orders').select('*')).error.code,'42501');
 const denied=await anon.rpc('reserve_web_promotion',{p_user:user.id,p_product:product.id,p_type:'super_pret',p_key:randomUUID(),p_account:account,p_live:true});assert.equal(denied.error.code,'42501');
});
test('a late paid exclusive order never displaces another reservation and stays traceable for review',async t=>{
 const a=await fixtureSupplier(),b=await fixtureSupplier();t.after(()=>cleanupBillingUsers([a,b]));const product=await fixtureProduct(a.supplierId),other=await fixtureProduct(b.supplierId);
 const {data:o}=await reserve(a,product,'super_pret',true);await db.rpc('attach_web_checkout',{p_order:o.id,p_session:'cs_late'});await db.rpc('expire_web_checkout',{p_session:'cs_late'});
 const {data:next,error}=await reserve(b,other,'super_pret',true);assert.ifError(error);
 const paid=await fulfill(o,'cs_late');assert.ifError(paid.error);assert.equal(paid.data.state,'needs_review');assert.equal(paid.data.review_reason,'PLACEMENT_UNAVAILABLE');assert.ok(paid.data.paid_at);
 assert.equal((await db.from('promotions').select('status').eq('id',next.promotion_id).single()).data.status,'pending');
});
test('cancel, fake success, cross-origin requests and refund-before-completion are safe through the local API', {skip:!fixturePath},async t=>{
 const f=JSON.parse(fs.readFileSync(fixturePath));await clearFixtureOrders(f.user);t.after(()=>clearFixtureOrders(f.user));const cookie=await login(f.user);
 let response=await fetch(origin+'/api/promotions/checkout',{method:'POST',headers:{'content-type':'application/json',cookie,origin:'https://foreign.example.test'},body:'{}'});assert.equal(response.status,403);
 response=await api('/api/promotions/checkout',{cookie,body:{productId:f.product.id,type:'anunturile_zilei',requestKey:randomUUID(),amount:1}});assert.equal(response.status,400);
 const body={productId:f.product.id,type:'anunturile_zilei',requestKey:randomUUID()};
 const parallel=await Promise.all([api('/api/promotions/checkout',{cookie,body}),api('/api/promotions/checkout',{cookie,body})]);
 assert.ok(parallel.every(r=>r.status===200));const orders=await Promise.all(parallel.map(r=>r.json()));assert.equal(orders[0].orderId,orders[1].orderId);
 let o=(await db.from('web_promotion_orders').select('*').eq('id',orders[0].orderId).single()).data;
 const fake=await api('/api/promotions/payments/status?id='+o.id+'&success=true',{cookie});assert.equal((await fake.json()).order.state,'checkout');
 assert.equal((await signedEvent('checkout.session.expired',{id:o.checkout_session})).status,200);
 o=(await db.from('web_promotion_orders').select('*').eq('id',o.id).single()).data;assert.equal(o.state,'expired');assert.equal(o.paid_at,null);
 response=await api('/api/promotions/checkout',{cookie,body:{...body,requestKey:randomUUID()}});assert.equal(response.status,200);const next=await response.json();
 o=(await db.from('web_promotion_orders').select('*').eq('id',next.orderId).single()).data;
 await fetch('http://127.0.0.1:3115/_test/settle',{method:'POST',body:JSON.stringify({id:o.checkout_session,refunded:true})});
 assert.equal((await signedEvent('checkout.session.completed',{id:o.checkout_session})).status,200);
 assert.equal((await db.from('web_promotion_orders').select('state').eq('id',o.id).single()).data.state,'refunded');
 assert.equal((await db.from('promotions').select('status').eq('id',o.promotion_id).single()).data.status,'expired');
});
test('paid callbacks stay traceable if the supplier account disappears before fulfilment',async t=>{
 const user=await fixtureSupplier(),product=await fixtureProduct(user.supplierId);const {data:o}=await reserve(user,product,'anunturile_zilei',true);
 t.after(()=>db.from('web_promotion_orders').delete().eq('id',o.id));
 await db.rpc('attach_web_checkout',{p_order:o.id,p_session:'cs_deleted_supplier'});await cleanupUsers([user]);
 const row=(await db.from('web_promotion_orders').select('*').eq('id',o.id).single()).data;assert.equal(row.user_id,null);assert.equal(row.promotion_id,null);
 const result=await fulfill(row,'cs_deleted_supplier');assert.ifError(result.error);assert.equal(result.data.state,'needs_review');assert.ok(result.data.paid_at);
});
test('removing a paid promotion records a review state instead of losing or falsely confirming it',async t=>{
 const user=await fixtureSupplier();t.after(()=>cleanupBillingUsers([user]));const product=await fixtureProduct(user.supplierId);const {data:o}=await reserve(user,product,'anunturile_zilei',true);
 await db.rpc('attach_web_checkout',{p_order:o.id,p_session:'cs_removed'});assert.ifError((await fulfill(o,'cs_removed')).error);
 assert.ifError((await db.from('promotions').delete().eq('id',o.promotion_id)).error);
 const row=(await db.from('web_promotion_orders').select('*').eq('id',o.id).single()).data;assert.equal(row.state,'needs_review');assert.equal(row.review_reason,'PROMOTION_REMOVED');assert.equal(row.promotion_id,null);assert.ok(row.paid_at);
});
test('only administrators can inspect paid activation exceptions',async t=>{
 const user=await fixtureSupplier(),admin=await fixtureUser('admin');t.after(()=>cleanupBillingUsers([user,admin]));const product=await fixtureProduct(user.supplierId);
 const {data:o}=await reserve(user,product,'anunturile_zilei',true);await db.rpc('attach_web_checkout',{p_order:o.id,p_session:'cs_review_queue'});await db.from('products').update({status:'inactive'}).eq('id',product.id);assert.ifError((await fulfill(o,'cs_review_queue')).error);
 assert.equal((await api('/api/admin/promotion-payments')).status,403);
 assert.equal((await api('/api/admin/promotion-payments',{cookie:await login(user)})).status,403);
 const response=await api('/api/admin/promotion-payments',{cookie:await login(admin)});assert.equal(response.status,200);const {orders}=await response.json();assert.ok(orders.some(row=>row.id===o.id && row.review_reason==='PRODUCT_UNAVAILABLE'));
});
test('fulfilment rejects incomplete verified receipt fields without activating a promotion',async t=>{
 const user=await fixtureSupplier();t.after(()=>cleanupBillingUsers([user]));const product=await fixtureProduct(user.supplierId);const {data:o}=await reserve(user,product,'anunturile_zilei',true);await db.rpc('attach_web_checkout',{p_order:o.id,p_session:'cs_incomplete'});
 for(const field of ['p_amount','p_currency','p_account','p_live','p_payment','p_session']){
  const result=await fulfill(o,'cs_incomplete',{[field]:null});assert.ok(result.error,field+' must be present');
  assert.equal((await db.from('promotions').select('status').eq('id',o.promotion_id).single()).data.status,'pending');
 }
});
test('an unbound checkout cannot be paid and elapsed unpaid holds release exclusive availability',async t=>{
 const user=await fixtureSupplier();t.after(()=>cleanupBillingUsers([user]));const product=await fixtureProduct(user.supplierId);const {data:o}=await reserve(user,product,'super_pret',true);
 assert.ok((await db.rpc('attach_web_checkout',{p_order:o.id,p_session:null})).error);
 assert.ok((await fulfill(o,null)).error);assert.equal((await db.from('promotions').select('status').eq('id',o.promotion_id).single()).data.status,'pending');
 assert.ifError((await db.from('web_promotion_orders').update({expires_at:new Date(Date.now()-1000).toISOString()}).eq('id',o.id)).error);
 assert.equal((await api('/api/promotions')).status,200);
 assert.equal((await db.from('web_promotion_orders').select('state').eq('id',o.id).single()).data.state,'expired');assert.equal((await db.from('promotions').select('status').eq('id',o.promotion_id).single()).data.status,'expired');
 assert.ifError((await reserve(user,product,'super_pret',true)).error);
});
