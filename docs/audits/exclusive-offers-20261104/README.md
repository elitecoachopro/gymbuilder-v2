# Exclusive Super price and daily product

Super price shows one product for exactly12hours, daily offer one for exactly24hours; weekly catalog selections retain their carousel. Fixed windows use a constant UTC cadence anchored at midnight+02. Summer-clock calendar days can be23/25hours; the display intervals remain exactly12/24hours. There is no summer-midnight/noon alignment promise. Reload/polling keeps the same deadlines for a stable published catalog. Catalog changes and publication withdrawal can alter eligibility.

Single cards show distinct duration badges, real remaining display time and next-selection labels for catalog items. Paid deadlines remain their stored booking windows. Expiry triggers a fresh API load. Catalog prices and currencies are preserved. Super price and daily catalog picks are distinct when at least2products exist; with at least3, consecutive Super windows alwayschange. Weekly still rotates.

The migration completes only alreadyelapsed Super pending/active periods by marking them expired, preserving every row and price, then adds the same half-open interval exclusion used by daily offers. Future/current periods are untouched. Production preflight found0upcoming and1historicaloverlap; normalization resolves that historical obstacle without deleting rows. Apply this migration alone in a transaction, not other pending mobile migrations.

175unit/10integrationtests,lint,typecheck andbuild passed. Unit checks cover exact windows acrossDST, stable deadlines, midnight changes and3/18/59product catalogs. SQL/APIchecks cover simultaneous reservation rejection, adjacent periods, paid duration,501weeklyrecords, published scopes andcurrentlyrunningunpaidSuperprivacy.

Rendered local check: a valid12-hour paid placement was seeded with35secondsremaining. Browser observed its31-secondcountdown, then withoutnavigation the real API refreshed and a catalog card replaced it. It kept1Super,1daily and12weeklycards. Fixture account was removed. Reload preserved product/deadline for the unchanged catalog.390px mobile documentwidth382. Physicalphone nottested.

Full review completed (20261104-exclusive-d029028c). The repeated-product andcurrentpendingtest findings were fixed. Real rendered expiry was verified; checked-in controlled-clock,unmount andfailed-boundary-recovery automation remains a deferred testing improvement.
