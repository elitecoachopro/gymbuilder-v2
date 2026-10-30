# GymBuilder v2

Platformă Next.js pentru catalog de echipamente, furnizori și proiectarea sălilor.

## Pornire locală

Necesită Node.js >=22.18 cu npm, Docker pornit (Docker Desktop sau Colima) și Supabase CLI.

```sh
npm ci --include=dev
npm run setup:local
npm run dev
```

Aplicația: http://localhost:3000. Supabase API: http://127.0.0.1:54321.
Prima pornire descarcă imaginile Docker și inițializează baza de date. Configurarea
scrie automat cheile Supabase locale în `.env.local`, ignorat de Git, și păstrează
celelalte variabile deja existente în acel fișier. Nu folosește datele din producție.
La reluarea lucrului sunt suficiente ultimele două comenzi.

Pentru oprire: `Ctrl+C` în terminalul Next.js, apoi `npm run db:stop`.
Supabase păstrează datele locale între opriri.

## Pornire independentă de ChatGPT — macOS

După instalarea dependențelor și configurarea locală, construiește aplicația și
instalează serviciul utilizatorului:

```sh
npm run build
npm run local:install
npm run local:status
```

Serviciul `com.gymbuilder.local` este gestionat de macOS launchd: pornește la
conectarea în contul macOS și se repornește după terminarea procesului. Funcționează
independent de ChatGPT și de terminalul care l-a instalat. Ascultă exclusiv pe
`http://127.0.0.1:3000`; nu publică aplicația pe internet. Calculatorul trebuie să
fie pornit, utilizatorul conectat, iar discul cu proiectul disponibil.

La pornire, serviciul verifică Docker, pornește Colima dacă este necesar și
pornește proiectul Supabase existent. Nu rulează setup, migrări sau resetarea bazei.
Colima folosește configurația existentă; celelalte containere cu politică proprie
de repornire pot porni odată cu motorul Docker. Cheile rămân în `.env.local`, nu în
fișierul launchd. Ieșirea CLI Supabase care poate conține chei nu este jurnalizată.

Comenzi disponibile:

```sh
npm run local:status
npm run local:restart
npm run local:uninstall
```

Jurnalele sunt în `~/Library/Logs/GymBuilder/server.log` și
`~/Library/Logs/GymBuilder/server-error.log`, cu acces limitat utilizatorului.
Dezinstalarea oprește serviciul aplicației și elimină pornirea automată; păstrează
baza și configurația locală. Docker/Colima rămâne pornit pentru celelalte proiecte.
Pentru un build nou, oprește serviciul cu `local:uninstall`, rulează `npm run build`
și apoi `local:install`. Nu porni simultan `npm run dev` pe același port. Dacă muți
proiectul sau înlocuiești instalarea Node, reinstalează serviciul.

Configuratorul Studio începe în 2D. Butonul 3D activează implicit profilul
**Economic** (DPR 1, fără antialiasing sau umbre dinamice). Reflexiile folosesc
o textură locală statică de 256 × 128; umbrele de contact sunt instanțiate într-o singură trecere.
Profilul Standard este opțional. Pierderea contextului WebGL sau o eroare de
randare revine la 2D fără înlocuirea documentului; reîncercarea 3D este manuală.
Acest mecanism nu poate recupera un proces desktop sau un sistem de operare
complet blocat și nu înlocuiește salvarea proiectului în cont.

## Date și email

Configurația locală aplică migrațiile versionate din `supabase/migrations/`.
Fișierele istorice sunt arhivate în `supabase/legacy/`; prima migrare le include
ca baseline. `npm run setup:local` aplică și migrările noi pe o bază deja pornită,
fără resetare. Baza nouă pornește cu mărci și categorii, fără conturi, furnizori
sau produse.

Migrațiile aditive completează schema cerută de API-uri și creează bucket-urile
de imagini. Tabelele sunt accesibile prin API-urile aplicației, care verifică
sesiunea și drepturile; cheia publică Supabase nu oferă acces direct la date.
Schema de producție nu a fost comparată și aceste migrări nu au fost aplicate
în producție. Pentru vechea bază locală inițializată din seed, baseline-ul
`20260801000000` a fost înregistrat o singură dată cu `supabase migration repair
20260801000000 --status applied --local`, înaintea migrărilor aditive.

