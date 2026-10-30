# GymBuilder Studio 3D

> Document istoric pentru editorul inițial. Pentru traseele editorului curent, consultă [manualul web](user-manual.md) și [editorul spațiului](configurator-space-editor.md). Rezultatele datate de mai jos nu sunt o certificare a versiunii curente.

Implementare locală: 20 octombrie 2026. Ruta: `/configurator`.

## Flux disponibil

1. Clientul introduce suprafața exactă, lungimea și lățimea. Produsul lor trebuie să corespundă suprafeței, cu toleranță de 0,02 m².
2. Completează înălțimea liberă, bugetul de dotări în EUR, profilul sălii, zonele și cerințele în text.
3. Generatorul standard pregătește o propunere fără servicii externe. Asistentul AI folosește același motor de amplasare după extragerea cerințelor.
4. Clientul verifică dimensiunile, zonele, costul estimativ, machetele și elementele neamplasate, apoi aplică explicit propunerea.
5. Editează planul în 2D sau 3D, mută machetele, le rotește cu 90°, adaugă sau elimină elemente și salvează proiectul în cont.

Cerințele în curs de editare sunt separate de configurația aplicată. Salvarea este oprită până la aplicarea unei propuneri sau renunțarea explicită la cerințele neaplicate. O propunere devenită veche după modificarea cerințelor nu poate fi aplicată. Restaurarea planului anterior recuperează geometria și cerințele de dinainte de aplicare; salvarea încheie această posibilitate. Editorul este blocat pe durata salvării pentru a evita suprascrierea stării din răspunsuri întârziate.

## Catalog standard

25 de machete parametrice, fără descărcări de modele sau fonturi 3D externe:

- Cardio: bandă de alergare, bicicletă spinning, eliptică.
- Greutăți: rack squat, bancă reglabilă, suport de gantere.
- Forță: chest press, leg press, lat pulldown.
- Funcțional: rig, box pliometric, aparat de vâslit.
- Studio și stretching: oglindă, saltea yoga, saltea stretching.
- Recepție și lounge: desk, canapea de așteptare, canapea lounge.
- Vestiare și grupuri sanitare: dulapuri, bancă, duș, WC, lavoar.
- Spa: saună și jacuzzi.

Catalogul comun conține amprenta, înălțimea și prețul orientativ. Scena folosește geometrie procedurală și instanțierea componentelor dreptunghiulare; randarea se face la cerere. Editarea prin săgețile 3D actualizează obiectul exact folosit pentru validare și salvare. Controalele prin butoane și planul 2D oferă alternative la tragere.

## Motor de amplasare și limite

`src/lib/gym-studio.ts` calculează coordonatele din cerințe. Propunerile generate rezervă 15% din suprafață într-o bandă de circulație și folosesc un contur orientativ de 0,30 m în jurul fiecărei machete. Verifică limitele zonei, suprapunerile fizice, înălțimea și plafonul bugetului. Elementele omise au motiv și cantitate: înălțime, buget sau spațiu insuficient. Editările manuale pot modifica rezerva și distanțele; la salvare sunt verificate amprentele efective.

Modelul actual acoperă spații dreptunghiulare. Rezerva nu reprezintă un traseu de evacuare validat; nu sunt modelate uși, stâlpi, ferestre, obstacole sau forme neregulate. Zonele și machetele sanitare sunt conceptuale; nu proiectează racorduri, instalații electrice, ventilație sau canalizare. Nu oferă aviz arhitectural ori de conformitate. Prețurile sunt valori de lucru pentru machete, nu oferte comerciale: nu includ lucrări, instalații, chirie sau taxe. Limita implementată este de 500 de machete; performanța la această limită nu a fost măsurată pe dispozitive reale.

## Activarea AI

În `.env.local`, configurează doar pe server:

```dotenv
OPENAI_API_KEY=<cheia contului API>
OPENAI_GYM_MODEL=<model disponibil cu Responses și Structured Outputs>
```

Repornește Next.js. Cheia nu se include în variabile `NEXT_PUBLIC_`, Git sau mesaje de chat. Alegerea modelului rămâne explicită; nu este activat automat un model cu un cost necunoscut. Fără ambele valori, interfața afișează starea neconfigurată și permite generatorul standard. O eroare la verificarea disponibilității are mesaj separat și buton de reverificare.

