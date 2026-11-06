import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WEB_PROMOTIONS} from '../../src/lib/web-billing/catalog.ts';
import {webBillingConfig} from '../../src/lib/web-billing/config.ts';
const base={WEB_PROMOTION_PAYMENTS_ENABLED:'true',WEB_PROMOTION_PAYMENTS_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fixture',GYM_BUILDER_STRIPE_ACCOUNT_ID:'acct_GymBuilderFixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',WEB_PROMOTION_TEST_USERS:'fixture-user'};
test('web billing fails closed without a dedicated account, correct mode and allowlisted testers',()=>{
 assert.equal(webBillingConfig({}).enabled,false);assert.equal(webBillingConfig(base).enabled,true);
 for(const key of Object.keys(base))assert.equal(webBillingConfig({...base,[key]:''}).enabled,false,key);
 assert.equal(webBillingConfig({...base,STRIPE_SECRET_KEY:'sk_live_fixture'}).enabled,false);
 assert.equal(webBillingConfig({...base,WEB_PROMOTION_PAYMENTS_MODE:'live'}).enabled,false);
 assert.equal(webBillingConfig({...base,WEB_PROMOTION_PAYMENTS_MODE:'live',STRIPE_SECRET_KEY:'sk_live_fixture',WEB_PROMOTION_TEST_USERS:''}).enabled,true);
 const stopped=webBillingConfig({...base,WEB_PROMOTION_PAYMENTS_ENABLED:'false'});assert.equal(stopped.enabled,false);assert.equal(stopped.configured,true);
});
test('promotion fees and complete durations are authoritative and distinct from equipment prices',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(WEB_PROMOTIONS).map(([k,v])=>[k,[v.amount,v.hours]])),{super_pret:[1200,12],oferta_zilei:[2000,24],anunturile_zilei:[1000,168]});
});
test('verified receipt parsing rejects missing money, identity, environment and refund fields',async()=>{
 const {paymentReceiptSchema}=await import('../../src/lib/web-billing/receipt.ts');
 const receipt={orderId:'11111111-1111-4111-8111-111111111111',sessionId:'cs_test_fixture',intentId:'pi_fixture',amount:1200,currency:'eur',live:false,refunded:false};
 assert.deepEqual(paymentReceiptSchema.parse(receipt),receipt);
 for(const field of Object.keys(receipt))assert.equal(paymentReceiptSchema.safeParse({...receipt,[field]:null}).success,false,field);
 for(const patch of [{amount:0},{amount:12.5},{currency:'usd'},{sessionId:'other'},{intentId:'other'}])assert.equal(paymentReceiptSchema.safeParse({...receipt,...patch}).success,false);
});
