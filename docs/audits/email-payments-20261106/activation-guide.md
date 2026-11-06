# Activating Gym Builder web promotion payments

Automatic charging is deliberately off. Do not use the Imperial Gym Stripe account.

1. Create and verify the separate Gym Builder Stripe account and its business/bank details. Confirm the applicable tax and refund settings before charging.
2. Use a separate preview database for sandbox testing. Apply `20261106000100_web_promotion_payments.sql` there. Test exclusive slots share promotion constraints and must never occupy production placements.
3. Configure `WEB_PROMOTION_PAYMENTS_MODE=test`, `STRIPE_SECRET_KEY`, `GYM_BUILDER_STRIPE_ACCOUNT_ID`, `STRIPE_WEBHOOK_SECRET`, `WEB_PROMOTION_TEST_USERS` and `WEB_PROMOTION_PAYMENTS_ENABLED=true` only in that isolated environment. Never paste keys into chat.
4. Configure the Stripe endpoint `/api/promotions/payments/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, and `charge.refunded`.
5. Complete a real Stripe sandbox Checkout, refresh/replay its webhook, cancel a checkout and fully refund a sandbox payment. Verify ownership, all three durations, public live-only visibility, supplier status, and the admin exception queue. Local processor simulation does not replace these checks.
6. After provider tests pass, apply the additive production migration, configure the dedicated live account and live webhook secrets, and enable live mode. Check a controlled owner-approved live payment and refund. Existing manual promotion requests remain available.

Tariffs: Super preț12EUR/12h; Oferta zilei20EUR/24h; Ofertele săptămânii10EUR/168h. Periods start at verified activation, not at checkout creation. Paid activation exceptions remain in the administrator queue; review/refund in the dedicated Stripe account, whose full-refund webhook revokes the placement.

Email delivery is not guaranteed by an accepted API request. Record the initial Inbox/Spam placement in the owned mailbox before moving a message. No further DNS changes are justified by the current Resend response.
