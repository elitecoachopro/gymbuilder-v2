'use client';
import {useCallback,useEffect,useState} from 'react';
import {useClientLocale} from '@/i18n/client';
type Review={id:string;type:string;amount_cents:number;currency:string;stripe_account:string;livemode:boolean;payment_intent:string;review_reason:string};
export default function PromotionPaymentReview(){
 const en=useClientLocale()==='en';const[rows,setRows]=useState<Review[]>([]),[failed,setFailed]=useState(false),[busy,setBusy]=useState(false);
 const load=useCallback(async(signal?:AbortSignal)=>{
  setBusy(true);try{const response=await fetch('/api/admin/promotion-payments',{cache:'no-store',signal});if(!response.ok)throw Error();const data=await response.json();if(signal?.aborted)return;setRows(data.orders);setFailed(false);}catch{if(!signal?.aborted)setFailed(true);}finally{if(!signal?.aborted)setBusy(false);}
 },[]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[load]);
 if(!rows.length && !failed)return null;
 return <section className="mb-6 rounded-xl border border-amber-400/40 bg-anthracite-900 p-4 space-y-3" aria-label={en?'Promotion payments requiring review':'Plăți de promovare de verificat'}>
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-amber-200">{en?'Promotion payments requiring review':'Plăți de promovare de verificat'}</h2><button className="min-h-11 rounded-lg border border-white/20 px-3 disabled:opacity-40" onClick={()=>void load()} disabled={busy}>{en?'Refresh':'Actualizează'}</button></div>
  {failed?<p role="alert">{en?'Payment review queue could not be loaded. Retry.':'Lista plăților nu a putut fi încărcată. Încearcă din nou.'}</p>:<><p className="text-sm text-anthracite-200">{en?'These payments did not activate a placement. Check the dedicated Gym Builder Stripe account using the references below. If you issue a full refund in Stripe, its verified notification updates the order automatically.':'Aceste plăți nu au activat un loc sau promovarea a fost retrasă. Verifică în contul Stripe Gym Builder folosind referințele de mai jos. Dacă efectuezi o rambursare integrală în Stripe, notificarea verificată actualizează automat rezervarea.'}</p><ul className="space-y-3">{rows.map(row=><li className="rounded-lg border border-white/10 p-3 text-sm space-y-1 break-words" key={row.id}><p>{(row.amount_cents/100).toFixed(2)} {row.currency.toUpperCase()}{row.livemode?'':' · TEST'}</p><p>{en?'Order':'Rezervare'}: {row.id}</p><p>Stripe: {row.stripe_account} · {row.payment_intent}</p><p>{en?'Reason':'Motiv'}: {row.review_reason}</p></li>)}</ul></>}
 </section>;
}
