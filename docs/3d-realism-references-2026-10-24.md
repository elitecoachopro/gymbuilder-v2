# Referințe și finisaje Imperial Gym

Selecție editorială pentru acest produs, nu clasament mondial verificabil. Cercetare din documentația oficială, 24 octombrie 2026; nu s-au testat conturi plătite ale produselor și nu s-au preluat modele/texturi/cod proprietar.

| Reper | Calitate documentată | Aplicare în Gym Builder |
| --- | --- | --- |
| [Homestyler — PBR](https://www.homestyler.com/forum/view/1967891134596444162?lang=de_DE) | Culoare, rugozitate, metalicitate și relief distincte | Hărți proprii separate pentru pardoseli; microrelief propriu pentru tapițerie, vopsea, cauciuc și oțel; culorile editabile rămân păstrate |
| [Coohom — real-time rendering](https://open.coohom.com/helpcenter/render-real-time-rendering-operation-guide) | Previzualizare de materiale/lumină, preseturi, randare prin cloud | Separarea calității interactive de efectele costisitoare; preseturi existente Zi/Seară/Studio păstrate și verificate. Nu s-a integrat serviciul cloud Coohom |
| [Planner 5D — materiale](https://support.planner5d.com/en/articles/7210639-how-to-change-a-wall-color) | Ajustarea materialelor, scării, orientării, navigare 2D/3D | Tipare proprii de pardoseală la scară metrică: cauciuc 0,5m, lemn cu scânduri decalate, beton și gazon în zone. Schimbarea finisajelor rămâne în panoul existent |

[DHZ GymDesigner](https://dhz-gigafactory.eu/gymdesigner/) este reperul fitness menționat de utilizator. Modelele generice ale aplicației nu sunt prezentate drept modele oficiale DHZ. Fidelitatea unui anumit produs ar necesita geometrie/dimensiuni verificate și drepturi de utilizare pentru activele furnizorului.

## Implementare

Hărți procedurale proprii, fără descărcări externe: trei canale RGBA 256² per pardoseală (768 KiB bază, aproximativ 1 MiB cu mipmaps), patru hărți comune 128² pentru microrelieful echipamentelor. Canale culoare sRGB, relief/rugozitate liniare. Repetarea se actualizează fără regenerarea pixelilor. Resursele sunt eliberate la schimbarea materialului/demontare. Contextul de texturi este comun pereților și aparatelor.

Finisajele CAD și cele procedurale folosesc aceleași valori fizice, cu proprietatea materialelor originale păstrată: materialele importate se clonează și se eliberează separat. Relief fin pentru tapițerie și metal, rosturi adâncite la cauciuc, scânduri decalate la lemn. În plus, mânere striate și detalii la reglajul scaunelor pentru cele trei aparate de forță, îmbinate în aceleași șapte suprafețe. Triunghiuri: chest press 10.356, lat 10.008, leg press 10.832, toate sub plafonul existent 28.000.

Inițial 2D, 3D la cerere, adaptive DPR, profil Economic, fără umbre dinamice în Automat, fără bloom/ray tracing/adăugare de lumini dinamice. Nu s-au adăugat furnizori, prețuri, plăți sau schimbări de schemă/storage.

## Verificare

- Test nou observat RED (modulul lipsea), apoi cele două cazuri au trecut: separarea canalelor, bugetul pixelilor, rosturi adâncite, scânduri decalate și microrelief distinct.
- Lint, TypeScript, 62 teste unitare și build de producție trecute după simplificare. Testele existente de geometrie/limite și grafică au rămas nemodificate.
- Browser desktop cu viewport375×812: demo39 obiecte, focus chest press, zoom și rotire, pardoseală lemn/cauciuc, profil Economic333×517 și Automat666×1035; fără erori în consolă. Iluminare Studio schimbată prin UI. Peisaj812×375: canvas770×358, buffer1540×716. Desktop1365×900: aparatul și lemnul vizibile. Adăugare treadmill CAD din bibliotecă și focus, încărcare fără erori.
- Performanța pe telefon fizic/FPS/autonomie nu au fost măsurate; viewport-ul mobil nu dovedește performanță universală pe GPU-uri mobile.
- Simplificare: reuse fără constatări; quality două remedii (tip mort eliminat, parametri comuni); efficiency un remediu (fără regenerare pe schimbarea repeat); test-value inline: ambele probe independente utile, păstrate exact. Fără comentarii noi de revizuit.
- Revizie ce-code-review completă, focused correctness + adversarial local, fără constatări: `/tmp/compound-engineering-501/ce-code-review/20261024-195151-12619167`. Fără furnizor extern de modele disponibil pentru a doua opinie.

## Publicare verificată

Deployment `dpl_Rmw1hn6rWCsvuiBrfqwLSXLDTHoE`, build READY, promovat cu succes pe gymbuilder.app. După promovare: încărcare nouă pe domeniul public, demo39 obiecte, 3D+focus imediat chest press, cauciuc cu rosturi vizibile, schimbare prin panoul Finisaje la lemn, capturi salvate `gymbuilder-realism-rubber-live.png` și `gymbuilder-realism-wood-live.png`. Consola fără erori. Nu s-a salvat demo-ul în baza de date. Recepție de review păstrată în `3d-realism-review-2026-10-24.json`.
