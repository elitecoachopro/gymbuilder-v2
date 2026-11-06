# Email and web promotion payments — 6 November 2026

Baseline430b25c. Existing mobile SQL WIP is excluded. Concurrent changes to studio/3D files observed after start are also excluded. Owner has a Stripe account for Imperial Gym only and will create a separate Gym Builder account. Never reuse the Imperial Gym account or its keys. Automatic charging stays disabled until Gym Builder account, webhook and end-to-end provider tests are available.

Current owned-mailbox result: the11:49livechat notification reached Spam. Existing Resend ticket still has the6Nov00:07reply: authentication verified, no Resend restriction, Forge not routing yet, no further DNS setup or ETA; Microsoft reputation remains an external constraint. Template hygiene is a controlled improvement, not evidence of Inbox placement.

Scope: confirmation/reset/welcome/approval/chat transactional email payloads; official Stripe SDK; service-role-only weborder ledger and reservation/fulfilment RPCs; signed webhook validation and verified server receipts; three authoritative EUR tariffs; supplier UI with product selection, status and manual fallback. New billing schema must be isolated-tested before applying in production. Test-mode purchases never enter the public promotion view.

Important failure states: duplicate events cannot extend promotions; cancellation/unpaid callbacks cannot activate; full refunds expire the placement, including refund-before-completion event ordering; paid events whose product or exclusive slot is no longer available persist needs_review for operator resolution rather than silently losing payment or activating another seller's product. No automatic refund transaction is introduced.

A real Stripe sandbox/production checkout cannot be certified without the new account. Public billing remains feature-gated until that check is completed.
