# Local WebGL recovery check

Run from repository root. Start the public asset server on 3121, then the fixture in another terminal:

```sh
python3 -m http.server 3121 --bind 127.0.0.1 --directory public
```

```sh
GYM_FIXTURE_PUBLIC="$PWD/public" node node_modules/next/dist/bin/next dev tests/browser --hostname 127.0.0.1 --port 3100
```

Open http://127.0.0.1:3100. The fixture imports the real StudioWorkbench and scene sources. Model and texture requests use the local static server on 3121; the treadmill has an isolated fixture endpoint for deliberate 404 checks. Stub endpoints keep saved fixture projects in process memory and return deterministic AI responses; no database or paid provider is used.

Load Demo 300, change the name and a position, choose 3D Economic, then press the fixture-only WebGL loss button. It requests the real WEBGL_lose_context extension, not a synthetic event. Confirm the editor switches to 2D with its recovery notice, retains 39objects and the changes, supports undo/redo, and allows manual 3D retry. Inspect browser errors after a cold 3D load to catch asynchronous model-placeholder cleanup regressions.

The fixture is under tests/, excluded by .vercelignore; it adds no production hook or application diagnostic endpoint. Stop the server and remove tests/browser/.next after the check. This manual integration fixture does not assert native desktop-process crash recovery.

## AI feedback and application regression check

The fixture AI endpoint returns `configured: true` and uses the real placement engine. In the AI tab, enter at least ten characters and generate:

- A brief containing `TEST_AUTH` returns 401: the error and sign-in continuation button must appear beside the generation button; the brief remains intact. Complete the authenticated handoff in the isolated full application, which provides the login route.
- `TEST_LIMIT` returns 429: the retry-later message must appear in the same result area.
- `TEST_QUESTION` returns a clarification: show it and instructions to update the brief; no apply button.
- Any other brief proposes two treadmills: focus and scroll to the proposal. Changing the brief disables applying the outdated result. Regenerate, then choose “Aplică și deschide în 3D”: two items must appear, 3D and whole-room view must activate, and focus and scroll must move to the scene. Undo must restore the preceding equipment arrangement.

Repeat at desktop and 375px mobile widths. Model/texture rewrites use a local static server on 3121 (`python3 -m http.server 3121 --bind 127.0.0.1 --directory public`). Stop only servers started for this check. Live verification uses an anonymous brief to confirm the real 401 UI; the successful AI proposal is tested in the isolated fixture, not through a paid live request.

For automatic partitions, set the room to 20 × 10 m and generate a brief containing `TEST_FULL`. The fixture replays the captured real-provider design in `tests/fixtures/gym-zoning-real-design.json` through the actual zoning engine. Verify the placed-object/zone/wall/door summary and the apply action above the collapsible AI explanation, then check 3D rooms, doors and zone colours on desktop and mobile. This fixture makes no paid call; authenticated real-provider validation is recorded separately in deployment notes.

## U1: whole-building history and local recovery

The fixture starts with synthetic owner `fixture-a`. Its A/B account buttons and logout button change only the local fixture session. The save-count control reads the in-memory API counter; it never contacts Supabase. Reset removes drafts only for `fixture-a`, `fixture-b` and `guest` on the fixture origin. Never use customer accounts as test owners.

1. Load the two-floor demo, edit the upper floor, switch to ground, then Undo/Redo. Both floors must survive and history must select the floor of the edit.
2. Edit the project name on the upper floor, wait for the successful local draft status, then reload. Choose Restore: name, both floors and active floor must return in 2D. Check the explicit-save counter before/after: restoration adds zero saves.
3. Switch A → B with A dirty, then return to A. Only A may offer A's draft; dismissing it and returning to B must not offer A's document. Logout must remove the signed-out owner's draft.
4. Edit, wait for persistence, Undo to the saved baseline, then reload or switch away/back. The abandoned dirty edit must not be offered. A clean checkpoint supersedes it.
5. Save explicitly, reload its returned project URL and verify the matching local draft is not offered. Later unsaved edits must still be recoverable.
6. Name B's project `TEST_DELAY · B`, Save and immediately switch to A. The fixture delays that POST response by 1500 ms. A must stay blank without B's name, project list or URL id after the response arrives.
7. Repeat the recovery dialog at 390 × 844. Record viewport testing separately from a physical phone.
8. Open economic 3D, request real WebGL loss and verify automatic 2D retains edits and usable Undo/Redo. Deliberate loss can produce renderer errors caught by the existing boundary; do not report a clean console without inspecting it.

