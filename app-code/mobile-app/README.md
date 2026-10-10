# VenQore mobile pilot

Current build: **1.1.2+4**

Version one is a Business-only Flutter shell around the existing VenQore web
application. It adds native V6 launch chrome, loading/error handling, and a
same-origin navigation policy that blocks public marketing pages and arbitrary
websites.

New business accounts begin in a native AI-builder prompt. The description is
passed into the existing `/build-workspace` flow, which owns discovery,
recommendations, account creation, email verification, and provisioning.

## Dashboard

The app opens `/s/{store_slug}/dashboard` as the business home. The current
Laravel controller renders the shared V6 card engine from `NewDashboard.jsx`
for this canonical route; the app does not redirect to `/new-dashboard`.
The app bar and More menu expose shortcuts for adding cards, editing the
layout, and choosing a starting layout. Dashboard cards and graphs can be
moved and resized on touch screens, and the saved layout follows the user.

Card access is enforced by the existing dashboard APIs. The catalogue only
returns readings enabled for the signed-in user's permissions, modules,
capabilities, and plan. The server validates access again when a card is
added or a layout is saved, so the mobile UI cannot unlock restricted cards.

The signed-in app uses a native bottom bar for Dashboard, Sales, POS, and
More. Its WebView identifies itself with the `VenQoreMobile` user agent so the
website's mobile navigation is suppressed inside the app while remaining
available in normal mobile browsers.

Sales and POS now open native V6 action centers before entering a business
workflow. The native Business tools directory also groups inventory,
purchases, customers, money, reports, activity, team, settings, and account
destinations. These centers use the existing permission-protected web routes;
the server still decides whether the signed-in user may open each destination.

The shared native page layout is constrained for tablets, adapts its hero and
tool grid on narrow phones, respects safe areas, supports enlarged text, and
scrolls instead of allowing controls to overflow.

Dashboard actions dispatch page events without reloading the WebView. More
includes the full business navigation, and layout edits show saving, saved,
or retry feedback. App-only card editing uses the full available viewport.

## Launcher icon

Android launcher icons are generated from the canonical VenQore mark at
`assets/brand/venqore-icon.svg`. After changing that source, regenerate every
legacy, round, and adaptive density with:

```sh
node tools/make-android-icons.js
```

The adaptive icon uses the V6 pine background and keeps the mark within
Android's safe mask area.

## Run

Production defaults to `https://venqore.com`:

```sh
flutter pub get
flutter run
```

Use a staging installation without changing source code:

```sh
flutter run --dart-define=VENQORE_BASE_URL=https://staging.example.com
```

Android emulator local development may use `http://10.0.2.2`. Release hosts
must use HTTPS.

## Pilot limitations

- The website remains responsible for login, OTP/MFA, store selection,
  permissions, and business transactions.
- Public-site navigation and external origins are blocked.
- Google authentication has a scoped exception for the exact Google Accounts
  origin during the VenQore OAuth flow. Other provider handoffs still require
  separate review.
- Offline sales, native printing/scanning, push notifications, and the customer
  shopping mode are not included in version one.