Emailurile aplicației folosesc Resend, inclusiv pentru confirmarea conturilor.
Pentru trimitere, adaugă un `RESEND_API_KEY` de dezvoltare în `.env.local` și
repornește Next.js. Fără cheie, emailurile nu sunt trimise; conturile noi rămân
neconfirmate. Serviciul Auth Supabase nu înlocuiește autentificarea proprie a
aplicației. Stripe nu este necesar pentru pornire.

## Verificări

```sh
npm run typecheck
npm run build
curl http://localhost:3000/api/health
```

Endpointul health verifică baza de date; fără Resend poate raporta `degraded`.

## Verificări locale

Cu Supabase și serverul Next pornite (`npm run dev`):

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
npm audit
```

Testele de integrare refuză baze de date care nu sunt pe localhost și își șterg
fixture-urile. Nu configura chei de email reale pentru acest mediu de test.
Registrul problemelor și dovezile sunt în `docs/audits/2026-10-19-audit.md`.

În producție, configurează `TRUSTED_PROXY_IP_HEADER` doar pentru un antet pe care
proxy-ul îl suprascrie cu IP-ul clientului (pe Vercel se folosește antetul dedicat).
Fără această configurare se aplică o cotă comună, iar uploadul anonim este oprit.
Cotele sunt atomice și persistate în Postgres. Pozele de verificare sunt private;
sesiunile abandonate expiră după o oră și sunt curățate la cererile următoare de upload.


După modificarea schemei, regenerează tipurile cu `npm run db:types`.
Nu rula `next dev` și `next build` simultan: folosesc același director `.next`.
Oprește serverul de dezvoltare înaintea buildului, apoi repornește-l.
Interfața suportă română și engleză; limba se păstrează în cookie.

Proiectul folosește npm și `package-lock.json` ca sursă unică pentru versiuni.

## Instalare de la zero verificată — 19 octombrie 2026

Cele 15 migrări au fost aplicate pe un proiect Supabase separat, cu volume noi,
iar schema, buildul și cele 86 de teste au trecut. Baza locală existentă a fost
comparată înainte/după și a rămas neschimbată.
[Raport și instrucțiuni pentru un mediu separat](docs/audits/fresh-install-verification.md).

Testele acceptă `TEST_APP_URL` și `TEST_DB_CONTAINER` pentru copii locale izolate.
Valorile implicite rămân aplicația 3000 și containerul `supabase_db_gymbuilder-v2`.
La o verificare separată, setați ambele valori pentru acel proiect și păstrați
Supabase URL/cheile generate de setupul acelei copii.

## Configurator 3D și cerințe AI

Deschide `/configurator`: alege varianta, introdu suprafața, lungimea și lățimea,
apoi înălțimea liberă, bugetul de dotări și zonele dorite. Generatorul standard
funcționează fără servicii externe; verifică propunerea și aplic-o în scena 3D.
Machetele pot fi mutate în 2D sau cu săgețile 3D, rotite și eliminate.
Salvarea și redeschiderea proiectelor necesită autentificare.

Asistentul AI are nevoie de `OPENAI_API_KEY` și `OPENAI_GYM_MODEL` în `.env.local`,
urmate de repornirea serverului. Modelul trebuie să fie disponibil în contul API
și să suporte Responses API cu Structured Outputs. Nu include cheia în variabile
`NEXT_PUBLIC_` și nu o trimite în chat. Fără aceste două valori, butonul AI indică
lipsa configurării; generatorul standard rămâne disponibil.

[Arhitectură, limite și verificări](docs/configurator-studio.md).

## Ghiduri pentru utilizatori

Ghidul RO/EN este disponibil în aplicație la `/cum-functioneaza`. [Manualul traseelor web](docs/user-manual.md) descrie clientul, furnizorul, administrarea și configuratorul curent.
