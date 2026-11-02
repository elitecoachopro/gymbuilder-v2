# Contoare Gym Builder — 2 noiembrie 2026

Administrator: /admin, panou cu vizualizări ale paginilor publice, sesiuni distincte, profiluri și produse. Furnizor: /supplier/dashboard#analytics, aceleași măsurători limitate strict la propriul profil și propriile produse. Perioade 7/30/90 zile UTC și tabel zilnic inclusiv zilele cu zero vizite. Reîmprospătare la deschidere, schimbarea perioadei sau apăsarea Actualizează.

O vizualizare este un cuplu pagină–sesiune într-o zi UTC. Nu este un contor al fiecărei reîncărcări sau al persoanelor distincte. Sunt măsurate numai căile publice permise, fără parametri de căutare, tokenuri sau pagini private. Colectarea necesită alegerea Acceptă toate din bannerul existent. Identificatorul aleator rămâne în sessionStorage; în tabel este stocat numai HMAC-ul lui. IP-urile nu sunt salvate în înregistrările vizitelor. Filtrul de rată folosește infrastructura existentă cu chei hash. Administratorii și furnizorii pe propriile materiale sunt excluși. Datele noi încep la activare; istoricul product_views se păstrează și se completează atomic.

## Verificare

162 teste unitare și 15 teste HTTP/Supabase locale trecute. Au fost verificate deduplicarea concurentă, raportarea pe zile UTC, limitele 7/30/90, istoricul anterior, rolurile, izolarea furnizorilor, RLS și accesul exclusiv service_role la RPC-uri. Typecheck, lint și build trecute. Testul izolat al furnizorului a eșuat înaintea corecției constatării #1 și a trecut după. Revizuirea completă ce-code-review: run 20261102-061825-356c70cc, zece perspective, o constatare de independență a testului remediată. Nu există constatări deschise.

Browser: trei pagini publice vizitate efectiv după acceptarea analizei au produs 3 vizualizări/1 sesiune pentru administrator și 2 vizualizări/1 sesiune pentru furnizor. Verificate filtrul zilnic, română/engleză, desktop și lățime simulată 390 px, fără depășire orizontală. Capturile folosesc numai conturi și produse fictive locale; nu reprezintă trafic real de producție. Nu s-a făcut probă pe telefon fizic. Restricțiile de stocare, revocarea consimțământului și cleanup-ul listenerelor au fost revizuite în cod, fără teste browser dedicate pentru fiecare combinație.

## Publicare și păstrarea lucrărilor existente

Candidatul pornește din cele 456 fișiere verificate SHA-256 ale producției dpl_7uBwCipCQgfYAvxjRVF5c5RaSM1x și adaugă numai acest modul. Cele opt corecții email deja live sunt păstrate în copia de publicare, fără a comite lucrările preexistente. Migrările mobile/SQL aflate în lucru nu sunt publicate. Schema live nu avea supabase_migrations.schema_migrations; s-a aplicat exclusiv noua migrare 20261102000100 în tranzacție, prin Management API oficial Supabase. Reluarea ei fără verificarea existenței obiectelor nu este necesară. Versiunea anterioară poate fi promovată din nou; schema aditivă poate rămâne instalată fără a afecta acea versiune.