`POST /api/configurator/ai` cere autentificare și aplică o cotă de cinci cereri pe oră pentru fiecare utilizator. Trimite cerințele și contextul către OpenAI doar la apăsarea butonului AI. Răspunsul are schemă JSON strictă, apoi trece prin validarea Zod și motorul de amplasare. Dimensiunile lipsă cer clarificări. Coordonatele nu sunt decise de model. Cererea folosește `store: false`, termen de 45 de secunde și plafon de ieșire; nu este trimis istoricul contului sau catalogul privat al furnizorilor. [Documentația oficială pentru Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

La verificarea locală nu au fost configurate cheie și model. Integrarea externă live nu a fost executată. Testul transportului folosește un răspuns simulat și verifică protocolul cererii plus generarea geometriei; nu dovedește calitatea unui model real.

## Persistență și compatibilitate

Migrarea `20261020000100_gym_studio_configuration.sql` adaugă coloana JSONB nullable `gym_projects.configuration`, cu versiunea 1. Nu rescrie zone, machete sau proiecte existente. Datele noi sunt validate la API și salvate împreună cu planul, cu verificarea proprietarului.

Proiectele vechi păstrează configurația `null` la redeschidere și salvare, inclusiv cele fără zone sau cu zone personalizate. Înălțimea și bugetul sunt afișate ca neînregistrate. Trecerea la noul format are loc prin generarea și aplicarea explicită a unei propuneri.

## Verificări

- Teste unitare pentru suprafață și geometrie, buget, înălțime, amplasare, motivele omiterii, validarea machetelor și coerența zonelor.
- Transport AI verificat cu răspuns simulat, inclusiv cerere structurată privată și eroare HTTP a furnizorului; refuzurile și ieșirile incomplete nu sunt acceptate ca proiecte.
- Integrare pe o copie izolată: salvare, actualizare și redeschidere, autentificare AI și lipsa configurării, plus suita existentă de regresie.
- Browser: propunere standard de 300 m²; mutare și rotire; salvare și redeschidere; cerințe neaplicate; propunere veche; restaurare; proiecte vechi; RO/EN; rezoluții desktop și mobile.
- Migrarea a fost aplicată întâi în baza izolată, apoi în baza locală principală. Numărul de rânduri și amprentele datelor din `users`, `gym_projects`, `products`, `supplier_profiles` au coincis înainte și după migrare, excluzând din comparație noua coloană. Nu s-a rulat resetarea bazei.

Dovezile vizuale și rezultatele finale sunt în `docs/audits/studio-evidence/`.

### Rezultatul final

29 de teste unitare și 71 de integrare au trecut, cu zero eșecuri. TypeScript, lint (zero avertismente), buildul de producție și verificarea spațiilor din diff au trecut.

Revizia de cod a examinat o captură intermediară; cele patru constatări confirmate au fost remediate: persistența tragerii 3D, salvarea proiectelor vechi goale, concurența dintre salvare și aplicarea unei propuneri, recuperarea verificării de disponibilitate AI. Captura revizuită și rezolvările sunt păstrate în dovezi; nu reprezintă probleme rămase. Revizia nu a inclus un furnizor extern independent.

Testele vizuale folosesc dimensiuni de viewport, nu un dispozitiv fizic cu ecran tactil. Au fost verificate 375×812, 390×844, 844×390, 1024×900 și 1440×1050; înălțimea scenei se adaptează și în orientare peisaj. Datele sintetice din verificarea în browser au fost șterse din baza izolată. Aplicația principală rămâne pornită la portul 3000.

## Verificare OpenAI reală — 22 octombrie 2026

Integrarea a fost activată local cu `gpt-6.1-sol`, folosind o cheie păstrată exclusiv pe server. Au fost efectuate cinci cereri reale cu date fictive. Prima a evidențiat un blocaj: modelul introducea întrebări opționale despre capacitate și amenajări în lista `questions`, iar interfața blochează aplicarea când lista nu este goală. Instrucțiunile din `src/lib/gym-ai.ts` precizează acum că această listă este rezervată măsurătorilor lipsă/conflictuale și cerințelor explicite contradictorii; recomandările opționale sunt păstrate în rezumat. Un buget nul înseamnă fără plafon, conform formularului.

După corecție:

- Browser RO: 300 m², 20 × 15 × 3,5 m, buget dotări 30.000 EUR → 4 zone, 23 de machete, 26.750 EUR. Aplicarea în 3D, salvarea și redeschiderea după reîncărcare au reușit.
- API autentificat EN: 24 de machete, 26.100 EUR; salvarea și redeschiderea au păstrat exact zonele și configurația.
- Măsurători lipsă: întrebări de clarificare și nicio propunere executabilă; dimensiunile nu au fost inventate.
- Plafon de 2 m și buget 1.000 EUR: rackul de 2,3 m a fost omis din motiv de înălțime, iar cele două benzi au fost omise din motiv de buget.
- Autentificarea, intrările invalide și limita de 5 cereri/oră au răspuns cu HTTP 401, 400 și 429. A șasea cerere validă nu a declanșat o generare externă.
- 34 de teste unitare, cele 2 teste de integrare ale studioului, TypeScript, lint fără avertismente și buildul de producție au trecut. Nu a fost reluată întreaga suită de integrare. Testul de provider neconfigurat rămâne condițional și nu se execută cu cheia prezentă.

Au fost eliminate contul și proiectele sintetice create pentru verificare. Datele existente nu au fost modificate. Aceste probe verifică funcționarea de bază, nu calitatea statistică a modelului sau toate cazurile posibile. Costul exact al apelurilor nu este capturat de transportul actual. Dovezi: `docs/audits/studio-evidence/ai-live-verification-20261022.json` și `ai-live-ro-20261022.png`.
