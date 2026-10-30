# GymBuilder Space Editor

Implemented locally on 23 October 2026. Main route: `/configurator`; alias: `/configurator/studio`. Previous editor and its saved projects remain accessible at `/configurator/classic`.

## Document and persistence

The existing version-1 configuration JSON gains an optional `space` document (itself version 1). No database migration or production operation is required. The existing owner-scoped project endpoint stores it in `gym_projects.configuration`; architecture-editor projects have an empty legacy `zones` array. The dedicated server validation branch checks polygon area and bounding dimensions against the project columns and validates the nested document. Legacy projects retain their previous validation path.

The space document stores an orthogonal polygon in metres, partition walls, wall-relative doors/windows, columns, activity areas, equipment instances and finishes. Equipment positions are centre coordinates; rotation is clockwise in plan coordinates. Room presets support rectangle and L shape. Imported orthogonal outlines preserve their topology when resizing. Openings use the minimum X/Y coordinate of their referenced wall as the offset origin.

The validator checks schema limits, unique identifiers, simple orthogonal outline, architectural bounds, opening bounds and overlap, equipment footprint collision, door clearance reservations, catalog height and indicative equipment budget. Equipment uses oriented footprints and separating-axis collision checks; it cannot overlap columns, walls or another apparatus. The door reservation is 0.9 metres on each side of the opening and is a conceptual rule, not an evacuation certification.

## Editor and demonstration

- 2D SVG plan and 3D Three.js scene share the same metre-based document.
- Numeric position and rotation, movement buttons, 2D pointer dragging, 3D translation controls, duplication, removal, undo/redo (50 snapshots).
- Architecture controls, category/search library, floor/wall/frame/upholstery finishes, cutaway walls and perspective/top/interior camera presets.
- Demonstration: 20 × 15 × 3.5 m, 300 m², 39 objects with an indicative equipment total of EUR 54,680. Reception, changing facilities, cardio, strength, free weights, functional and stretching areas. The demonstration has no equipment spending cap.
- The initial visual follow-up supplied locally authored standard models for the original 25 catalog entries. Cardio machines have distinct frames, transmissions, consoles and pedals; strength machines have weight stacks, cables, pulleys and adjustment details. Metal, rubber, upholstery, wood, glass and ceramic use separate physical materials. Those original models are procedural standard models. The subsequent CAD import adds seven separate entries, documented below.
- The 300 m² demonstration now uses a deliberately arranged layout, with 39 objects and the same EUR 54,680 indicative total. An entrance serves reception, with separate locker groups, cardio rows, strength equipment, free weights, functional turf and stretching. Existing doorway clearance validation is retained.
- The scene uses locally generated floor textures, area-based finishes and signage, plinths, framed openings, a brand panel and procedural environment lighting. Areas provide the visual floor treatments when the global flooring is rubber; selecting wood or concrete applies the chosen global finish instead. No HDRI, remote font or texture download is required by the scene.
- Fullscreen presentation is available for 2D/3D. The fullscreen subtree retains its own object inspector on desktop; the native Escape key exits fullscreen. The whole-room camera framing is closer, while perspective/top/interior controls remain available.
- PNG scene capture, text equipment schedule, validated JSON export/import and an in-app presentation preview containing a plan, optional 3D image, equipment table and requirements. PDF uses the browser print dialog; it is not a server PDF generator.

## AI

The existing authenticated OpenAI endpoint accepts the optional space document. A request sends the brief and fixed architecture (not account data or existing item history) to the configured model. The model returns catalog selections and quantities. The placement engine preserves architecture, accounts for obstructions and area assignments, and reports unplaced quantities with height/budget/space reasons. It does not generate architecture or certified operating clearances.

Proposals are previews, applied explicitly, and become stale after document edits. Applying replaces equipment; undo restores the previous document. Geometry validation occurs after the per-user rate gate. Existing credentials, provider configuration and the five-request/hour quota remain in force. Three live provider calls were verified on 23 October 2026: Romanian 300 m², English L-shaped 275 m² with restrictive height/budget, and a Romanian browser flow for 275 m². Generated projects survived authenticated saving and reopening.

## Local checks and limitations

TypeScript, full-project ESLint and production compilation passed. Earlier browser inspection covered the demonstration in 3D and 2D, object selection/inspector and the phone-width layout (390 × 844 viewport override; document content did not exceed client width). Unauthenticated saving returned the sign-in message without losing the plan. The authenticated follow-up verified create/update/reopen, ownership isolation, invalid-document rejection, rectangle/L geometry, AI preview/apply/undo/redo/save/reload and preservation of requirements and budget. Saving and switching projects now synchronize the URL identifier; starting a new document removes it. AI item identifiers avoid architecture identifiers.

