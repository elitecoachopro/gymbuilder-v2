'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import {useClientLocale} from '@/i18n/client';
import {WEB_PROMOTIONS,type WebPromotionType} from '@/lib/web-billing/catalog';
type Product={id:string;name:string;status:string};
type OpenOrder={id:string;request_key:string;type:WebPromotionType;promotion:{product_id:string}};
type Order={id:string;state:string;type:WebPromotionType;livemode:boolean;promotion:{ends_at:string;status:string}|null};
const checkoutErrors:Record<string,[string,string]>={
 AUTH_REQUIRED:['Autentifică-te cu un cont de furnizor.','Sign in with a supplier account.'],
 CHECKOUT_DISABLED:['Plățile automate nu sunt încă disponibile. Folosește solicitarea manuală.','Automatic payments are not available yet. Use the manual request.'],
 CHECKOUT_CONFLICT:['Locul este ocupat sau există o rezervare în curs. Reîncarcă pagina pentru a relua plata existentă.','This placement is occupied or an order is already open. Reload to resume the existing checkout.'],
 PRODUCT_NOT_ELIGIBLE:['Alege un produs activ al unui furnizor aprobat.','Choose an active product belonging to an approved supplier.'],
 ORDER_NOT_PAYABLE:['Rezervarea nu mai poate fi plătită. Reîncarcă pagina.','This order cannot be paid anymore. Reload the page.'],
 CHECKOUT_NOT_OPEN:['Sesiunea de plată s-a încheiat. Verifică starea promovării.','The checkout session has ended. Check your promotion status.'],
};
const field='mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-anthracite-900 px-3 py-2 text-white';
export default function PromotionCheckout(){
 const en=useClientLocale()==='en';
 const t=useCallback((ro:string,english:string)=>en?english:ro,[en]);
 const [enabled,setEnabled]=useState(false),[test,setTest]=useState(false),[native,setNative]=useState(false);
 const [products,setProducts]=useState<Product[]>([]),[product,setProduct]=useState(''),[type,setType]=useState<WebPromotionType>('super_pret');
 const [openOrders,setOpenOrders]=useState<OpenOrder[]>([]),[recent,setRecent]=useState<Order[]>([]),[order,setOrder]=useState<Order|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const key=useRef<{signature:string;id:string}|null>(null);
 useEffect(()=>{
  if((window as Window & {ReactNativeWebView?:unknown}).ReactNativeWebView){setNative(true);return;}
  const controller=new AbortController();
  void fetch('/api/promotions/checkout',{cache:'no-store',signal:controller.signal}).then(async response=>{
   const config=await response.json();if(!response.ok)return;setRecent(config.recentOrders || []);if(!config.enabled)return;
   const res=await fetch('/api/supplier/products',{cache:'no-store',signal:controller.signal});if(!res.ok)throw Error();
   const data=await res.json();if(controller.signal.aborted)return;
   setEnabled(true);setTest(config.mode==='test');setOpenOrders(config.openOrders || []);setProducts(data.products.filter((p:Product)=>['active','featured'].includes(p.status)));
  }).catch(()=>{});
  const id=new URLSearchParams(window.location.search).get('promotion_order');
  let timer:ReturnType<typeof setTimeout>|undefined,attempts=0;
  if(id){
   const poll=async()=>{
    try{
     const response=await fetch(`/api/promotions/payments/status?id=${encodeURIComponent(id)}`,{cache:'no-store',signal:controller.signal});
     if(!response.ok)throw Error();const data=await response.json();if(controller.signal.aborted)return;
     setOrder(data.order);
     if(['reserved','checkout'].includes(data.order.state) && ++attempts<12)timer=setTimeout(poll,5000);
    }catch{if(!controller.signal.aborted)setMessage(t('Nu am putut verifica plata. Reîncarcă pagina sau contactează Gym Builder; nu repeta plata înainte de verificare.','Payment status could not be checked. Reload or contact Gym Builder; do not pay again before checking.'));}
   };void poll();
  }
  return()=>{controller.abort();if(timer)clearTimeout(timer);};
 },[t]);
 const checkout=async()=>{
  if(!product || busy)return;setBusy(true);setMessage('');
  const signature=`${product}:${type}`;
  if(key.current?.signature!==signature){
   const existing=openOrders.find(o=>o.type===type && o.promotion?.product_id===product);
   key.current={signature,id:existing?.request_key || crypto.randomUUID()};
  }
  try{
   const response=await fetch('/api/promotions/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:product,type,requestKey:key.current.id})});
   const data=await response.json();if(!response.ok)throw Error(data.error || 'CHECKOUT_UNAVAILABLE');
   const url=new URL(data.url);if(url.protocol!=='https:' || url.hostname!=='checkout.stripe.com')throw Error(t('Adresa de plată nu este validă.','The payment address is invalid.'));
   window.location.assign(url.href);
  }catch(error){const copy=error instanceof Error?checkoutErrors[error.message]:null;setMessage(copy?t(copy[0],copy[1]):t('Plata nu poate fi pregătită. Reîncearcă sau contactează Gym Builder.','Checkout could not be prepared. Retry or contact Gym Builder.'));setBusy(false);}
 };
 const offerName=(value:WebPromotionType)=>en?{super_pret:'Super price',oferta_zilei:'Daily offer',anunturile_zilei:'Weekly offers'}[value]:WEB_PROMOTIONS[value].name;
 const statusMessage=()=>{
  if(!order)return null;
  switch(order.state){
   case 'active': return order.promotion?.status==='active' && Date.parse(order.promotion.ends_at)>Date.now()
    ? t('Plata este confirmată. Promovarea este activă.','Payment confirmed. Your promotion is active.')
    : t('Promovarea plătită nu mai este activă.','Your paid promotion is no longer active.');
   case 'needs_review': return t('Plata este confirmată, dar promovarea necesită verificarea echipei. Contactează Gym Builder și menționează rezervarea de mai jos; nu plăti din nou.','Payment confirmed, but activation needs our team to review it. Contact Gym Builder with the order below; do not pay again.');
   case 'refunded': return t('Plata a fost rambursată. Promovarea nu mai este activă.','Payment refunded. The promotion is no longer active.');
   case 'expired': return t('Rezervarea a expirat. Nicio promovare nu a fost activată.','Reservation expired. No promotion was activated.');
   default: return t('Plata nu este încă confirmată. Promovarea se activează numai după confirmarea procesatorului.','Payment is not confirmed yet. Promotion starts only after the payment processor confirms.');
  }
 };
 const status=statusMessage();
 if(native)return <p className="mb-6 text-sm"><Link className="text-gold-300 underline" href="/mobile/promotions">{t('Promovări în aplicația mobilă','Promotions in the mobile app')}</Link></p>;
 if(!enabled && !order && !message && !recent.length)return null;
 return <section className="mb-6 rounded-xl border border-gold-400/30 bg-anthracite-800 p-4 space-y-4" aria-label={t('Plată online pentru promovare','Online promotion payment')}>
  <h3 className="font-semibold text-white">{t('Plătește și promovează un produs','Pay to promote a product')}</h3>
  {(test || order?.livemode===false) && <p className="text-amber-200">{t('Mod de test. Promovările test nu sunt afișate public.','Test mode. Test promotions are not publicly displayed.')}</p>}
  {status && <div role="status" className="rounded-lg border border-white/20 p-3 text-sm"><p>{status}</p><p className="mt-2 break-all">{t('Rezervare','Order')}: {order!.id}</p><a className="inline-flex min-h-11 items-center text-gold-300 underline" href={`mailto:contact@gymbuilder.app?subject=${encodeURIComponent(`Promovare ${order!.id}`)}`}>{t('Contactează Gym Builder','Contact Gym Builder')}</a></div>}
  {enabled && <><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">{t('Produsul publicat','Published product')}<select className={field} value={product} onChange={e=>setProduct(e.target.value)} disabled={busy}><option value="">{t('Alege produsul','Choose a product')}</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-sm">{t('Tipul promovării','Promotion type')}<select className={field} value={type} onChange={e=>setType(e.target.value as WebPromotionType)} disabled={busy}>{Object.entries(WEB_PROMOTIONS).map(([id,offer])=><option key={id} value={id}>{offerName(id as WebPromotionType)} · {offer.amount/100} EUR · {offer.hours} {t('ore','hours')}</option>)}</select></label></div>
   <p className="text-sm text-anthracite-300">{t('Perioada începe după plata confirmată. Locurile exclusive sunt verificate înainte de plată. Închiderea paginii sau revenirea de la plată nu confirmă încasarea.','Your period starts after confirmed payment. Exclusive availability is checked before checkout. Closing or returning from checkout does not confirm payment.')}</p>
   <p className="text-xs text-anthracite-300"><Link href="/terms" className="underline">{t('Termeni','Terms')}</Link>{' · '}<Link href="/privacy#payments" className="underline">{t('Confidențialitatea plății','Payment privacy')}</Link>{' · '}<Link href="/return-policy" className="underline">{t('Anulare și rambursare','Cancellation and refunds')}</Link></p>
   <button className="btn-primary min-h-11 disabled:opacity-40" disabled={!product || busy} onClick={checkout}>{busy?t('Se pregătește plata…','Preparing checkout…'):t(`Continuă la plată · ${WEB_PROMOTIONS[type].amount/100} €`,`Continue to checkout · €${WEB_PROMOTIONS[type].amount/100}`)}</button>
  </>}
  {recent.length>0 && <div className="border-t border-white/10 pt-3"><h4 className="font-medium">{t('Ultimele rezervări și plăți','Recent orders and payments')}</h4><ul className="mt-2 space-y-2">{recent.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-sm"><span>{offerName(item.type)} · {WEB_PROMOTIONS[item.type].amount/100} EUR{!item.livemode?' · TEST':''}</span><a className="inline-flex min-h-11 items-center text-gold-300 underline" href={`/supplier/dashboard?promotion_order=${item.id}#promotions`}>{t('Vezi starea','View status')}</a></li>)}</ul></div>}
  {message && <p role="alert" className="text-sm text-amber-200">{message}</p>}
 </section>;
}
