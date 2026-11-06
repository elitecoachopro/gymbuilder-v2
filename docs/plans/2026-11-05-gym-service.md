# Gym Service și Mentenanță

## Goal Capsule

Add a discoverable service-provider directory and registration path to Gym Builder, with editable services and coverage. Reuse supplier accounts, verification, approval, contact requests and monitoring. Existing equipment suppliers remain equipment suppliers by default.

## Decisions and scope

Use additive supplier-profile fields: business type (equipment/service/both), service categories, coverage and supported brands. New profiles remain pending; only approved profiles are public. Categories cover repairs, preventive maintenance, installation, relocation, upholstery and parts. Public login email remains private. Existing suppliers can add service information from their dashboard. No booking, payments, subscriptions or certification claims are added. Do not alter existing dirty email/contact/mobile files or publish unrelated local commits.

## Implementation Units

### U1. Data and validation

Add a non-destructive migration and shared strict validation. Preserve private-column exclusions and service-role-only public-directory access. Verify old profiles default to equipment, service details are required for service/both, and unknown fields cannot change account ownership/status/plan.

### U2. Registration and owner editing

Expose /register/service through the existing three-step supplier registration, with service fields and relevant verification guidance. Add /supplier/services and an authenticated owner-only API. Preserve email verification, pending approval and free activation. API integration tests must cover registration, owner isolation and malformed requests.

### U3. Discovery and connected journeys

Add /gym-service to navigation, homepage and footer; reuse the supplier directory, public profile and enquiry pipeline. Filter approved service/both profiles by category, area and search. Equipment catalog excludes service-only profiles. Show service details to admins reviewing applications and on the public profile. Keep Romanian/English copy complete.

### U4. Verification and delivery

Use a separate temporary Supabase project on non-conflicting ports. Test migration, real registration/storage, approval visibility, contact routing, owner editing and equipment regression. Check desktop and narrow-screen UI, run unit/integration checks, lint/typecheck/build and complete source review. Save work locally; no deployment or live data modifications in this request.

## Definition of Done

A service provider can register, verify email, be approved, edit their own service details and be found/contacted through the dedicated public directory. Pending profiles and private account data stay private. Existing client/equipment journeys continue to work. Evidence records which paths were tested and any untested limits.
