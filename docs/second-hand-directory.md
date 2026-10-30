# Oferte second-hand documentate

Consultate la 21 octombrie 2026. Nouă oferte, câte trei în fiecare piață, de la
comercianți cu contact public. Datele și sursele fotografiilor sunt în
`data/second-hand-suppliers.json`. Starea este declarația vânzătorului, nu o
inspecție Gym Builder. Prețurile și disponibilitatea se reconfirmă direct.

| Vânzător / piață | Produs | Preț publicat |
| --- | --- | --- |
| Gym Solutions România, Cluj-Napoca | Precor Icarian Smith | 2.650 EUR |
| Gym Solutions România | Star Trac / Nautilus Leverage presă 45° | 2.950 EUR |
| Gym Solutions România | Paramount Lateral Raise | 1.450 EUR |
| Homefitness, Singapore / Asia | BH Fitness T200 | 800 SGD |
| Homefitness | TuffStuff CPR-265 | 1.200 SGD |
| Homefitness | Spirit CS800 Stepper | 1.079 SGD |
| John Peter Fitness, Marbella / restul lumii | Technogym Skillrow | 2.695 EUR |
| John Peter Fitness | Technogym Excite Jog 500 | 2.995 EUR |
| John Peter Fitness | Technogym Run Personal, ex-display | 8.995 EUR |

Surse comercianți: https://gymsolutions-romania.com/contact,
https://www.homefitness.com.sg/contact-us,
https://johnpeterfitness.es/en/atencion-al-cliente/.
Fiecare produs are în manifest propriul URL public și imaginea din pagina sursă.
Fotografiile sunt cele publicate de vânzător; nu certifică starea unității livrate.

Paramount are protecția din plastic spate deteriorată, conform anunțului.
Run Personal este fost exemplar de expoziție, nu este prezentat ca produs nou.
Homefitness exclude transportul și instalarea din prețurile selectate. BH T200
are condiții de garanție diferite în două secțiuni; fișa cere confirmare scrisă.
Nu s-au importat ca oferte active pachetele Taygetos marcate sold, anunțuri
arhivate sau anunțuri cu preț simbolic pentru un întreg depozit. O ofertă Homefitness
cu imagine BH și titlu Life Fitness și o fișă Precor cu specificații aproximative
au fost excluse. Fișa Synchro 700/Forma cu denumire și dimensiuni neconcordante
a fost de asemenea exclusă.

## Prețuri și filtrare

Migrarea `20261021000400_published_price_currency.sql` adaugă suma și moneda
publicate. Nu se atribuie un preț EUR unei oferte SGD. Prețurile EUR sunt și în
`price_eur`, astfel încât filtrarea/sortarea existente în EUR să funcționeze.
Prețurile în alte monede nu sunt incluse într-un interval EUR și se sortează
la urmă la sortarea după preț EUR. Nu se fac conversii valutare.
Catalogul, detaliul, profilul vânzătorului, comparația, metadatele și completarea
căutării păstrează moneda originală. Navigarea între piețe păstrează filtrul
`condition=used`; contactele sunt disponibile pe fiecare produs.

## Import local

Cu Supabase local pornit și migrările aplicate:

```sh
node --env-file=.env.local scripts/import-directory.mjs second-hand
```

Importul rămâne exclusiv local, fără conturi sau mesaje către comercianți.
URL-ul produsului identifică unic oferta la reluarea importului. Nu există
monitorizare automată a stocului; data verificării este cea din manifest.

## Verificare finală

Build, TypeScript și lint trecute; 34 de teste unitare și 79 de integrare trecute.
Importul reluat nu a creat duplicate. Fiecare ofertă a fost verificată în API:
stare used, piață corectă, preț și monedă originale, contact public, specificații
și fotografie HTTP 200. Ofertele nu apar la filtrul new. În browser a fost
verificată păstrarea filtrului used între piețe și afișarea EUR/SGD.
Fotografiile principale România și Singapore sunt imaginile de produs din
pagină, în locul miniaturilor Open Graph decupate pentru rețele sociale.
