# Gym Service și Mentenanță

Implementare locală, fără deploy sau migrare în producție.

## Funcționalitate

- Catalog public `/gym-service`, legat din homepage, meniu și footer; căutare după firmă, marcă sau descriere, filtrare după serviciu și acoperirea declarată.
- Înregistrare `/register/service`, prin fluxul existent de furnizor: cont, firmă/prestator, poze private, confirmare email și aprobare. Activare gratuită pentru conturi exclusiv service.
- Tipuri de profil: echipamente, service, ambele. Profilurile existente rămân implicit echipamente.
- Servicii: reparații, mentenanță/revizii, montaj, relocare, retapițare/recondiționare, piese/consumabile. Acoperire și mărci declarate de prestator.
- Editare `/supplier/services` prin API strict autentificat, limitat la profilul propriu. Datele de ownership, aprobare și abonament nu pot fi schimbate prin acest formular.
- Profil public, cereri și mesaje prin traseele existente; panou adaptat pentru prestatorii exclusiv service; contoarele existente rămân disponibile.
- Adminul vede serviciile înainte de aprobare. Emailul de aprobare folosește instrucțiuni potrivite tipului de profil. Emailul de login și pozele de verificare nu apar în catalog.
- Interfață română și engleză. Fără programări, plăți sau promisiuni de certificare tehnică în acest modul.

## Baza de date

Migrare nouă: `20261105000100_gym_service_profiles.sql`. Adaugă patru câmpuri, validări și coloane publice în view-ul existent. Nu șterge date și nu schimbă rolurile conturilor. Tipurile TypeScript pentru cele două structuri afectate provin din generarea schemei temporare; diferențele independente mobile/analytics au fost excluse.

## Verificare

182 teste unitare; 119 teste de integrare trecute, două teste de AI real dezactivate; nouă teste de integrare reverificate după simplificare. Lint, typecheck și build de producție trecute.

Întregul lanț de migrări a pornit într-un proiect Supabase temporar separat. Testele au acoperit înregistrarea cu upload privat, confirmarea emailului prin token, aprobarea, filtrarea, contactarea și izolarea profilurilor.

Browser: catalog, filtre, căutare marcă, profil, deschidere cerere, autentificare cu revenire, validare formular, salvare/reîncărcare, panou service și traduceri. La390×844 s-au folosit componentele reale într-un cadru responsive separat, cu API-ul local: meniu, filtre, editare/salvare, fără scroll orizontal; ținte checkbox de48px.

Limite: nu s-au testat telefoane fizice, livrarea reală în Inbox/Spam sau trimiterea finală a formularului de înregistrare prin browser. Fluxul complet de înregistrare a fost exercitat prin API local, cu date fictive. Nu s-au folosit chei de email/plăți/AI reale. Conturile, mediul și credențialele temporare au fost eliminate la final.

## Publicare

Este necesară aplicarea migrației noi înaintea publicării codului care citește noile coloane. Acest task păstrează modificările local; celelalte modificări și commituri existente nu sunt publicate implicit.

## Revizuire

Revizuire completă pe cele 34 de fișiere sursă, în nouă perspective: fără probleme identificate. Codul final corespunde exact copiei revizuite. Nu există încă teste automate de browser pentru sesiunea expirată și eroarea la salvare; verificarea interactivă a acoperit traseele de autentificare și salvare.
