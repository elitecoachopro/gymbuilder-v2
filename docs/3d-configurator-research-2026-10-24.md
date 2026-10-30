# Repere pentru configuratorul Gym Builder 3D

Selecție de cinci repere relevante pentru configurarea 3D de spații; nu clasament global independent. Cercetare documentară pe surse oficiale, fără conturi create sau test funcțional în aplicațiile terțe.

Verificat: 2026-10-24

| Platformă | Punct forte | Adaptare utilă |
|---|---|---|
| [Planner 5D](https://planner5d.com/) | Planificare intuitivă 2D/3D, dimensiuni precise și aliniere asistată. | Cote afișate pentru pereți și obiectul selectat; pas de aliniere la grilă configurabil. Normal maps/AO sunt un reper separat, nu se declară implementate dacă sunt doar finisaje colorate. |
| [Homestyler](https://www.homestyler.com/) | Materiale PBR și control de ambianță pentru prezentări de interior. | Păstrarea unui răspuns vizual diferit pentru cauciuc, lemn și metal, cu preseturi de iluminare. Nu se descarcă sau copiază bibliotecile și texturile platformei. |
| [Coohom](https://www.coohom.com/) | Cameră configurabilă și feedback vizual în timpul proiectării. | Înălțime de observare și câmp vizual reglabile; preseturi zi/seară/studio. Preseturile noastre sunt simulări vizuale, fără studiu solar sau calcul fotometric. |
| [HomeByMe](https://home.by.me/en/) | Parcurgerea spațiului la nivelul utilizatorului și ambianțe simple de iluminare. | Mod interior cu înălțime apropiată de ochiul utilizatorului; alegere simplă a ambianței fără a modifica geometria sau dimensiunile proiectului. |
| [Floorplanner](https://floorplanner.com/) | Plan la scară, cote lizibile și tranziție clară între plan și prezentare. | Cote comutabile în planul 2D și în scenă; grilă vizibilă și pas precis. Vizualizarea WebGL locală nu se echivalează cu randările fotorealiste în cloud. |

## Planner 5D

Sursă: https://support.planner5d.com/en/articles/16963387-how-to-change-dimensions-and-measurement-units

- Editare dimensiuni pereți, camere, uși, ferestre și obiecte compatibile
- Cote interioare/exterioare și linii ajutătoare
- Unități metrice/imperiale

Sursă: https://support.planner5d.com/en/articles/5876772-how-to-navigate-through-planner-5d

- Comutare 2D/3D
- Snap to grid și object snapping
- Enhanced 3D visuals cu ambient occlusion și normal maps
- Ruler pentru distanțe și randări/panorame/walkthrough

## Homestyler

Sursă: https://resources.homestyler.com/2025/09/16/homestyler-material-upload-guide-use-metallic-roughness-normal-maps-correctly/

- Materiale PBR cu base color, metallic, roughness, specular și normal maps

Sursă: https://www.homestyler.com/about/updates

- Șabloane de iluminare zi/noapte
- Medii HDRI și reglaje de luminozitate/rotație
- Control de temperatură a culorii în Lightmix

## Coohom

Sursă: https://www.coohom.com/helpcenter/camera-setting-tips?hl=en

- Înălțime cameră numerică
- FOV reglabil
- Clipping și unghiuri salvate

Sursă: https://open.coohom.com/helpcenter/render-live-render-design-and-render-simultaneously?kjl_source=hc_column_v2

- Live Render în timpul schimbării materialelor, pozițiilor și modelelor
- Vizualizări prestabilite și salvate
- Iluminare și mediu configurabile

## HomeByMe

Sursă: https://home.by.me/en/features/

- Planuri cu măsurători precise
- Parcurgere cu avatar
- Materiale și obiecte generice adaptabile
- Imagini HD/4K și 360°
- Ambianțe warm/cold/golden hour/night și preferințe personalizate

Sursă: https://home.by.me/en/guide/how-to-create-3d-home-decor-images/

- Reglarea înălțimii camerei și poziției soarelui înainte de generarea imaginii

## Floorplanner

Sursă: https://floorplanner.com/

- Editare planuri și vizualizare 3D în timp real
- Randări separate până la 8K
- Control asupra luminilor și scenei

Sursă: https://cdn.floorplanner.com/static/brochures/FloorplannerManualEN.pdf

- Mod orbital și walkthrough
- Înălțime cameră și câmp vizual
- Cote automate, interioare/exterioare și opțiuni de afișare
- Interactive snapping; materiale pentru pardoseli, pereți și tavan

Manual oficial mai vechi, public și încă accesibil; folosit ca reper de interacțiune, nu dovadă de versiune recentă.

Sursă: https://floorplanner.com/about

- Editor în browser și randare în cloud

## Diferențe recomandate

- Preseturi de lumină Zi / Seară / Studio
- Înălțime observator și FOV reglabile în modul interior
- Cote pentru pereți și dimensiunile obiectului selectat
- Pas de snap configurabil și stare vizibilă

## Limite

- Nu s-au copiat cod, modele, texturi sau biblioteci proprietare.
- Realismul geometric depinde de măsurătorile introduse și modelele 3D disponibile; nu există scanare/releveu automat verificat.
- Preseturile nu sunt simulare fotometrică sau studiu solar geolocalizat.
- Randarea interactivă în browser nu înseamnă ray tracing în cloud sau echivalență cu randările comerciale.
- FOV numeric poate fi vertical în Three.js; nu presupuneți echivalență numerică cu valorile neprecizate vertical/orizontal ale altor aplicații.
- Modelele generice pot aproxima aparate; fidelitatea exactă de marcă cere modele CAD/GLB autorizate.

## Adaptări implementate în Gym Builder

- Preferințe opționale `space.visualization`, validate strict și păstrate în salvare, redeschidere, import/export și undo/redo; proiectele fără preferințe rămân valide.
- Ambianțe Zi / Seară / Studio cu lumină, expunere și mediu coordonate. Profilul economic și pornirea în 2D rămân disponibile.
- Câmp vizual **vertical** de 35–75° și cameră interioară inițială la 1,20–2,00 m, limitată la 20 cm sub tavan. Navigarea rămâne orbitală, nu este un avatar cu coliziuni.
- Cote pe fiecare latură a conturului, inclusiv pentru spații în L, și două laturi ale amprentei aparatului selectat; comutare vizibil/ascuns în 2D și 3D.
- Pas de aliniere la mutarea cu mouse/touch: 1, 5, 10 sau 25 cm. Comenzile numerice și săgețile etichetate explicit 10 cm își păstrează comportamentul.
- Pardoseli procedurale la scară fizică, cu rugozitate și microrelief distincte pentru cauciuc, lemn, beton și gazon. Nu au fost copiate resurse ale platformelor analizate.
- Cotele 3D sunt desenate în canvas și se includ în imaginea folosită de prezentare.

## Verificări

- ESLint și TypeScript: trecute.
- Suită unitare: 57/57; incluse validare/salvare JSON, aliniere, contur L în ambele sensuri și dimensiuni ale texturilor.
- Integrare locală proiecte: 5/5; actualizare și redeschidere cu setări nonstandard (37°, 1,72 m), respingere FOV invalid și păstrarea configurației valide.
- Build Next.js de producție: trecut.
- Browser: demo 300 m² / 39 obiecte, redare reală 3D, ambianțe, cameră interioară, schimbarea perspectivei/înălțimii, undo, cote aparat 2,00 × 0,80 m, ascundere cote.
- Mobil 375 × 812: fără depășire orizontală a paginii.
- Prezentarea afișează imaginea PNG capturată din scenă. Automatizarea așteptării descărcării PNG s-a blocat; fișierul descărcat separat nu este declarat verificat.
- Simplificare: cinci lentile independente; o recomandare aplicată (compunerea cotelor comună 2D/3D); nicio eliminare sau slăbire a testelor de dovadă.
- Verificare suplimentară pe buildul final: la tavan de 2,00 m, opțiunile camerei se opresc la 1,80 m și selectarea funcționează.

## Publicare

Candidat Vercel construit și READY: `dpl_6BcqsYym7t6zZ8u58VsbHiw31Bjq` — https://gymbuilder-v2-a82i9zoam-elitecoachopros-projects.vercel.app . Creat cu `--skip-domain`; promovarea pe domeniul clientului urmează după revizia finală.

Revizie finală `ce-code-review mode:agent`, profunzime completă, doar cele 9 fișiere ale acestei schimbări: `Ready to merge`, fără constatări acționabile. Patru lentile încheiate: corectitudine, testare, contract API/stocare, adversarial. Nu a rulat un model de la alt furnizor (rută indisponibilă); lentila adversarială a rulat în proces. S-au consemnat limite de automatizare pentru drag/render și descărcarea PNG, fără defect demonstrat. Artefacte: `/tmp/compound-engineering-501/ce-code-review/20261024-realism`.

Promovat cu succes pe https://www.gymbuilder.app/configurator/studio — `dpl_6BcqsYym7t6zZ8u58VsbHiw31Bjq`. Verificat public: pornire în 2D, demo 39 obiecte, 3D redat, ambianță Studio, pas 5 cm, cameră Interior la 1,80 m și FOV vertical 60°. Captură live: `/Users/idris2024/.codex/visualizations/2026/10/21/01a15c65-7161-7d52-95fd-b9714f463978/gymbuilder-realism-live.png`.
