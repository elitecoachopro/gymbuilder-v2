# Gym Builder: OpenPlan3D si alternative comerciale

Evaluare documentara: 26 octombrie 2026.
Completeaza planul `docs/plans/2026-10-26-1644-feat-gym-editor-300m2-plan.md`.
Nu reprezinta un test de utilizare, un benchmark sau o oferta comerciala.

## Decizie

Se continua editorul propriu React / Three.js / React Three Fiber.
OpenPlan3D ramane un reper pentru instrumentele de editare, iar Roomle si Planner 5D sunt alternative comerciale daca dezvoltarea proprie nu atinge criteriile planului.

## OpenPlan3D: ce poate fi util

Referinta oficiala de functionalitati este datata 15 octombrie 2026.
Descrie editare de pereti, deschideri, istoric, niveluri, modele GLB si stocare locala.
Autorii precizeaza ca o functionalitate implementata nu inseamna calificarea tuturor dispozitivelor.
[Sursa: capability reference](https://raw.githubusercontent.com/laanlabs/openPlan3D/main/FEATURES.md).

| Suprafata evaluata | Gym Builder existent | Utilitate OpenPlan3D | Decizie |
|---|---|---|---|
| Pereti si deschideri | Formulare numerice si contur ortogonal | Gesturi si reguli de selectie descrise mai amplu | Reper pentru U2 |
| Undo/redo | Istoric al cladirii, cu revenire la parter | Interactiuni geometrice cu istoric | Pastram istoricul propriu, corectam nivelul |
| Salvare locala | Nu s-a identificat ciorna durabila in Studio | IndexedDB si tratarea erorilor de stocare | Reper pentru U1 |
| Modele GLB | Import si catalog pilot deja existente | Import de modele si reprezentari alternative | Nu inlocuim loaderul actual |
| Arhitectura aplicatiei | Next.js / React, conturi si API propriu | SvelteKit / Svelte | Nu este un component React gata de conectat |
| Domeniu fitness | Catalog, amplasare si AI specializate | Editor general de incaperi | Pastram regulile Gym Builder |
| Telefon | Necesita masuratori fizice noi | Documentatia nu confirma toate dispozitivele | Nu presupunem avantaj de performanta |

Manifestul proiectului indica versiunea 0.9.0, SvelteKit/Svelte si Three.js 0.182, pe cand Gym Builder declara Three.js 0.169 in manifestul local inspectat.
Aceasta diferenta nu demonstreaza incompatibilitate generala, dar exclude presupunerea ca modulele pot fi copiate fara adaptare.
[Manifest OpenPlan3D](https://raw.githubusercontent.com/laanlabs/openPlan3D/main/package.json).

Modulul de stocare deschis pentru inspectie confirma tranzactii IndexedDB si validarea proiectului printr-un modul propriu.
Finalizarea tranzactiei confirma salvarea; succesul unei singure cereri nu este suficient.
Este un reper util pentru ciornele noastre, nu un adaptor verificat pentru documentele Gym Builder.
[Implementarea stocarii](https://raw.githubusercontent.com/laanlabs/openPlan3D/main/src/lib/services/localDatabase.ts).

Licenta software declarata este MIT, cu pastrarea notificarilor cerute la reutilizare.
Licentele activelor trebuie examinate separat inaintea distribuirii lor in Gym Builder.
[Licenta proiectului](https://raw.githubusercontent.com/laanlabs/openPlan3D/main/LICENSE).

Inspectia fisierului unui test de snapping a esuat la descarcare; nu se declara verificarea acelui test.
Nu au fost instalate dependentele proiectului si nu au fost rulate testele sau interfata lui.
Un prototip comparativ ramane justificat doar pentru un gest concret pe care implementarea proprie nu il rezolva satisfacator.

## Comparatia financiara initiala

| Element | Editor propriu | Roomle Room Designer | Planner 5D B2B |
|---|---|---|---|
| Baza software | Stack-ul existent | Produs comercial integrabil | Produs comercial white-label |
| Tarif public relevant | Nu exista un abonament nou ales prin acest plan | De la 650 EUR/luna sau 6.500 EUR/an, fara taxe | Pret complet neverificat public |
| Facturare | Infrastructura si servicii existente | Pagina mentioneaza licenta facturata anual | Contract personalizat |
| Catalog fitness | Pregatire si verificare proprie | Pregatire/import si drepturi de confirmat | Incarcare in catalogul partenerului, cost de confirmat |
| Integrare si mentenanta | Dezvoltare si intretinere proprii | Efort separat de abonament | Efort separat de contract |
| AI si randari | Consum de servicii configurate separat | Drepturi si consum de confirmat | Functii AI/randari cu tarifare separata sau add-on |
| Export si iesire din contract | Documentul propriu ramane sub controlul aplicatiei | Fidelitatea exportului si drepturile se confirma contractual | API documentat, CAD export beta; conditiile se confirma contractual |

Roomle publica un domeniu, 180.000 de vizualizari/an si planuri 2D/3D nelimitate pentru Room Designer.
Tarifele afisate nu stabilesc pretul complet al SDK-ului personalizat, pregatirii modelelor, suportului sau depasirilor de utilizare.
Nu se interpreteaza valoarea lunara ca dovada a unui contract reziliabil lunar.
[Preturi oficiale Roomle](https://www.roomle.com/en/pricing).

Planner 5D documenteaza iframe, API JavaScript si REST, cu acces dupa semnare.
Recunoasterea planurilor si randarile au consum separat; AI room designer este un add-on configurabil.
Abonamentele individuale nu reprezinta pretul integrarii B2B.
[Prezentare tehnica Planner 5D B2B](https://support.planner5d.com/en/articles/15189751-planner-5d-b2b-api-technical-overview).

Costul complet pentru primul an trebuie calculat ca:

**licenta contractata + implementare + catalog licentiat si optimizat + infrastructura + consum AI/randari + suport si mentenanta + taxe aplicabile**.

Nu exista suficiente date pentru o estimare numerica responsabila a intregului proiect sau pentru a afirma ca dezvoltarea proprie va fi mai ieftina.
Costurile istorice deja suportate nu sunt tratate ca dovada ca viitoarea dezvoltare este gratuita.

## Conditii pentru compararea ofertelor

Orice furnizor comercial va fi evaluat pe aceeasi sala de 300 m² si acelasi lot de zece aparate.
Oferta trebuie sa precizeze:

1. Introducerea dimensiunilor, editarea si salvarea proiectului prin conturile Gym Builder.
2. Catalogul propriu, drepturile asupra modelelor si costul pregatirii lor.
3. Comportamentul pe telefon si alternativa utilizabila cand 3D nu functioneaza.
4. Accesul programatic la proiect si exportul complet al datelor la incetarea contractului.
5. AI disponibil efectiv prin integrare, limite, consum si pretul suplimentar.
6. Tariful initial, reinnoirea, numarul de domenii, depasirile, suportul si taxele.

Acest document nu reprezinta o solicitare trimisa furnizorilor si nu angajeaza un abonament.
Prima modificare de produs ramane U1 din planul tehnic: istoricul comun si recuperarea locala.
