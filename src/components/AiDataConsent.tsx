'use client';
import Link from 'next/link';
import { useClientLocale } from '@/i18n/client';
export default function AiDataConsent({checked,onChange}:{checked:boolean;onChange:(value:boolean)=>void}) {
 const en=useClientLocale()==='en';
 return <div className="rounded-xl border border-anthracite-600 bg-anthracite-900 p-3 text-sm space-y-2">
 <p className="text-anthracite-200">{en?'When generating, your description, dimensions, budget, selected zones and current floor geometry/equipment are sent to OpenAI to prepare the proposal. Do not include personal, confidential or health information.':'La generare, descrierea, dimensiunile, bugetul, zonele selectate și geometria/dotările planului curent sunt trimise către OpenAI pentru pregătirea propunerii. Nu introduce date personale, confidențiale sau medicale.'}</p>
 <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-gold-400" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{en?'I agree to send this project information to OpenAI when I generate a proposal.':'Sunt de acord cu trimiterea acestor informații despre proiect către OpenAI când generez o propunere.'}</span></label>
 <p className="text-anthracite-300">{en?'Optional: you can use manual editing without AI.':'Opțional: poți folosi editarea manuală fără AI.'} <Link className="text-gold-400 underline" href="/privacy#ai">{en?'Privacy details':'Detalii despre confidențialitate'}</Link></p></div>;
}
