# Claritate și navigare 3D pe mobil

Cerință: imagine clară, detalii ale aparatelor vizibile, navigare simplă, control al costului grafic și publicare. Denumirile Gym Builder / Imperial Gym rămân separate conform cerinței anterioare.

## Cauză și corecție

La lățime de 375 px, profilul Economic implicit desena doar 333×444 pixeli fără antialiasing, iar vederea generală comprima întreaga sală într-un ecran îngust. Setările numeroase precedau scena. Verificările anterioare confirmau funcționarea, dar nu stabileau un prag suficient de claritate vizuală mobilă.

- Profil implicit nou Claritate automată, antialiasing și DPR până la 2. Fără umbre dinamice sau mediu HDR în acest profil.
- Buget de 1.200.000 pixeli, fără coborâre sub 1:1 atunci când suprafața CSS depășește bugetul. În timpul navigării, DPR automat cel mult 1,25; revine la claritatea statică după gest.
- Randare la cerere, profil Economic și recuperarea după pierderea WebGL păstrate. Pornirea inițială rămâne în 2D, fără context GPU.
- La deschiderea 3D pe mobil, camerele dreptunghiulare pornesc în Interior. Contururile în L sau importate pornesc în vederea întregii săli cu pereți în secțiune; nu se presupune că punctul Interior din bounding box se află în contur.
- Apropiere de aparatul selectat, încadrare sală, rotire/deplasare/zoom, setări pliabile și scenă mobilă mai mare. Etichetele aparatului sunt mai mici în vederea apropiată.

## Verificare

- Dovezi RED înainte de implementare: două cazuri noi în testele existente de grafică au eșuat pentru lipsa exporturilor noi; regresia camerei L a eșuat înaintea helperului.
- După implementare: ESLint, TypeScript, toate cele 60 de teste unitare și buildul de producție trecute.
- Browser la 375×812, demo 300 m² / 39 obiecte: profil automat 666×1035 pentru scenă CSS333×518; Economic333×517. Fără erori grafice observate.
- Rotire prin drag, deplasare, zoom înainte/înapoi, trecere Economic/Automat și restaurarea rezoluției după navigare verificate.
- La 812×375: buffer1540×716, scenă770×358, fără depășire orizontală (804/804 px).
- Apropiere de chest press selectat: scaun, mânere și stivă de greutăți vizibile. Panoul de setări deschis/închis și controalele existente rămân accesibile.
- Verificarea publică a identificat o comandă focus pierdută înainte de montarea scenei. Comanda este acum consumată după montare, iar perspectiva salvată se aplică înainte de încadrare. Repetat local: 3D + focus imediat la 45° și după 2D→3D cu 75°, aparatul rămâne complet vizibil. Lint, TypeScript, 60 teste și build repetate cu succes.
- Încăpere în L 20×15m, decupaj18×5m: UI inițială Sala întreagă, pereți în secțiune, contur complet vizibil. Regresie unitară pentru aceeași geometrie.
- Testele au folosit browserul desktop cu viewport mobil, nu un telefon fizic. Nu se declară FPS, autonomie sau stabilitate universală pe toate telefoanele.

## Calitate și revizie

Simplificare pe cinci lentile: două recomandări aplicate (CameraCommand discriminat și evitarea setDpr fără schimbare), niciun test eliminat sau slăbit. Revizie concentrată completă: o constatare P2 pentru camera inițială în contur L. Aplicată inline cu test-first și verificare UI; reviewerul a confirmat rezolvarea, fără altă problemă în corecție. Recepție în `mobile-3d-clarity-review-2026-10-24.json`. Revizie adversarială locală; fără model de la alt furnizor disponibil.

## Publicare

Versiunea finală `dpl_GCaWRsFfprUdLWyvp3k55eRCpSpi`, build READY și promovare Vercel reușită pe 24 octombrie 2026. Verificare nouă pe https://www.gymbuilder.app/configurator/studio la 375×812: demo39 obiecte, selectare chest press în 2D, 3D și focus imediat; aparatul este apropiat complet, buffer666×1035/CSS333×518, fără erori în consola browserului. Captură: `gymbuilder-mobile-clear-live.png` în directorul vizualizărilor conversației. Verificarea folosește viewport mobil în browser desktop, nu telefon fizic.
