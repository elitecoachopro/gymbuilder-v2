# Verificarea instalării de la zero

## Rezultat

**Instalarea curată a versiunii locale curente a trecut.** Toate cele 15 migrări
s-au aplicat pe o bază nouă, fără resetarea sau ștergerea bazei existente.
Nu a fost necesară corectarea migrărilor.

Versiunea verificată include modificările locale încă necomise; rezultatul nu
atestă separat versiunea publicată în prezent pe GitHub sau baza din producție.

## Izolarea mediului

| Resursă | Proiect existent | Proiect temporar |
|---|---|---|
| Supabase project_id | `gymbuilder-v2` | `gymbuilder-fresh-d87b1f75` |
| API Supabase | 54321 | 55321 |
| PostgreSQL | 54322 | 55322 |
| Port shadow | 54320 | 55320 |
| Aplicație | 3000 | 3100 |
| Director | Checkout curent | `/tmp/gymbuilder-fresh-obVRiJ` |

Copia temporară a fost creată fără `.git`, `node_modules`, `.next`, `.env.local`
sau starea Supabase existentă. A primit propriul `config.toml`, cu project_id și
porturi distincte. Configurația de mediu a fost generată prin setup pentru baza
nouă, cu permisiuni `0600`. Nu au fost moștenite variabile care să suprascrie
ținta nouă. Nu au fost configurate servicii reale de e-mail sau plăți.

## Ce s-a executat

1. `npm ci --include=dev` în copia fără dependențe: trecut; auditul instalării
   raportează zero vulnerabilități cunoscute.
2. `supabase start` pentru proiectul nou: inițializare din volume noi și aplicarea
   reală, în ordine, a tuturor celor **15 migrări**. Nu s-a folosit `migration
   repair`, un baseline declarat artificial sau `db reset`.
3. `npm run setup:local`: trecut; configurare creată pentru noul API, fără a
   modifica `.env.local` din checkoutul existent.
4. `npm run db:types`: trecut; rezultatul este identic octet cu octet cu tipurile
   generate din proiectul curent.
5. `supabase db lint --local --schema public --level warning --fail-on warning`:
   fără erori sau avertismente SQL.
6. `npm run lint`: **0 erori / 0 avertismente**; `npm run typecheck`: trecut.
7. `npm test`: **18/18** teste unitare trecute. Cele două teste noi verifică
   țintele implicite/separate și refuzul URL-urilor remote înaintea fixture-urilor.
8. `npm run build`: trecut în copia cu propria instalare de dependențe.
9. Buildul a fost pornit pe `127.0.0.1:3100`. Health: HTTP 200 și bază de date OK;
   starea generală `degraded` indică lipsa Resend, conform configurației locale.
10. `npm run test:integration`: **68/68** trecute pe baza nouă, incluzând RLS,
    autentificare, tokenuri, cereri, conversații, uploaduri private și cote,
    limitele pachetelor, catalog, agregări, import CSV și newsletter.

## Schema rezultată

- **23 tabele**, toate cu RLS activ.
- **16 branduri și 7 categorii** create prin migrarea inițială; înaintea testelor
  existau **0 utilizatori, 0 furnizori și 0 produse**.
- Bucket-uri: `uploads` și `supplier-assets` publice, `registration-verifications`
  privat; limita configurată este 5 MiB per fișier.
- View-uri: `public_catalog_products`, `public_promotions`.
- Trigger-e active: limita de produse pe pachet și limitele pentru variante și
  galeria furnizorului.
- Nicio constrângere nevalidată și niciun index invalid sau nepregătit.

Comparația cu schema existentă a fost identică pentru **8/8 categorii**:
coloane/defaulturi/nullability, constrângeri, indexuri, funcții SQL/PLpgSQL și
privilegiile lor, view-uri și opțiunile lor, trigger-e, enum-uri și granturi pe
relații. Comparația nu folosește OID-uri sau alte identificatoare interne care
pot diferi legitim între baze.

## Rerulare și repornire fără pierdere de date

Doar în baza temporară a fost creat un utilizator fictiv și încărcat un PNG
fictiv. Amprentele ambelor au fost înregistrate înaintea pașilor următori.

- Rerulare `npm run setup:local`: **0 migrări noi**, utilizator și conținutul
  fișierului neschimbate.
- Oprire cu `supabase stop --project-id gymbuilder-fresh-d87b1f75`, cu backup
  activ și fără `--no-backup`.
- Repornire cu `supabase start --workdir /tmp/gymbuilder-fresh-obVRiJ`: pornire
  din backup; utilizatorul și conținutul fișierului au aceleași amprente.

La final au fost oprite numai aplicația 3100 și proiectul Supabase temporar.
Volumele/backupul de test au fost păstrate. Proiectul existent nu a fost oprit.

## Protejarea bazei existente

Înainte de verificare și după ea s-au comparat, prin interogări doar de citire:

- numărul de rânduri și amprenta conținutului fiecărei tabele `public`;
- aceleași valori pentru `storage.buckets`, `storage.objects` și istoricul
  migrărilor;
- amprenta fișierului `.env.local` existent și montările volumelor PostgreSQL.

**26/26 relații identice**: numărători și amprente neschimbate. Fișierul de mediu
și montările bazei existente sunt identice. Nu s-au exportat în raport chei,
parole sau conținutul rândurilor. Amprentele metadatelor storage nu reprezintă
un audit separat al octeților fiecărui fișier vechi; asupra volumului storage
existent nu s-au executat operații de modificare.

[Dovezi structurate: schemă, comparație și păstrarea datelor](fresh-install-evidence.json).

## Modificări în proiect

Migrațiile și codul aplicației au rămas neschimbate în această etapă. Pentru
portabilitatea verificărilor, testele acceptă acum:

- `TEST_APP_URL`: URL local alternativ; implicit `http://127.0.0.1:3000`;
- `TEST_DB_CONTAINER`: containerul PostgreSQL pentru verificarea RLS; implicit
  `supabase_db_gymbuilder-v2`.

Validarea bazei locale și interdicția credențialelor reale pentru e-mail/plăți
au fost păstrate. URL-ul aplicației este verificat și el ca local.

## Reproducere

Într-o **copie separată** a surselor curente, configurați mai întâi un project_id
unic și porturi neocupate în `supabase/config.toml`. Nu copiați `.env.local` sau
starea `.temp` din proiectul existent. Rulați:

```sh
npm ci --include=dev
npm run setup:local
npm run db:types
```

În `.env.local` din acea copie, folosiți URL-ul aplicației și țintele de test
corespunzătoare porturilor/proiectului nou. Setupul documentat folosește implicit
portul aplicației 3000, deci în copia de test `NEXT_PUBLIC_APP_URL` a fost ajustat
la `http://127.0.0.1:3100`. Pentru configurația verificată:

```dotenv
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100
TEST_APP_URL=http://127.0.0.1:3100
TEST_DB_CONTAINER=supabase_db_gymbuilder-fresh-d87b1f75
TRUSTED_PROXY_IP_HEADER=x-forwarded-for
```

După configurarea mediului, rulați verificările și porniți aplicația:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

Într-un al doilea terminal din aceeași copie:

```sh
npm run test:integration
```

Niciun serviciu cloud și nicio migrare de producție nu au fost accesate. Livrarea
reală de e-mail și plățile rămân în afara acestei verificări.
