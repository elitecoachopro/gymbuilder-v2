# România și restul lumii: catalog documentat

Surse consultate la 21 octombrie 2026. În aplicația locală sunt adăugați șase
furnizori, cu câte cinci produse reprezentative (30 produse și 30 fotografii).
Catalogul complet rămâne pe site-ul fiecărui furnizor.

| Piață | Furnizor | Contact oficial |
| --- | --- | --- |
| România | Fitlife / BNT Sistem SRL, Cluj-Napoca | https://fitlife.ro/contact/ |
| România | inSPORTline / Total Sport Equipment SRL, Deva | https://www.insportline.ro/contact |
| România | Sportist / Online Sport Shop SRL, București | https://www.sportist.ro/contacts/ |
| Restul lumii | Rogue Fitness, Columbus, SUA | https://www.roguefitness.com/contact-us |
| Restul lumii | BH Fitness / Exercycle SL, Vitoria-Gasteiz, Spania | https://bh.fitness/en/contact/ |
| Restul lumii | Concept2, Morrisville, SUA | https://www.concept2.com/contact |

Datele sunt în `data/romanian-suppliers.json` și
`data/international-suppliers.json`; fotografiile originale selectate sunt în
`public/equipment/romania/` și `public/equipment/rest-of-world/`. Fiecare produs
păstrează pagina și URL-ul imaginii oficiale. Sursele suplimentare pentru adrese
și contacte comerciale sunt consemnate în manifest. Emailul Rogue este publicat
în instrucțiunile oficiale ale băncii; emailul comercial BH în pagina oficială Help.

Piața este determinată de țara furnizorului. Distribuitorii români comercializează
mărci internaționale: țara distribuitorului nu este atribuită mărcii. Originea
neconfirmată a mărcii rămâne necunoscută; țara de fabricație se confirmă cu furnizorul.

O pagină Sportist pentru T400 avea denumiri Lotto/Orion contradictorii și a fost
exclusă. Pentru Horizon 7.0 AT nu este reprodusă limita de greutate, deoarece
pagina conține două valori. Velocer UB era afișat fără stoc; fișa cere confirmarea
disponibilității. Prețurile furnizorilor sunt în monede și condiții diferite:
Gym Builder afișează „Preț la cerere”, fără conversii sau promisiuni de stoc/livrare.

Listările sunt documentate din surse publice, fără conturi sau badge comercial
de verificare. Clientul contactează furnizorul prin telefon, email sau site.
Gym Builder nu preia comenzi, plăți, transport sau formalități vamale.

## Import local

Cu Supabase local pornit și migrările existente aplicate:

```sh
node --env-file=.env.local scripts/import-directory.mjs romania
node --env-file=.env.local scripts/import-directory.mjs rest-of-world
node --env-file=.env.local scripts/import-directory.mjs asia
```

Importul refuză baze nelocale și fișe asociate conturilor. Repetarea actualizează
fișele după URL fără duplicate. Nu trimite emailuri. Data documentării se schimbă
numai după o nouă consultare a surselor. După adăugarea imaginilor, repornește
serverul `next start`, care inventariază fișierele publice la pornire.

## Verificare

Importurile celor trei piețe au fost reluate fără duplicate. Pentru toate cele
șase fișe noi au fost verificate: țara/piața, cele cinci produse unice, contactul,
prețul necunoscut și fotografiile servite HTTP 200. Cele 33 de teste unitare și
cele 6 teste de integrare pentru piețe și listări editoriale au trecut.

## Extindere la 50 de produse

Cele trei piețe au acum câte cinci produse pentru fiecare dintre cei 10 furnizori:
20 Asia, 15 România și 15 restul lumii. Au fost adăugate 20 de fișe cu fotografii,
specificații și linkuri de produs individuale. Fișa detaliată afișează legătura
„Fotografii și specificații: sursa oficială a produsului”. Toate cele 50 de fișe
au fost verificate în baza locală și fotografiile lor răspund HTTP 200.

Migrarea `20261021000300_editorial_catalog_capacity.sql` permite extinderea
numai pentru produse cu sursă într-un profil editorial fără cont. Conturile
comerciale, inclusiv cele cu URL de sursă, păstrează cota planului. Produsele
fără sursă nu beneficiază de excepție. Testul de integrare a demonstrat întâi
blocarea celui de-al patrulea produs editorial, apoi extinderea și păstrarea
limitelor conturilor după aplicarea migrării.

SportsArt G874 are valori diferite pentru greutatea aparatului în pagina web și
broșura PDF; această valoare nu este reprodusă în fișa nouă. Rogue Kettlebells
este o gamă cu greutăți selectabile individual, nu un set; originea mărcii SUA
nu reprezintă țara de fabricație. StrengthErg este prezentat fără PM5 în imagine,
iar monitorul se selectează separat. Suportul SkiErg nu include ergometrul.
Produsele second-hand nu fac parte din această extindere.

După extindere au trecut 33 de teste unitare, 78 de teste de integrare și lint.
Pagina StrengthErg a fost verificată în browser: fotografie, contact, specificații
și URL direct `https://www.concept2.com/ergs/strengtherg`.
