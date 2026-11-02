# Detailed Gym Builder activity report

Private `/statistici` for administrators and suppliers, with 1/7/30/90-day filters, Bucharest hourly/daily charts, fixed traffic-source categories and latest 20 events. Suppliers can access only their own profile and product data. Contact clicks are separate from persisted enquiries and projects. English and Romanian; existing typography and configurator behavior unchanged.

## Compatibility and release

The current live baseline is PR4 (`7c9600c`), which already uses `traffic_views` and lifetime product-session counters. One collector calls the detailed event RPC; views enter that existing table once, with metadata keyed by environment/event UUID. Report totals read canonical `traffic_views`, preserving earlier views with unknown source. Test/preview traffic stays isolated. Production views also mirror the earlier daily `page_views` report without another insertion into product history.

`20261102000099_legacy_page_views.sql` retains the earlier manually deployed schema for fresh databases. Do not blindly replay it on an existing database. Production must already contain `page_views`, `record_public_page_view` and `gymbuilder_traffic_summary`; inspect explicitly, then apply only migration `20261102000200` in a transaction. No other pending mobile migration belongs to this release.

## Verification

167 unit tests and 18 scoped integration tests passed. Lint and typecheck passed. Tests cover retry deduplication, revisits, supplier isolation, source validation, consent, anonymous access, Bucharest midnight for all four periods, repeated DST hour, persisted project outcomes, production/preview separation and compatibility with lifetime/daily histories. Full review `20261102-detail-ca954a01` plus incremental reconciliation review completed; findings were fixed and checked. Mobile width 390 and desktop were inspected in the browser in Romanian/English; physical phone and authenticated production usage remain unverified.

No production test accounts or messages were created. Temporary local fixtures are removed after verification. Source files unrelated to analytics (existing email sender and mobile billing work) are excluded from commits.
