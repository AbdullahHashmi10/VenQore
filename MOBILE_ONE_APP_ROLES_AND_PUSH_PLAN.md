# VenQore one app: roles, entry flow and rider push (small plan)

> SUPERSEDED on 2026-10-16 by `MOBILE_APP_DELIVERY_AND_ORDER_CHANGES_MASTER_PLAN.md`. Read that file instead.

Date: 2026-10-16
Status: Plan only. Nothing here is built. Companion to `app-code/mobile-app/COMBINED_APP_TECHNICAL_PLAN.md` (read it first; this file narrows it and adds roles and push).
Rule: do NOT start this before the first paying customers ask for it. Ship in the order below and stop after any phase.

## Decisions (already made)
1. ONE Flutter app, ONE Play Store listing. No separate rider app.
2. Rider is a ROLE, not a mode. Role decides the home screen after sign-in.
3. Roles are assigned by the store owner. A user can never pick "I am a rider" for themselves.
4. Customers can browse without signing in. Sign-in is asked at checkout.
5. Signing out is required to move between Customer and Business (as in the combined plan). A one-tap switch is a later option, not v1.

## Entry screen (first launch)
Three big cards, Duolingo-style:
- Order from stores  -> customer shop (no sign-in to browse)
- I work at a store  -> sign in -> role-based home (staff / manager / rider)
- Run my business    -> sign in or sign up -> existing create-store flow

Remember the last choice; show a clear "Change" entry in settings that signs out first.

## Role-based home after Business sign-in
| Role | Home |
|---|---|
| Owner / admin / manager | Business dashboard (restricted WebView of approved pages, per combined plan) |
| Cashier / waiter | POS or FOH screen, filtered by permissions |
| Rider | "My rides": assigned orders, step buttons (picked up / out / delivered), call customer, open map |

Rider home reuses what exists: `RiderPortalController::mine` / `mineStep` (`/my-rides`, permission `online.rider_deliveries`) and the personal link `/rider/{token}`. Do not rewrite the logic; wrap it first (WebView), go native later.

## Customer to business conversion
- Customer profile gets "Start my business". It opens the EXISTING create flow (`resources/js/Pages/Store/CreateOrJoin.jsx`, `StoreProvisioner`, billing via Lemon Squeezy). Do not build a second path.
- "Join a store" uses the owner's join code (`Pages/Store/Join.jsx`). After joining, show the role the owner assigned. If no role yet: "Waiting for the owner to give you a role".
- One person identity (email or phone) can hold: customer profile, staff/rider membership at store X, owner of store Y.

## Customer account (gap to fill)
Verified today: customer login/OTP and "my orders" exist PER STORE only (`routes/commerce.php`: `/shop/{slug}/customer/*`). There is no marketplace-wide customer account.
- Add one global customer identity and a "My orders" screen that lists orders across stores.
- Keep per-store sessions working; link them to the global identity by verified phone/email.
- Verify first (do not assume): how `commerce_customers` / customer sessions are stored before designing the table.

## Rider push notifications (FCM)
Server:
- New table `device_tokens`: id, user_id (or rider account id), tenant_id, platform, token (unique), last_seen_at, revoked_at.
- Endpoints: register token after sign-in, refresh token, delete token on sign-out. All authenticated and tenant-scoped.
- Find the ONE place a delivery is assigned to a rider (check `DeliveryService`, `DeliveryController`, `TableServiceController` rider assignment) and call a single `NotifyRider` service there. Do not scatter send calls.
- Payload: order number, pickup name, drop-off area, cash to collect. No full address in the push text on the lock screen.
- Send through FCM HTTP v1 with a service account kept in server env, never in the app or repo.
- Failures must not break assignment: queue the send, log the result, retry once.
Flutter:
- Add `firebase_core` and `firebase_messaging` (today `pubspec.yaml` has only `webview_flutter`).
- Ask notification permission with a plain-language reason when a rider first signs in (Android 13+ needs the runtime permission).
- Foreground and background taps open "My rides" on the right order.
Interim (ships before the app): when an order is assigned, offer a WhatsApp click-to-send with the rider's personal link. No app needed.

## Phases
1. Entry screen + role-based home + Rider "My rides" in WebView. Acceptance: a rider account lands on My rides and can step an order to delivered; a cashier cannot see rider screens; an owner sees the dashboard.
2. Push for riders. Acceptance: assign an order, the phone buzzes within seconds with the app closed; tapping opens that order; signing out stops pushes to that phone.
3. Global customer account + cross-store orders. Acceptance: one sign-in shows orders from two different stores.
4. Customer to owner conversion + join-with-code showing the assigned role.
5. Play Store: closed-test requirement (check the CURRENT Play Console rules for new developer accounts), privacy policy, Data Safety form (declare notifications, location if used), screenshots. Riders and pilot users use the direct APK until the listing is live.

## Rules for the agent
- Point, never copy: roles come from the existing permission keys (`config/permissions.php`, `permission_inherits.json`); do not add a parallel roles list.
- Every new write route needs `permission:` middleware (see CLAUDE.md); every tenant-owned id is store-scoped.
- No claim in the app, store listing or marketing that the build cannot back. Push is "coming" until phase 2 passes on a real phone.
- Verify by reading the files you changed. Report which Android version and device each acceptance test ran on.
