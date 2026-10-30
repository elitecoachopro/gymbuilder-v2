# Gym Builder — manualul traseelor web

Versiune: 30 octombrie 2026. Ghidul accesibil în aplicație, în română și engleză, este la `/cum-functioneaza`. Acest document descrie versiunea locală curentă; nu reprezintă confirmarea publicării acesteia.

## Alegerea traseului

| Ce dorești | Intrare | Rezultat |
| --- | --- | --- |
| Găsești aparate | Echipamente `/products` | Fișă produs și contact furnizor |
| Proiectezi spațiul | Proiectează sala `/configurator/studio` | Proiect 2D/3D, ciornă locală, salvare în cont |
| Găsești amenajări/servicii | Servicii pentru sală `/construieste-sala` | Categorii documentate și contacte oficiale |
| Estimezi investiția | `/estimator-buget`, accesibil din servicii/ghid | Estimare orientativă |
| Vinzi echipamente | Devino furnizor `/register/supplier` | Cont, verificare firmă și publicare după aprobare |
| Reiei activitatea | Contul meu → dashboard | Proiecte, cereri, conversații și favorite |

## Client: catalog și cereri

1. Deschide catalogul fără cont. Alege nou/second-hand, categorie, piață, căutare, preț și sortare. Resetarea filtrelor revine la catalogul general.
2. Verifică moneda originală, starea și specificațiile; un preț necunoscut nu înseamnă zero. Compară maximum patru produse.
3. Din fișa produsului vezi contactul direct și profilul furnizorului. Din profil poți deschide fișa fiecărui produs.
4. Profilurile informative documentate din surse publice se contactează direct; nu sunt prezentate ca firme cu cont activ pe platformă.
5. Pentru un furnizor eligibil poți cere o ofertă sau adăuga produse în **Cererea mea**, disponibilă permanent în antet. După adăugare există și legătura **Vezi cererea mea**.
6. Verifică lista, cantitățile și datele de răspuns. Cererile sunt grupate pe furnizor. La un rezultat parțial rămân în coș numai produsele pentru care cererea nu s-a înregistrat. Reîncercarea folosește deduplicarea existentă.
7. Confirmarea înregistrării în platformă nu garantează livrarea emailului în inbox. Achiziția, plata, transportul, instalarea și garanția se stabilesc direct cu furnizorul.
8. În dashboard folosește istoricul paginat și conversațiile. La eroare mesajul nestrimis rămâne în câmp; folosește Reîncarcă mesajele pentru răspunsuri noi.

## Cont și recuperare

- Catalogul este public. Contul clientului este pentru proiecte salvate, cereri și favorite.
- Formularul clientului cere numele, emailul și parola; nu mai colectează telefonul pe care nu îl salva. Telefonul poate fi cerut contextual într-o cerere de contact.
- Parola: 8–128 caractere, cel puțin o literă mare, o literă mică și o cifră. Aceeași regulă este folosită la client, furnizor și resetare.
- După înregistrare rezultatul rămâne pe ecran. Confirmă emailul, verifică Spam sau solicită retrimiterea. Nu este necesar să creezi încă un cont când emailul nu ajunge.
- La un link de resetare expirat poți cere un link nou. La succes alegi explicit continuarea către autentificare.
- Deconectarea verifică răspunsul serverului înainte de a curăța starea locală. La eșec nu se afișează o deconectare reușită.

## Furnizor: înregistrare și publicare

1. **Cont**: nume, email, parolă și confirmare.
2. **Firmă**: date de identificare/localizare și contact. Site-ul și descrierea sunt opționale. Emailul public al firmei este distinct de emailul de autentificare.
3. **Verificare**: minimum trei fotografii, acceptarea explicită a termenilor și finalizare. Încărcările private și verificarea firmei rămân obligatorii.
4. Confirmă emailul și urmărește aprobarea firmei. Nu presupune că înregistrarea înseamnă publicare imediată.
5. Deschide **Produse → Adaugă produs**, completează fișa și fotografiile. Cota se verifică pe server. La atingerea limitei primești explicația, fără ocolirea planului.
6. Limite imagini: Free 1, Starter 5, Professional 10, Enterprise fără plafon comercial; se păstrează limitele tehnice de fișier/încărcare.
7. Alegerea Starter/Professional/Enterprise din Prețuri se păstrează ca **plan solicitat**. Contul nu primește automat drepturi plătite. Activarea planurilor/promovărilor web se confirmă separat cu Gym Builder.
8. Custom → Contact. Publicarea ofertelor și etichetele nu trebuie interpretate ca plată finalizată sau rezervare automată a promovării.

## Configurator: lucru, autentificare și recuperare

1. Creează un proiect sau pornește Demo 300; verifică dimensiunile, înălțimea, bugetul și conturul înainte să amplasezi aparate.
2. Spațiu → pereți/deschideri/obstacole/zone; Aparate → bibliotecă, mutare și rotire; Finisaje → materiale. Controalele numerice sunt alternativa la tragere.
3. Selectorul de nivel schimbă etajul activ. Undo/Redo și salvarea lucrează asupra documentului clădirii. Nu reconstitui etajele ca proiecte separate.
4. Profilul economic rămâne implicit. 3D este opțional; la pierderea contextului grafic editorul trece la 2D și păstrează documentul. Reîncercarea 3D este manuală.
5. AI necesită cont, disponibilitatea serviciului și consimțământ. Verifică propunerea și motivele dotărilor omise înainte de aplicare. O propunere devenită veche după editări nu trebuie aplicată.
6. La salvare fără sesiune, **Autentificare și revenire la proiect** pregătește o copie temporară în sesiunea aceluiași browser. După login se reia explicit proiectul, apoi se apasă Salvează. O copie a altui cont nu este transferată către noul cont.
7. Ciorna locală și proiectul din cont sunt separate. Recuperarea locală se alege explicit. Dacă stocarea locală eșuează, exportă JSON înainte să părăsești editorul.
8. Redeschide din **Proiectele mele** sau selectorul editorului. Proiectele vechi se deschid în editorul clasic. Săgeata etichetată Editor clasic indică acest lucru, nu revenirea în dashboard.
9. JSON și lista de dotări includ toate nivelurile. PNG și Prezentare/PDF folosesc nivelul activ. Numele PNG reflectă suprafața și nivelul curent.
10. Prețurile modelelor sunt orientative. Planul nu certifică arhitectura, evacuarea, instalațiile sau conformitatea tehnică.

## Administrator

Pagina `/admin` verifică sesiunea și rolul înainte de a monta interfața. API-urile își păstrează verificările proprii. Aprobările, moderarea și mesajele sunt acțiuni separate de catalogul public. Erorile de încărcare au feedback și reîncercare; cererile au paginare și total separat.

## Verificare înaintea beta

Rezultatele curente și limitările verificării se consemnează separat în raportul de implementare din `docs/audits/`. Manualul nu înlocuiește probele cu email real, telefon fizic sau validarea deployment-ului public. Nu folosi conturi de clienți ori furnizori reali pentru probe distructive.
