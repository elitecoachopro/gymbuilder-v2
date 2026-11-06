import {NextRequest,NextResponse} from 'next/server';
import {webBillingConfig} from '@/lib/web-billing/config';
import {stripeClient,fulfillStripeCheckout,webBillingDb} from '@/lib/web-billing/server';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const config=webBillingConfig();if(!config.configured)return NextResponse.json({error:'Not configured'},{status:503});
 if(Number(request.headers.get('content-length'))>512000)return new NextResponse(null,{status:413});
 const raw=await request.text();if(raw.length>512000)return new NextResponse(null,{status:413});
 const stripe=stripeClient();let event;
 try{event=stripe.webhooks.constructEvent(raw,request.headers.get('stripe-signature') || '',process.env.STRIPE_WEBHOOK_SECRET!);}catch{return NextResponse.json({error:'Invalid signature'},{status:400});}
 if(event.livemode!==config.live || event.account)return NextResponse.json({error:'Wrong account or environment'},{status:400});
 try{
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) await fulfillStripeCheckout(stripe,(event.data.object as {id:string}).id);
  else if(event.type==='checkout.session.expired' || event.type==='checkout.session.async_payment_failed'){
   const {error}=await webBillingDb().rpc('expire_web_checkout',{p_session:event.data.object.id});if(error)throw error;
  }else if(event.type==='charge.refunded'){
   const charge=event.data.object;
   if(charge.refunded && typeof charge.payment_intent==='string'){
    const {error}=await webBillingDb().rpc('refund_web_promotion',{p_payment:charge.payment_intent,p_amount:charge.amount_refunded,p_currency:charge.currency,p_account:config.account,p_live:config.live});if(error)throw error;
   }
  }
  return NextResponse.json({received:true});
 }catch{return NextResponse.json({error:'Processing failed; retry required'},{status:500});}
}
