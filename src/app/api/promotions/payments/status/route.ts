import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {getSessionUser} from '@/lib/session-server';
import {checkRateLimit,rateLimitResponse} from '@/lib/rate-limit';
import {webBillingConfig} from '@/lib/web-billing/config';
import {webBillingDb} from '@/lib/web-billing/server';
export async function GET(request:NextRequest){
 const user=await getSessionUser();if(!user || user.role!=='supplier')return NextResponse.json({error:'AUTH_REQUIRED'},{status:401});
 if(!webBillingConfig().configured)return NextResponse.json({error:'CHECKOUT_DISABLED'},{status:503});
 const limit=await checkRateLimit(`web-payment-status:${user.id}`,{maxRequests:30,windowMs:60000});if(!limit.allowed)return rateLimitResponse(limit.resetTime);
 const id=z.string().uuid().safeParse(request.nextUrl.searchParams.get('id'));if(!id.success)return NextResponse.json({error:'INVALID_ORDER'},{status:400});
 const database=webBillingDb();
 const expired=await database.rpc('release_expired_web_promotions');if(expired.error)return NextResponse.json({error:'PAYMENT_STATUS_UNAVAILABLE'},{status:503});
 const {data,error}=await database.from('web_promotion_orders').select('id,state,type,amount_cents,currency,livemode,paid_at,promotion:promotions(starts_at,ends_at,status)').eq('id',id.data).eq('user_id',user.id).maybeSingle();
 if(error)return NextResponse.json({error:'PAYMENT_STATUS_UNAVAILABLE'},{status:503});
 if(!data)return NextResponse.json({error:'ORDER_NOT_FOUND'},{status:404});
 return NextResponse.json({order:data},{headers:{'Cache-Control':'no-store'}});
}