Unit coverage exercises corrupt/version/owner rejection, ordered writes, failed-write preservation, clean-checkpoint filtering and bounded history. Storage quota failure in a real IndexedDB transaction and the visible retry flow are not yet browser-automated; the injected queue failure test is not equivalent to that integration case. Recovery only covers completed durable writes, not edits interrupted before their transaction commits.

## U2: precise partition walls and openings

Use the real editor's 2D plan. Select a partition wall or door/window directly (Enter/Space also select), or use the Edit buttons in the existing lists. The inspector below the plan offers metric numeric fields. Only changed position/length/width values snap to the configured grid; unchanged legacy off-grid values stay intact. Exterior contour walls are not moved by this tool.

- Move / resize enables geometry gestures; Select allows vertical touch scrolling and selection. Pan plan and its arrow/zoom/Fit controls change only the local view.
- Drag a wall to move it with its attached openings. Its round end handle adjusts length. Drag an opening along its wall; its round handle adjusts width. Numeric fields provide the alternative for precision and small targets.
- A red preview with an invalid-position message must leave geometry/history unchanged on release. Test a demo service wall through cardio, an opening beyond its wall and two overlapping openings.
- Check a valid numeric wall edit and a direct drag; unedited columns, stairs, areas, equipment, finishes, contour and inactive floor must remain unchanged. Undo/Redo must restore the edited floor.
- Remove a partition and verify its openings disappear in the same undoable action. Undo restores both; door/window removal is also undoable.
- Save/reload through the in-memory fixture API and compare wall positions/lengths, opening offsets/widths and equipment. Round-trip tests use the existing saved-configuration schema.
- Check desktop and 390 × 844, including numeric edits and zoom/pan without horizontal overflow. The fixture's English/Română buttons remount the editor under the actual LocaleProvider without changing browser cookies; restore the fixture draft after switching languages.
- Pointer cancellation, Escape, a second contact and stale source documents must discard the pending edit. Arm `Test gest: pointercancel`, `escape`, `wall`, `opening` or `equipment`, then make a real primary drag to a known valid position. The fixture injects the interruption through the actual SVG event handlers and reports PASS only when geometry and Undo availability stay unchanged. Confirm the same unarmed drag changes geometry, and check Undo returns directly to the preceding committed state. The second-contact events are synthetic; real simultaneous multi-touch still requires a physical-device check.

For a lightweight 3D regression, start a blank fixture project with one partition, adjust its X/length, open low 3D and request the real WebGL loss. Verify the same values remain in 2D and Undo still works. This check does not require loading the equipment catalog models.

`Test select-touch` sends primary touch down/move/cancel/up through all selectable objects while Select is active. It checks that touch down does not prevent default scrolling and that geometry remains identical. This is synthetic event coverage, not a browser-native scrolling gesture or a physical phone test. Zoom/arrow/pan checks compare SVG geometry separately from viewBox changes.

## U3: equipment evidence and estimated usage outlines

Run the local asset server on 3121 as above. `GYM_FIXTURE_PUBLIC` supplies only public fixture assets; no environment file or customer database is loaded. The fixture API stores synthetic projects in process memory, survives development module recompilation, and loses them when its server process stops.

1. Equipment → View pilot in 3D. Inspect each of the ten models in Economic using the close-up selector. Compare the measured/copyright evidence and physical footprint with the manifest; these are unbranded assets, not manufacturer-certified products.
2. Select the treadmill in 2D. Toggle Estimated usage space: no document edit or history entry. Move X to 4.2 at Y=2.5: advisory equipment overlap may warn, but placement succeeds. X=5.5 must fail physical collision and preserve the previous polygon. At 90 degrees, physical bounds are 0.89 × 1.95 m and estimated bounds 2.09 × 3.95 m.
3. Use Simulează lipsa modelului benzii, switch 2D → 3D and focus the selected treadmill. Its URL deliberately returns 404; confirm the unavailable-model placeholder and unchanged selection. Return to 2D, verify the footprint, save explicitly and reopen the returned project URL. ID, position and rotation must survive. Restore the GLB with the fixture control, switch 2D → 3D and confirm it loads. A page reload resets the button label, so set missing then restore to establish a known server state.
4. Add an ordinary Yoga Mat: inspector must say usage space is unknown and draw no estimated outline. Undo its addition.
5. Repeat overlay and inspector checks at 390 × 844 and in English. Request real WebGL context loss with an edited pilot selected: automatic 2D must preserve the geometry and usable Undo/Redo.

