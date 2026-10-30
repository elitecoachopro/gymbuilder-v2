# Clickable product photos and 360° viewer

Product photos open a modal from the main catalog, product detail page and supplier catalog. Product names remain links to the detail page. The shared ProductPhoto component loads rotation data on demand from the public product endpoint; the detail page supplies its already-loaded frames.

With at least 12 supplier-provided rotation frames, the dialog opens in 360° mode and starts playback after preload. Users can pause/resume, drag, use previous/next buttons or arrow keys, and switch to ordinary photos. Automatic playback respects reduced-motion preferences and pauses when the tab is hidden or the rotation area receives keyboard focus. Failed images are excluded. Escape and the close button dismiss the native dialog and restore focus.

Ordinary catalog photos are not a rotation sequence. Products without rotation frames open an enlarged photo gallery and explicitly explain that 360° is unavailable. No synthetic views or test frames were added to production.

Validation: lint, TypeScript and production build passed. Browser checks covered an ordinary second-hand listing; a disposable local-only 12-frame test fixture confirmed automatic frame changes, pause, next-frame control, keyboard advance, gallery switching, supplier-catalog launch and Escape. The local fixture used a repeated photo with distinct test frame URLs to verify behavior, not actual equipment geometry, and was deleted after verification.

Published to https://www.gymbuilder.app on 21 October 2026: dpl_DNgojjGNsGK4u3XCENnMztv8SJEK. Remote build and promotion succeeded. Public browser verified photo-modal launch from the used-equipment catalog. No production database changes were required for this update.
