# VenQore Mobile 1.1.5 (build 7)

**Date:** 2026-10-16
**Artifact:** `VenQore-Mobile-1.1.5-build7.apk`
**Size:** 50,981,591 bytes (48.6 MB)
**SHA256:** `A1B8F9CFFB4BD27587EF512E55C425D96796E8E156BB114A1F76D36F0D14DCDF`

Read, built and unit-tested. **Not yet run on a real phone or against the live server**; see "Not verified" below before publishing.

## Corrections to the 1.1.4 notes (`RELEASE_NOTES_1.1.4.md`)

The 1.1.4 notes described things the build did not do. Fixed in 1.1.5:

| 1.1.4 note said | What was true | 1.1.5 |
|---|---|---|
| Sign-in form with email and password | The form checked the fields, then opened the website login and **threw away what was typed** | The typed email and password are handed to the website sign-in page once, which submits them. Nothing is stored on the phone |
| "Staff / POS PIN" tab: store code + PIN | The route it opened is the **VenQore internal-staff portal** (email + password). The store code and PIN were never used | Tab removed. One form for every role. "Use a cashier PIN" opens the real PIN pad on the sign-in page |
| Register: business name and trade chips | The website register form has no such fields; they were discarded, and the password was too | Native form asks only name, email, password and the terms, and hands them to the register page |
| "Continue with Google ... clean user-agent" | Opened Google in a web view with a spoofed browser identity. Google forbids this and it can stop working at any time | Uses the Google accounts on the phone (account picker). See Google setup below |
| Rider alert (`RiderNotifier`) | Wrote to columns that do not exist (`rider_id`, `token`); every call failed silently | Rewritten against the real tables. Tested |
| Kitchen "[CHANGED]" docket | The "as sent" snapshot was lost on every save, so a changed note was never detected | Kept on the server across saves. Covered by tests |

## What changed

### App
- Welcome: three entry cards (Order from stores / I work at a store / Run my business). Nobody is asked whether they are an owner or an employee.
- Sign-in and register rebuilt in the V6 style with staggered entrance motion, press feedback, 20 px margins, inline error banners, large-text safe layouts.
- Google: the real four-colour G; native account picker; falls back to the browser flow when native sign-in is not set up or the email needs linking.
- Riders land on My rides (server routing) and no longer see the Dashboard / Sales / POS tabs.
- Removed three unused screens that still asked "owner or employee".
- Splash, 3D orb and AI builder screens from 1.1.4 kept.

### Server (needs deploying with this app)
- Native Google sign-in: `POST /api/mobile/auth/google` (verifies the Google ID token, one-time 60-second ticket), `GET /api/mobile/config`, `GET /auth/native-ticket/{ticket}`.
- Rider alerts: one `RiderNotifier` for the online store and the restaurant floor. WhatsApp share link (store country code from the `country_calling_code` setting; no guessing), browser push, previous rider told on reassignment. Deliveries page shows "Send to rider on WhatsApp" after assigning.
- Browser/web-app push alerts for riders: switch on the rider page, service worker `push` + `notificationclick`, subscriptions table, only known push services accepted.
- **Rider page fixed**: `/rider/{token}` and My rides threw an error on every load at HEAD (a closure missing `use ($dayStart)`).
- Kitchen: a changed note or modifiers on an already-sent line now prints one `[CHANGED]` line (`WAS: ... -> NOW: ...`); extra quantity goes as a separate new line; the Fire button counts changed lines.

## To switch on (nothing below is done by the build)

1. **Web push**: on the server run `php artisan webpush:keys`, put the three `WEBPUSH_VAPID_*` lines in `.env`, `php artisan migrate`, and deploy `vendor/` (new package `minishlink/web-push`). Without keys push is simply off.
2. **Native Google**: needs `GOOGLE_CLIENT_ID` on the server (already used by the web sign-in) **and** an *Android* OAuth client in the same Google Cloud project for package `com.example.amd_erp_mobile` with the SHA-1 of the key that signs the APK (see the signing note below). Until then the button falls back to the browser flow.
3. Run `php artisan config:clear` after changing `.env`.

## Not verified (do before publishing)

- No real phone, no Android emulator and no live-server run in this session. Everything above is unit/feature tested only.
- Autofill depends on the website's form field names (`email`, `password`, `name`, `password_confirmation`, `#terms-checkbox`, `#register-submit`). A change to those pages breaks the hand-off; the failure is quiet (the person simply sees the page filled in or empty).
- The Android app is a web view: **web push does not work inside the APK**. Riders in the APK get no push until the FCM step (plan B3) is built; use the WhatsApp message meanwhile.
- The APK is signed with the Android **debug** key (`android/app/build.gradle.kts` still says "TODO: add your own signing config"). That key is per-machine and Google Play rejects it. Create a release keystore before the store upload, and register *that* key's SHA-1 with Google (the debug key's SHA-1 only works for builds from this computer).
- `applicationId` is still `com.example.amd_erp_mobile`; Google Play does not accept `com.example.*`. Changing it makes this a different app for upgrades, so decide before the first store upload.