Expected deliberate 404/context-loss console errors must be distinguished from unrelated errors. Viewport testing does not establish physical-phone performance or native touch behavior. Offline GLB audit: `GYM_GLTF_TOOLS=/path/to/node_modules node --experimental-strip-types scripts/audit-gym-pilot.mjs`; normal publication gate runs automatically with `npm run build`.

## U4: materials, lighting and renderer measurements

`Citește măsurătorile 3D` reads the active R3F renderer's actual counters through its exported `_roots` registry: calls/triangles, GPU geometries/textures, unique materials in the active scene, shader programs, lights, exposure, shadow state, DPR and canvas size. It does not patch or alter the renderer. JSON wraps on narrow screens. This exists only in the excluded fixture, not production.

1. Load Demo 300 (39 items), choose Economic and Daylight. Fit the whole room, allow the assets to render, then read counters. Compare identical views and warmed state before/after; reference result 641 draws / 308474 triangles / 271 geometries / 92 textures / 258 scene materials. Counts may differ with selection labels, camera culling, interior ceiling and cold upload state.
2. Inspect the leg press, spinning bike and treadmill controls at close range in Daylight/Studio; also check Evening. Retain saved colours and footprint dimensions. Photograph the same Focus/Fit view when comparing.
3. Toggle Automatic clarity then Economic; verify frame/upholstery/wall colours and flooring. Repeat 2D→3D three times after warming and compare resource counters.
4. Save the 300 m² fixture project before loading the two-floor demo. Repeat Upper→Ground three times. Compare each floor with itself after warming; counts must not grow progressively. Reopen the saved 300 m² project and confirm materials/lighting.
5. At 390 × 844, inspect the interior and navigation with no horizontal overflow. Edit the name and lighting, request real WebGL context loss, confirm 2D preserves 39 items and finishes, check Undo/Redo, then retry Economic 3D. Deliberate loss may log a caught renderer error; report it rather than claiming a clean console.

Viewport/resource-counter checks do not establish physical-phone FPS, battery or thermal behavior. Stop only fixture servers started for the check and reset test drafts/viewport afterward.

## U5: spatial AI preview and explicit application

Use `Scenariu AI cu două niveluri` to seed a synthetic saved project through the in-memory fixture API: ground floor 20 × 15 m, upper floor 10 × 10 m, €10,000 total cap, one ground-floor spinning bike (€1,100), one upstairs treadmill (€3,500), a column and stairs downstairs. The seed itself increments the fixture save counter. These are test records; no production data or paid AI is used.

1. Edit the name and add a column without saving. Generate on the ground floor. The real request preparation reserves upstairs €3,500 and gives the proposal €6,500. Only one of the two requested treadmills fits that budget; the other must show a budget omission. Current columns/stairs remain in the proposed plan.
2. After the local-draft confirmation, use `Capturează ciorna AI`, then open `Previzualizează planul 2D`. Pan/zoom/select in this read-only view; Move / resize is disabled. Close and use `Compară ciorna AI`: `baselineEqual: true`; no explicit save has occurred. Preview camera and selection are local UI state only.
3. The preview explains full active-floor replacement, per-model old → proposed counts, available budget and omissions. Apply is inside the preview dialog. One Apply restores the prior equipment through one Undo; Redo reapplies. An identical proposal is a no-op and adds no history entry.
4. Change the name or requirements after generating. The old preview remains inspectable, but Apply must be disabled with a regenerate message. A floor switch clears the old review; generate again for the selected floor. At the initial upper floor, the available budget is €8,900 after reserving the ground bike. If the ground bike has already been replaced by a treadmill, the upper-floor cap becomes €6,500.
5. In Economic 3D, request real WebGL loss. Generate or use an existing valid proposal, open the preview and choose `Aplică în 2D`. It must stay in 2D with the recovery notice and unchanged inactive floor. Only an explicit 3D button retries rendering. Repeat at 390 × 844 in Romanian and English, including scrolling the dialog to its Apply button; no horizontal overflow.
6. `TEST_FAIL` simulates HTTP 502, `TEST_TIMEOUT` HTTP 504, `TEST_MISSING` a response missing height, and `TEST_INVALID` a physically invalid item. Each must preserve the project and prohibit applying the invalid response. The timeout fixture checks the HTTP error path; it does not wait 45/55 seconds for a real network timeout. `TEST_AUTH`, `TEST_LIMIT` and `TEST_QUESTION` retain their earlier meanings.
7. Save explicitly, reload and check both floors, columns, stairs and budget; restore an unsaved local draft separately. Neither generation nor preview nor Apply automatically saves to the server.

