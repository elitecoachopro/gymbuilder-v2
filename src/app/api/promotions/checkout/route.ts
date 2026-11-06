import { NextRequest,NextResponse } from 'next/server';
import {z} from 'zod';
import {getSessionUser} from '@/lib/session-server';
import {checkRateLimit,rateLimitResponse} from '@/lib/rate-limit';
import {webBillingConfig} from '@/lib/web-billing/config';
import {WEB_PROMOTIONS,type WebPromotionType} from '@/lib/web-billing/catalog';
import {stripeClient,verifiedStripeAccount,webBillingDb} from '@/lib/web-billing/server';
const schema=z.object({productId:z.string().uuid(),type:z.enum(['super_pret','oferta_zilei','anunturile_zilei']),requestKey:z.string().uuid()}).strict();
export async function GET(){
 const user=await getSessionUser(),config=webBillingConfig();
 const enabled=config.enabled && user?.role==='supplier' && (config.live || config.testUsers.includes(user.id));
 const db=config.configured && user?.role==='supplier'?webBillingDb():null;
 const [result,history]=await Promise.all([
  enabled ? db!.from('web_promotion_orders').select('id,request_key,type,expires_at,promotion:promotions(product_id)').eq('user_id',user!.id).in('state',['reserved','checkout']).gt('expires_at',new Date().toISOString()) : null,
  db ? db.from('web_promotion_orders').select('id,state,type,amount_cents,livemode,paid_at,promotion:promotions(starts_at,ends_at,status)').eq('user_id',user!.id).order('created_at',{ascending:false}).limit(5) : null,
 ]);
 if(result?.error || history?.error)return NextResponse.json({enabled:false,error:'CHECKOUT_UNAVAILABLE'},{status:503});
 return NextResponse.json({enabled:Boolean(enabled),mode:config.live?'live':'test',offers:WEB_PROMOTIONS,openOrders:result?.data || [],recentOrders:history?.data || []},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin && origin!==request.nextUrl.origin)return NextResponse.json({error:'ORIGIN_FORBIDDEN'},{status:403});
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return NextResponse.json({error:'JSON_REQUIRED'},{status:415});
 const user=await getSessionUser();
 if(!user || user.role!=='supplier') return NextResponse.json({error:'AUTH_REQUIRED'},{status:401});
 const config=webBillingConfig();
 if(!config.enabled || (!config.live && !config.testUsers.includes(user.id))) return NextResponse.json({error:'CHECKOUT_DISABLED'},{status:503});
 const limit=await checkRateLimit(`web-checkout:${user.id}`,{maxRequests:10,windowMs:60000});if(!limit.allowed)return rateLimitResponse(limit.resetTime);
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'INVALID_REQUEST'},{status:400});
 const db=webBillingDb(),stripe=stripeClient();
 try{
  await verifiedStripeAccount(stripe);
  const {productId,type,requestKey}=parsed.data;
  const {data:order,error}=await db.rpc('reserve_web_promotion',{p_user:user.id,p_product:productId,p_type:type,p_key:requestKey,p_account:config.account,p_live:config.live});
  if(error){
   const conflict=['PLACEMENT_BUSY','ORDER_ALREADY_OPEN','ORDER_MISMATCH'].some(code=>error.message.includes(code));
   return NextResponse.json({error:conflict?'CHECKOUT_CONFLICT':'PRODUCT_NOT_ELIGIBLE'},{status:conflict?409:403});
  }
  if(order.state!=='reserved' && order.state!=='checkout') return NextResponse.json({error:'ORDER_NOT_PAYABLE'},{status:409});
  const appUrl=process.env.NEXT_PUBLIC_APP_URL || 'https://www.gymbuilder.app';
  const offer=WEB_PROMOTIONS[order.type as WebPromotionType];
  const session=order.checkout_session ? await stripe.checkout.sessions.retrieve(order.checkout_session) : await stripe.checkout.sessions.create({
   mode:'payment',allowed_payment_method_types:['card'],adaptive_pricing:{enabled:false},automatic_tax:{enabled:false},allow_promotion_codes:false,line_items:[{price_data:{currency:'eur',unit_amount:order.amount_cents,product_data:{name:`Gym Builder · ${offer.name} · ${offer.hours} ore`}},quantity:1}],
   metadata:{order_id:order.id,purpose:'gymbuilder_promotion'},client_reference_id:order.id,
   expires_at:Math.floor(Date.parse(order.expires_at)/1000),
   success_url:`${appUrl}/supplier/dashboard?promotion_order=${order.id}#promotions`,cancel_url:`${appUrl}/supplier/dashboard?promotion_order=${order.id}&payment_cancelled=1#promotions`,
  },{idempotencyKey:`gymbuilder-web-promotion-${order.id}`});
  if(session.status!=='open' || !session.url) return NextResponse.json({error:'CHECKOUT_NOT_OPEN'},{status:409});
  const {error:attachError}=await db.rpc('attach_web_checkout',{p_order:order.id,p_session:session.id});if(attachError)throw Error('ATTACH_FAILED');
  return NextResponse.json({url:session.url,orderId:order.id},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return NextResponse.json({error:'CHECKOUT_UNAVAILABLE'},{status:502});
 }
}
