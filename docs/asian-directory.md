# Catalog Asia: surse publice

Documentat la 21 octombrie 2026. Datele sunt în `data/asian-suppliers.json`, iar
fotografiile originale selectate sunt în `public/equipment/asia/`.

Catalogul inițial cuprinde DHZ Fitness, SHUA Fitness, Impulse Fitness și SportsArt,
cu câte cinci modele. Fiecare fișă păstrează contactul oficial, catalogul,
adresa companiei, pagina produsului, sursele imaginilor și specificațiile disponibile.
SHUA publică un formular comercial; nu i-au fost atribuite un telefon sau un email
care nu apar în sursa consultată. Pentru Impulse este folosit telefonul pentru Europa;
pentru SportsArt, sediul din Taiwan.

Listările nu implică un parteneriat, verificarea identității prin Gym Builder sau
disponibilitate în stoc. Sunt marcate ca profiluri din surse publice, fără conturi
de autentificare, fără badge de furnizor verificat și fără mesagerie internă.
Clientul folosește contactele oficiale. Prețurile nepublicate sunt `null` și apar
ca „Preț la cerere”, inclusiv în comparații și în rezultatele conexe.

## Refacerea importului local

Cu Supabase local pornit și migrările aplicate:

```sh
node --env-file=.env.local scripts/import-directory.mjs asia
```

Scriptul refuză baze nelocale, verifică existența fotografiilor și actualizează
fișele după URL-urile sursă fără să creeze duplicate sau conturi. Refuză înlocuirea
unei fișe asociate unui cont. Produsele existente sunt actualizate separat de
inserări, pentru a respecta verificarea cotei de produse la inserare.
Nu trimite emailuri sau mesaje. Nu execută modificări în producție.

Revizuirea informațiilor și a surselor se face înainte de o nouă importare.
Data documentării nu este actualizată automat la simpla reluare a scriptului.

## Verificare locală

Build, TypeScript și lint trecute. Cele 33 de teste unitare și 77 de teste de
integrare au trecut, inclusiv accesul la surse publice, prețurile necunoscute,
contactele, autentificarea și cotele existente. Importul a fost reluat fără
duplicate; toate fotografiile sunt servite de aplicația locală. În rularea de
integrare, serverul local a folosit `TRUSTED_PROXY_IP_HEADER=x-forwarded-for`
pentru IP-urile fixture-urilor, cu emailurile dezactivate.
