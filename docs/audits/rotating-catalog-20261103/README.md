# Rotating homepage catalog selections

Super price, Offer of the day and Offers of the week display existing published catalog products when their paid placement section is empty. Paid placements and reserved daily slot semantics retain priority. No promotions, discounts, prices, invoices or supplier records are fabricated or written to production.

Manufacturer queues are balanced round-robin, with a deterministic daily offset in Europe/Bucharest. Up to12 items per section have stable product links and published original currencies; quote-only products retain that status. Catalog cards have a distinct label and no paid countdown/expiry claim. All three carousels share navigation, pause, focus/reduced-motion handling and viewport-only six-second rotation. Existing fonts, location under the buying steps and configurator are unchanged.

## Verification

174 unit tests,8 promotion integration tests, typecheck, lint and production build passed. The integration test confirms catalog cards match actual published database rows and exclude pending suppliers/inactive products; existing paid durations, daily exclusivity,501 weekly entries and quote-only prices remain covered.

An isolated local HTTP proxy deliberately returned503 for only the catalog dependency while a real local paid placement was present. The frozen pre-fix route returned503; the final route returned200 with that paid placement, slot data and catalogUnavailable=true. The fixture was removed; no database schema was altered. Tests used no live email, payment or AI credentials.

Browser checks exercised EN/RO, three12-card sections, automatic movement while visible, manual next pausing playback, pause retaining its scroll position over7seconds and390px mobile layout without horizontal overflow. No physical phone or browser reduced-motion override was used.

## Review

Full review completed (`20261103-120501-aa00e435`) with8 lenses and an independent validator. Catalog dependency failure isolation was fixed and its source delta reviewed again. Reuse/quality simplification unified the response type and renamed the former grid; efficiency/test-value passes had no findings. Proof tests were retained.

Deferred P2 testing improvement: a checked-in automated rendered lifecycle/reduced-motion regression suite (controlled intersection/time and unmount cleanup). This is a coverage gap, not a demonstrated runtime defect; rendered manual checks were completed using the supported browser tool. No extra browser test dependencies were introduced for this presentation change.
