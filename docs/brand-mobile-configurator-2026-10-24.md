# Gym Builder și accesul Configurator 3D

Cerință confirmată: aplicația și sigla principală se numesc Gym Builder. Imperial Gym rămâne exclusiv marca din configuratorul 3D și livrabilele sale. Accesul public se numește Configurator 3D și trebuie să fie vizibil pe mobil într-o secțiune separată.

## Implementare

- Restabilită sigla existentă `/logo.png`, textele și metadatele Gym Builder în afara editorului 3D; datele furnizorilor/produselor nu sunt modificate.
- Marcajele Imperial Gym din editor, modelele 3D și prezentări se păstrează; titlul paginii editorului este Configurator 3D.
- Legătură dedicată Configurator 3D în navigarea desktop și meniu; pe mobil/tabletă, bară permanentă separată sub antet, fără a deschide meniul.
- Desktop la 1280 px; antet 80 px, bară mobilă 48 px. Compensată înălțimea în conținut, iar meniul își ajustează înălțimea și își păstrează închiderea la Escape/trecerea pe desktop.
- Nu se trimit mesaje sau emailuri. Modificările din șabloanele de email sunt doar restabilirea denumirii expeditorului/aplicației.

## Verificare

Nu s-au adăugat teste care să copieze etichetele sau structura JSX pentru această corecție reversibilă de text și navigare. Dovezile sunt browserul real și testele existente de traducere, plus controalele proiectului.

- ESLint, TypeScript, toate cele 57 de teste unitare și buildul Next.js: trecute.
- 375 × 812: logo Gym Builder, bară Configurator 3D permanentă, deschidere directă în editor Imperial Gym; pagina nu depășește viewportul (367/367 px). Titlul editorului începe sub antet.
- 1280 × 800: șase legături desktop vizibile, fără depășire (1272/1272 px).
- Meniul mobil se deschide/închide; Escape funcționează; trecerea de la 1024 la 1280 px închide meniul și restabilește scrollul paginii.
- Simplificare separată neactivată: sub 30 de linii de logică/UI nouă, restul sunt schimbări mecanice de denumire.

## Corecții rezultate din revizie

Revizia inițială a identificat două regresii provocate de antetul mobil mai înalt: filtrele fixe ale catalogului și ancora piețelor puteau fi acoperite. Rezolvate prin variabila comună `--app-header-height`, inclusiv în ancorele promovărilor, bare laterale și elementele fixe care folosesc antetul. Include bordurile reale: 130 px mobil, 81 px desktop. Au fost corectate și cele cinci sigle text de autentificare (scrise inițial în două elemente separate).

Reverificat pe buildul final: ancora `products#markets` la 146 px, sub antetul de 130 px; la scroll filtrele rămân la 130 px și căutarea la 154 px, complet vizibile. Pagina login afișează Gym Builder în ambele sigle. ESLint, TypeScript, 57 de teste și buildul trec din nou. Candidatul Vercel `dpl_8t1RCU6LNiHY7mieSk4BjNxUADWw` este depășit de această corecție și nu se promovează pe domeniul public.

Constatările #1 și #2 ale reviziei inițiale au fost aplicate inline; niciuna nu rămâne deschisă. Verificat și la 1024 px: filtre la 130 px, căutare la 154 px. Delta materială (15 fișiere de offset CSS și sigle text) a primit revizie separată concentrată: `status: complete`, `Ready to merge`, fără constatări sau limite de testare raportate. Artefact final `/tmp/compound-engineering-501/ce-code-review/20261024-162438-ebe69502`; receptele ambelor revizii sunt păstrate lângă acest document. Nu s-a folosit un model de la alt furnizor; verificarea adversarială a fost locală.

Publicat și verificat pe domeniul public: `dpl_BqksYCHqUbRKQn2hLrcDHoH3odxs`, https://www.gymbuilder.app . La 375 px, bara Configurator 3D este vizibilă pe pagina principală, iar atingerea ei deschide editorul cu Imperial Gym în interior și sigla Gym Builder în antetul aplicației. Captură live: `/Users/idris2024/.codex/visualizations/2026/10/21/01a15c65-7161-7d52-95fd-b9714f463978/gymbuilder-configurator-mobile-live.png`.
