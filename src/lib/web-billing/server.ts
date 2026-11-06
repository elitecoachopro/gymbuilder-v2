import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { webBillingConfig } from './config.ts';
import { paymentReceiptSchema } from './receipt.ts';
export function webBillingDb() {
 return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
}
export function stripeClient() { return new Stripe(process.env.STRIPE_SECRET_KEY!,{maxNetworkRetries:2,timeout:15000,httpClient:Stripe.createFetchHttpClient()}); }
export async function verifiedStripeAccount(stripe: Stripe) {
 const config=webBillingConfig();
 const account=await stripe.accounts.retrieveCurrent();
 if(account.id!==config.account || (config.live && (!account.charges_enabled || !account.details_submitted))) throw Error('STRIPE_ACCOUNT_NOT_READY');
 return config;
}
export async function fulfillStripeCheckout(stripe: Stripe, sessionId: string) {
 const config=webBillingConfig();
 const session=await stripe.checkout.sessions.retrieve(sessionId);
 if(session.payment_status!=='paid' || session.status!=='complete') return;
 if(session.metadata?.purpose!=='gymbuilder_promotion')return;
 if(session.mode!=='payment' || session.livemode!==config.live || !session.metadata?.order_id || !session.payment_intent || typeof session.payment_intent!=='string') throw Error('PAYMENT_MISMATCH');
 const intent=await stripe.paymentIntents.retrieve(session.payment_intent,{expand:['latest_charge']});
 if(intent.status!=='succeeded' || intent.livemode!==config.live || intent.amount_received!==session.amount_total || intent.currency!==session.currency) throw Error('PAYMENT_NOT_SETTLED');
 const charge=typeof intent.latest_charge==='object' ? intent.latest_charge : null;
 if(!charge)throw Error('PAYMENT_NOT_SETTLED');
 const receipt=paymentReceiptSchema.parse({orderId:session.metadata.order_id,sessionId:session.id,intentId:intent.id,amount:session.amount_total,currency:session.currency,live:session.livemode,refunded:charge.refunded});
 const {data,error}=await webBillingDb().rpc('fulfill_web_promotion',{
  p_order:receipt.orderId,p_session:receipt.sessionId,p_payment:receipt.intentId,p_amount:receipt.amount,p_currency:receipt.currency,
  p_account:config.account,p_live:receipt.live,p_refunded:receipt.refunded,
 });
 if(error) throw Error('FULFILLMENT_FAILED');
 return data;
}