`Capturează/Compară ciorna AI` read only synthetic IndexedDB drafts for the fixture account and report selected document fields. Wait for the normal draft confirmation before comparing. Differences in a deliberately edited brief/name count as document changes. The controls are excluded from production along with the rest of `tests/`.

## U6: persistence, recovery and low-power qualification

The persistence controls only affect the isolated fixture. Keep the fixture API's account and the client account aligned when checking drafts: select account A or B explicitly; after reload the fixture resolves its identity from the server cookie before mounting the editor. Expiring the server session deliberately retains the open editor until reload, so its 401 save behavior can be tested.

1. Seed the two-floor AI scenario or load Demo 2 levels. Save, move an upstairs machine, change finishes on each floor, then save and reload. Use `Inspectează persistența U6` to compare the complete saved and draft objects; verify the downstairs geometry remains unchanged. Export JSON and verify both floors and optional fields.
2. Make an upstairs edit, wait for the durable draft message, then reload and explicitly recover it. Check the active floor, downstairs geometry and explicit-save count. Recovery must not save to the server.
3. Arm `Salvare eșuată 500`, `Salvare refuzată 404` or `Expiră sesiunea serverului`, then Save. The current project remains editable. Restore session A before continuing. A different account must not receive A's local draft. Reload under B and check that both draft inspection and project listing still identify B.
4. `Întârzie salvarea` permits an edit after Save starts; the later edit must remain a recoverable unsaved change after the earlier save completes. Restore the normal fixture configuration afterward.
5. Arm `Eroare scriere ciornă`, make an edit, and verify the storage warning. The prior durable draft must survive. `Restaurează grafica și stocarea` restores the original IndexedDB method; another edit can be persisted.
6. Starting in 2D, arm missing WebGL or renderer creation error, then explicitly open 3D. Verify usable 2D, the recovery notice and unchanged history. Restore graphics before a retry. Separately request actual context loss from an open 3D scene and repeat the history check.
7. In the 300 m² room, confirm the initial profile is Economic. Run `Tur economic 60 secunde` and separately `Măsoară idle 5 secunde`. Record browser, viewport, DPR, shadows and frame counts from the status output. An idle interval with only settling frames is not an FPS benchmark.

Repeat the reachable controls at 390 × 844 and landscape in RO/EN. Report viewport/synthetic-touch coverage separately from physical iPhone/Android checks. Restore overridden methods, clear only test drafts, reset the viewport and stop only the fixture processes started for this run.

## Request chat failures and overlapping operations

The isolated fixture at `/chat-check` renders the real shared RequestChat with memory-only messages. Its API routes under tests/browser are excluded from deployment and never contact Supabase or email providers.

- Toggle failGet and choose Reload messages: show a loading error, not a successful empty conversation. Toggle it off and reload to recover.
- Type a message, toggle failPost, then Send: show the error and retain the text. Toggle failPost off and retry: append one returned message and clear the composer.
- Toggle slowPost and Send: Send and Reload must remain disabled while pending. After success, reload and confirm the message remains exactly once.

For full integration tests against `next start`, the loopback-only test server must explicitly use `TRUSTED_PROXY_IP_HEADER=x-forwarded-for`, matching the simulated client IP headers emitted by tests/integration/helpers.mjs. This is a test-proxy configuration, never an automatic production setting. Without a trusted proxy header, production intentionally aggregates untrusted requests and the rapid fixture suite reaches its real rate limits. Keep external email, payment and live AI credentials disabled in this isolated server.
