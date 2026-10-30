'use client';
import Link from 'next/link';
import {useClientLocale} from '@/i18n/client';
export default function ReportContentLink({kind,id}:{kind:'products'|'suppliers';id:string}){const en=useClientLocale()==='en';return <div className="mx-auto max-w-7xl px-4 py-4"><Link href={`/report?kind=${kind}&id=${encodeURIComponent(id)}`} className="inline-flex min-h-11 items-center text-sm text-anthracite-200 underline decoration-anthracite-500 underline-offset-4 hover:text-gold-400">{en?'Report this listing or supplier':'Raportează acest anunț sau furnizor'}</Link></div>;}
