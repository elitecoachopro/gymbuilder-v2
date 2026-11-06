import {webBillingConfig} from '@/lib/web-billing/config';
import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/session-server';
import {webBillingDb} from '@/lib/web-billing/server';
export async function GET(){
 const user=await getSessionUser();if(user?.role!=='admin')return NextResponse.json({error:'ADMIN_REQUIRED'},{status:403});
 if(!webBillingConfig().configured)return NextResponse.json({orders:[]},{headers:{'Cache-Control':'no-store'}});
 const {data,error}=await webBillingDb().from('web_promotion_orders').select('id,type,amount_cents,currency,stripe_account,livemode,payment_intent,paid_at,review_reason').eq('state','needs_review').order('paid_at',{ascending:true}).limit(50);
 if(error)return NextResponse.json({error:'PAYMENT_QUEUE_UNAVAILABLE'},{status:503});
 return NextResponse.json({orders:data},{headers:{'Cache-Control':'no-store'}});
}