The follow-up passed 39 unit tests and 87 integration tests. Two opt-in live-provider cases were skipped in the ordinary integration suite and passed separately. All integration fixtures and live AI persistence checks used a separate local Supabase installation. See [verification report](audits/space-editor-verification-20261023.md) for evidence and limitations.

The app was not deployed, and existing database data was not changed. This is a functional standard-model editor; visual parity with DHZ, supplier-specific CAD/GLB assets, animated people, video tours, VR, technical building-services design and certified safety checks are not established by this work. Mobile inspection used an emulated viewport, not a physical device. Model fidelity and performance on dense projects need further acceptance work.

## 3D appearance follow-up

The local visual follow-up passed TypeScript, ESLint and a production build. Browser inspection covered the final production scene, fullscreen object selection/inspector, perspective and interior views, 2D/3D switching, and a 390 × 844 viewport with no horizontal overflow. No console errors were captured in the inspected final tab. The demo passed the editor's geometry validation before the expected unauthenticated save response. Automated test suites and real AI calls were not rerun for this visual-only follow-up. Earlier persistence/AI evidence remains documented above; this work did not change their API or stored document format.

Shared equipment geometries and materials reduce duplicated graphics resources. Floor extrusion settings are stable across unrelated renders, and hidden area finishes are unmounted. These changes were reviewed for reuse, quality and efficiency; no frame-rate or physical-device performance benchmark is claimed.

The dedicated six-lens code review completed against an isolated snapshot of this follow-up. Its one confirmed P2 finding (desktop fullscreen hid the object inspector) was fixed afterward in the primary checkout by making the internal inspector visible when expanded. The final production build and a fullscreen equipment selection confirmed the heading, position/rotation controls, duplication and removal controls were accessible. See [original review receipt](audits/studio-evidence/realism-review-20261023.json); its snapshot deliberately retains that original finding. Rendered world bounds versus every catalog dimension and fullscreen rejection paths were not exhaustively measured in this follow-up.

- [Updated overview](audits/studio-evidence/realism-300-overview-20261023.jpg)
- [Updated interior](audits/studio-evidence/realism-300-interior-20261023.jpg)


## Imported CAD follow-up

Seven unbranded Innerscene CAD models, published under CC0, are now included as local GLB assets alongside their original STEP sources. The catalog contains 32 entries; original identifiers and dimensions remain available for saved projects. The demonstration places 14 imported apparatus instances while retaining 39 total objects and its EUR 54,680 indicative allowance. Rack and dumbbell positions account for the actual imported footprints.

The inspector exposes the original source, license, GLB and STEP downloads. Frame/upholstery finishes recolor designated materials without changing source geometry. Both the space editor and classic renderer support the imported variants. Default automatic zone recipes retain the original selections to avoid duplicating variants; the AI catalog also exposes the CAD identifiers. No new provider calls or authenticated persistence checks were made during this asset follow-up.

See [CAD integration details and sources](audits/cad-equipment-integration-20261023.md). These are downloaded generic CAD models, not official DHZ/manufacturer product files. Visual parity with DHZ is not claimed.

## Material and mobile update · 2026-10-24

- Shared 64×64 roughness textures distinguish painted frames, brushed metal, rubber and upholstery. CAD mounts and cushion surfaces are classified independently. A 256×128 static console illustration is decorative, not equipment telemetry. All resources are local and disposed with the scene; cached source GLTF materials and geometry stay untouched.
- Economic uses a local static 256×128 reflection texture plus one instanced equipment contact-shadow pass. DPR 1, antialiasing off, demand rendering and no real-time shadows remain unchanged. Standard retains its existing environment lights.
- Mobile scene precedes editing tools. Rotate/Pan, zoom and Fit room controls are explicit, with 44px touch targets and 8px gaps. One finger follows the selected mode; two fingers zoom and pan.
- GLBs now include planar TEXCOORD_0. Reproduce conversion using `scripts/import-gym-cad.mjs` then `node scripts/enrich-gym-uvs.mjs`; this second script is idempotent. The original geometry bytes, units, catalog identifiers and persisted document shape are preserved. See `audits/studio-evidence/polish-glb-validation-20261024.json`.

## Detailed equipment and interior · 2026-10-24

Authored `aparat_piept`, `aparat_lat` and `aparat_picioare` now use merged assemblies from `src/lib/gym-strength-model.ts`: seven finish meshes per instance, contoured seat/back pads, weight stacks, cable/pulley hardware, pivots, handles and decorative equipment cards. IDs, dimensions, prices and serialized projects retain their existing contracts. CAD GLBs remain unchanged.

Interior view (with cutaway disabled) adds a ceiling following the room outline and instanced static light housings/diffusers. Orbit/top views retain the open plan. These fixtures do not add actual lights, shadow passes or postprocessing. Profile defaults and recovery handlers remain unchanged. Full verification and limitations: `audits/configurator-detail-20261024.md`.