## Tests run

- Flutter: `flutter analyze` clean; `flutter test` all pass (screens, narrow-phone/large-text layouts, autofill script, navigation policy).
- PHP: FohBackendTest 18/18, RiderAlertsTest 10/10, NativeGoogleAuthTest 10/10, RiderDeliveryTest passes except one pre-existing failure (`pickup orders and inactive...`, a checkout "cart changed" error that also fails on the untouched code).
- Wider run (Hardening, Routes, Auth, Commerce): 420 pass, 29 fail. The 29 are in storefront/checkout tests and a route-namespace tripwire (`commerce`, `fiscal-year`, `station` were never declared) that were already failing and do not touch these changes.

---

# 1.2.0 (build 8) — package com.venqore.app, release-signed

**Artifact:** `VenQore-Mobile-1.2.0-build8.apk` · 50990416 bytes · SHA256 `19bb96517298870baa92ea64d9523f46cf09f7b7f1a0e1b5ec3f247a8fbd1d43`
Package `com.venqore.app`, signed with the new release key (SHA-1 `21:8C:2C:D5:8E:3B:F0:F8:E7:51:0A:95:45:C7:AA:CC:26:E3:15:A6`), checked with apksigner. Replaces the `com.example` / debug-key builds; it installs as a separate app from 1.1.x.

- Full-screen web content: no top bar, no three-dot button. Account sheet with Customer dashboard / Seller dashboard / Create your own store.
- Phone bar identical to the website's (Dashboard, Contacts, raised +, Stock, Settings) drawn natively; web's own phone bar stays hidden in the app.
- Customer account across all stores: `/my-orders` (orders and points by verified email).
- Phone calls, WhatsApp and maps links open in the phone's own apps.
- Not yet: Firebase push in the app, Google sign-in on a device (needs the Android OAuth client; see `app-code/mobile-app/GOOGLE_AND_FIREBASE_SETUP.md`). Not run on a phone yet.

---

# 1.3.0 (build 9) — app notifications (Firebase)

**Artifact:** `VenQore-Mobile-1.3.0-build9.apk` · 51,709,006 bytes · SHA256 `19A7779471032AABD0A87F909BC9AE95C671C97F57A1DA227EE69C56214F2409`
Package `com.venqore.app`, release-signed (SHA-1 `21:8C:2C:D5:...:15:A6`), verified with apksigner. Firebase project `venqore-pos-496612`.

- Asks once, in plain words, on a signed-in store page whether to allow alerts (Android 13+ permission), then registers the phone to the signed-in account through the web session. Signing out removes the phone.
- Server: `device_tokens` table, `POST /app/device-token` (+`/off`), `FcmService` (HTTP v1, token minted from the service account), and the rider-assigned alert now also goes to the rider's phone. Dead tokens are dropped.
- Tap on a notification opens its page inside the app; a notification while the app is open shows an in-app banner with "Open".
- Alerts carry order number, pickup and cash only: no address or phone.
- The real service account was checked: Google issued an access token for the project. **No real notification has been sent to a real phone yet.**

To switch on at the server: set `FCM_SERVICE_ACCOUNT_PATH` in `.env` to the service-account JSON (outside the web folder and outside git), run `php artisan migrate` and `php artisan config:clear`.

---

# 1.4.0 (build 12) — customer side and store side

**Artifact:** `VenQore-Mobile-1.4.0-build12.apk` · 52,075,847 bytes · SHA256 `6521C9AB7C945B53950A7F0924A030E16975164A70E53D73DD1D876F5C4DD7CB`
`com.venqore.app`, release-signed (SHA-1 `21:8C:2C:D5:…:15:A6`), verified with apksigner.

- Splash first, then "I want to order" / "I run a store". The choice is remembered.
- Customer side: stores, orders and the customer account only. Store side: business pages only. Pages never link across; changing sides is a confirmed button in the account sheet.
- Sign-in lands where the side says (customer: My orders; store: the role's home or create-or-join). A new account made on the customer side is a customer.
- Location is asked natively; marketplace uses the same pill bar as the store bar; guests see Sign in / Create account.
- Needs the server deployed (app-nav, app/context, my-orders, side-aware sign-in, device tokens). Not run on a phone yet.
