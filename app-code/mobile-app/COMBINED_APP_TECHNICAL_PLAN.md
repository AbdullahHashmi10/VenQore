# VenQore combined mobile application: technical implementation plan

Date: 2026-10-02  
Status: Proposed architecture; implementation has not started  
Primary target: Android pilot, followed by iOS  
Product decision: One application with Business and Customer modes. Signing out is mandatory before entering the other mode.

## 1. Requirements and scope

Ship one Flutter application named VenQore. At first launch, offer two destinations:

- **Business:** owners and employees access existing VenQore business workflows.
- **Customer:** shoppers discover participating businesses and place orders.

Both destinations require authentication before entering their main experience. Choosing a mode does not grant permissions. Business access requires active store membership and the appropriate role. Customer access requires a customer identity/profile.

Only one mode may be authenticated in the application at a time. A person can have both capabilities, but must sign out, return to the entry screen, and authenticate again to change mode. Do not provide a switch that silently reuses the previous session.

Use Flutter screens for authentication, navigation, and progressively migrated workflows. Use a restricted WebView for approved business workflows awaiting migration. Public marketing pages must not be navigable inside the app. Customer catalogue screens are intentional shopping destinations, not access to the unrestricted public website.

The initial implementation must feel like an application: no URL field, browser toolbar, arbitrary browsing, duplicate headers, or accidental redirects to the public homepage. Legal information and help must be available through controlled app screens.

## 2. Verified repository baseline

| Area | Existing implementation | Implication |
|---|---|---|
| Flutter entry point | `lib/main.dart` | Starts directly on the dashboard; no authentication routing |
| Flutter screen | `lib/screens/dashboard_screen.dart` | Exactly one screen, with static sample balances/activity |
| Flutter shared styling | `lib/theme/app_colors.dart`, `lib/widgets/nebula_card.dart` | Old black/indigo/purple presentation; replace with V6 semantics |
| Flutter dependencies | `pubspec.yaml` | Flutter and Cupertino icons only; no WebView, networking, or secure storage integration |
| Flutter test | `test/widget_test.dart` | Stale counter test references `MyApp`; does not match `AmdErpApp` |
| Laravel authentication | `../main-app/routes/auth.php` | Existing email OTP, MFA, staff login, password recovery, and Google auth routes |
| Existing APIs | `../main-app/routes/api.php` | Some POS/search/sync/work-order endpoints; not a complete mobile API |
| Additional web APIs | `../main-app/routes/web.php` | Store-scoped routes also include API-style endpoints; audit before adding duplicates |
| Store scope | `/s/{store_slug}/...` routes | Existing tenant routing can support restricted web fallback |
| Online-store manager | `OnlineStoreController.php`, `Pages/OnlineStore/OnlineStore.jsx` | Empty controller data, unimplemented update, and placeholder UI; not a completed marketplace |
| Web app support | `public/manifest.json`, service worker registration in web layouts | Existing PWA infrastructure; WebView offline compatibility is unverified |

Source inspection only: no successful mobile build, device test, or end-to-end authentication validation is claimed. Customer marketplace completeness must be audited further before schema implementation.

## 3. V6 design source and implementation

Use the active application tokens as the starting reference:

- `../main-app/resources/css/venqore-v6/tokens/theme.css`
- `../main-app/resources/js/theme/themes/venqore-v6.js`
- `../main-app/resources/js/theme/build/from-v6-tokens.js`
- `../main-app/resources/js/theme/build/v6-owned.js`

The repository also contains an older HIG specifying amber/obsidian. Do not assume it represents the current V6 interface: the inspected active CSS uses teal identity colours and semantic light/dark surfaces. Resolve the CSS/JS mapping and inspect representative current business screens before freezing Flutter tokens.

Create a versioned shared token export and a deterministic conversion to Dart. Map background, surface, text, borders, accent, success, warning, danger, spacing, typography, radii, and motion into Flutter `ThemeData` and theme extensions. Keep semantic names rather than copying scattered colour literals. Support light/dark settings consistently in web fallback and Flutter.

Build shared buttons, fields, cards, money values, list rows, empty states, errors, and loading states. Use tabular money figures, accessible text scaling, safe areas, minimum 48 logical-pixel interactive targets, and reduced-motion behaviour. Adapt desktop tables into mobile rows/details rather than shrinking the desktop UI.

## 4. Application architecture

```text
Flutter application
  App bootstrap + mode/auth state machine
  V6 components and theme
  Authentication + secure credential storage
  Central destination registry
    Business Flutter workflows
    Restricted business WebView host
    Customer Flutter workflows
  API client + scoped repositories
       |
Laravel
  Mobile authentication and challenge services
  Mobile session/mode enforcement
  Store membership, permissions, plan checks
  Existing business services and transactions
  App web session bridge + app layout
  Customer catalogue/order services
       |
Existing database + proposed customer commerce tables
```

Suggested Flutter structure:

```text
lib/
  app/                 # bootstrap, router, lifecycle, mode controller
  core/auth/           # challenges, session repository, secure storage
  core/network/        # API client, errors, retry rules
  core/navigation/     # destination registry, validated deep links
  core/web/            # host, allowlist, bridge, session bootstrap
  design_system/       # generated tokens, themes, components
  features/entry/      # mode selection
  features/business/   # dashboard, stores, migrated workflows
  features/customer/   # discovery, catalogue, cart, checkout, orders
  features/settings/   # profile, sign-out, legal, help
```

Select maintained routing, state management, HTTP, WebView, and platform secure-storage packages during implementation; verify platform requirements before pinning versions. Use feature repositories so screens do not call raw endpoints directly.

## 5. Authentication state machine

```text
BOOTSTRAP
  -> ENTRY                         when no usable session exists
  -> VALIDATING_SESSION            when stored credentials exist
ENTRY
  -> BUSINESS_AUTH                 user chooses Business
  -> CUSTOMER_AUTH                 user chooses Customer
AUTH
  -> CHALLENGE_REQUIRED            OTP/MFA where applicable
  -> AUTHENTICATED_BUSINESS        after server authorisation
  -> AUTHENTICATED_CUSTOMER        after server authorisation
AUTHENTICATED_*
  -> SIGNING_OUT                   sign out or request other mode
SIGNING_OUT
  -> ENTRY                         after local isolation completes
```

A valid returning session resumes its existing mode after server validation; mode choice is not required on every launch. A request to change mode shows “Sign out to continue as a customer/business.” Complete sign-out before displaying the other login flow. The same email may be used again, but fresh authentication and capability checks are required.

Preserve existing security rules: do not issue a usable mobile token until required email OTP/MFA challenges are complete. Audit how staff PIN/passcode and Google authentication differ before offering them on mobile. Never treat a customer identity as a POS customer/ledger party automatically.

Store credentials in platform secure storage. Do not store passwords. Assign each mobile session a server-controlled mode and session identifier. Every protected endpoint checks active session mode as well as ordinary authorisation. The client's selected mode is untrusted input.

### Sign-out and mode transition sequence

1. Stop new requests and disable navigation; increment a session-generation identifier so stale responses cannot update the UI.
2. Attempt server revocation of the current mobile session, linked web session, and push-device association. Do not revoke unrelated desktop/device sessions.
3. Destroy the WebView; clear app-owned cookies, history, cache, local/session storage, IndexedDB, and service worker data using platform-supported mechanisms. Verify cleanup on both platforms.
4. Remove credentials, in-memory providers, store context, cached account data, and notification destinations. Partition any retained non-sensitive data by identity/mode/store.
5. Reset the entire navigation stack and show the entry screen.

If offline, local sign-out must still succeed and block old-session restoration. A previously issued server credential remains potentially valid until expiry or revocation; do not claim remote revocation succeeded. Use bounded session expiry and an explicit secure retry design if deferred revocation is retained. A new mode cannot access old caches even while revocation is pending.

Unsynced sales require a deliberate policy: before ordinary sign-out, offer sync or cancel sign-out. On forced session expiry, quarantine drafts for that identity/store; never expose or submit them under the next account. The first pilot does not promise offline sales.

## 6. API contracts to implement

The following paths are proposals, not existing endpoints. Use `/api/mobile/v1` and consistent JSON errors rather than HTML redirects.

| Endpoint | Purpose |
|---|---|
| `POST /auth/start` | Start Business/Customer authentication and return challenge or completed session |
| `POST /auth/challenges/{id}/verify` | Verify OTP/MFA; challenges expire and have attempt limits |
| `POST /auth/challenges/{id}/resend` | Rate-limited resend where supported |
| `GET /session` | Validate session, mode, identity, permitted stores, and capabilities |
| `POST /auth/logout` | Revoke this mobile session and associated web session |
| `GET /business/stores` | Active stores the business identity may enter |
| `GET /business/stores/{id}/dashboard` | Authorised real dashboard data |
| `POST /web-session-ticket` | Issue short-lived, single-use web bootstrap ticket for current session/store |
| `GET /customer/businesses` | Paginated discoverable, enabled businesses |
| `GET /customer/businesses/{id}/products` | Store-scoped published catalogue |
| `POST /customer/orders/quote` | Server price, availability, fulfilment and fee validation |
| `POST /customer/orders` | Idempotent order submission |
| `GET /customer/orders` | Current customer's order history |
| `GET /customer/orders/{id}` | Authorised order details/status |

Audit and reuse existing domain services behind these contracts. Session mode, tenant membership, employee permissions, feature eligibility, and customer ownership must be enforced on the server. A caller cannot obtain access merely by sending a store ID. Define pagination, currency units, decimal precision, timestamps, error codes, and API version compatibility before screen integration. Keep money calculations authoritative on the backend.

## 7. Native/web authentication bridge

Use native API credentials for Flutter requests and an HttpOnly Laravel session for web fallback. Do not expose bearer tokens to page JavaScript or attach them to navigation URLs.

Proposed flow:

1. Flutter requests a single-use ticket through its authenticated API client.
2. Server binds the hashed ticket to the active mobile session, mode, permitted store, expiry (target 30–60 seconds), and a validated internal destination.
3. Flutter submits the ticket to an HTTPS bootstrap endpoint using a POST supported by the target WebView; verify platform behaviour in Phase 0. Ticket is never a URL query value.
4. Server atomically consumes the ticket, checks all bindings, rotates the web session ID, and sets Secure/HttpOnly session cookies with an appropriate SameSite policy.
5. Server redirects only to the bound allowlisted app destination. Normal CSRF protection remains enabled for web mutations.

Associate web sessions with the mobile session server-side so token revocation, expiry, or mode changes invalidate fallback access. Apply challenge-completion and mode middleware to app web routes. Do not assume existing desktop cookies should be imported into the app.

## 8. Closed navigation and app web layout

Create a central destination registry with a stable key, permitted mode, required capability, argument schema, presentation (`native` or `web`), and permitted internal route. Example:

```json
{
  "business.products.index": {
    "mode": "business",
    "presentation": "web",
    "requires": ["active_store_membership"],
    "arguments": ["store_slug"]
  }
}
```

Exact permission names must be taken from the actual route/service requirements. Moving a workflow to Flutter changes presentation, not its user-facing destination key.

Web navigation rules:

- Parse URLs and require the configured HTTPS origin, expected port, and exact approved path patterns; never use naive string prefix matching.
- Bind `/s/{store_slug}/...` to the active authorised store. A store change requires revalidation and web-context reset.
- Intercept native destinations and open them in Flutter. Validate arguments and permission eligibility first.
- Block marketing routes, root homepage, platform-owner/admin routes outside scope, arbitrary external hosts, `file:`/`javascript:` schemes, popups, and unapproved downloads.
- Validate redirects, new-window requests, universal/app links, and links delivered through notifications. Handle SPA navigation as well as full-page loads: WebView navigation callbacks alone may not cover Inertia history changes.
- Implement a narrow typed bridge for approved destinations/session expiry/share requests. Treat page messages as untrusted; validate origin, message type, arguments, mode, and permissions. Do not expose arbitrary JavaScript/native method execution.
- Handle 401 by returning to authentication, 403 with an access-denied screen, and failures with retry. Do not fall back to the public homepage.

Create a server-rendered app layout flag tied to the authenticated app web session, rather than relying only on a forgeable query parameter. Remove marketing links and duplicate web navigation; retain necessary workflow controls. Add safe-area/keyboard handling and mobile form/list layouts. Deep links into another mode show a sign-out-and-login prompt and a validated pending destination; they never authenticate automatically.

Back behaviour: close modal first, return within the active workflow next, then return to that mode's home. At root, use platform-appropriate exit behaviour. Never reveal the other mode, old login page, or previous account through history.

Explicit integrations such as Google auth or future payment providers may require approved system authentication/provider flows. These are controlled exceptions with validated return links, not general browsing. Implement them only when that integration enters scope.

## 9. Customer commerce backend

Audit existing catalogue, stock, parties, sales, payment, and fulfilment models before migrations. Proposed responsibilities, not fixed table names:

| Entity | Responsibility |
|---|---|
| Customer identity/profile | Shopper authentication and preferences; distinct from accounting parties |
| Storefront settings | Store visibility, branding, hours, fulfilment, enabled payment methods |
| Catalogue publication | Which products/variants are purchasable and their customer-facing information |
| Customer address | Owned addresses and delivery eligibility |
| Customer order/items | Buyer/store ownership, immutable item/price snapshots, totals and statuses |
| Order status events | Auditable fulfilment history |
| Idempotency record | Prevent duplicate order creation on retry |
| Payment attempt | Add only when online payments are in scope |

Initial shopping MVP: one store per cart/order; explicit confirmation when replacing a cart with another store. Customer login precedes discovery. Include search, store details, product details, cart, address/collection choice, checkout, receipt/order history, and order detail.

Start with collection or a deliberately defined store-managed delivery flow and pay-at-store/COD where appropriate. Online payment gateways, live delivery tracking, recommendations, and promotions are subsequent scopes.

Order creation must validate storefront availability, fulfilment eligibility, published products, server prices/taxes, and stock policy. Use transactions and idempotency. Decide when stock is reserved/released and when an order becomes an accounting sale; do not immediately post every submitted cart as a completed sale. Define transitions such as placed, accepted, preparing, ready, fulfilled, rejected, and cancelled, with server-enforced actors/transitions. Reuse existing sales/stock services to avoid duplicate posting.

Business staff need an order inbox, authorised status changes, and fulfilment details; the customer MVP cannot be delivered with buyer screens alone.

## 10. Initial screen inventory

These are proposed routed screens; dialogs, variants, and web workflows are additional UI work.

| Shared foundation | Business | Customer |
|---|---|---|
| Mode selection | Store selection | Business discovery/search |
| Business login | Real dashboard | Store catalogue/details |
| Customer login/registration | Controlled web workflow host | Product details |
| OTP verification | Account/settings | Cart |
| MFA verification (as required) | Access denied/store unavailable | Address selection/edit |
| Password recovery | Online order inbox/detail | Checkout |
| Legal/help | Subsequent migrated workflows | Order confirmation |
| Session/network recovery | | Order history/detail |
| | | Customer account/settings |

The current one-screen mockup is a starting asset, not an implemented portion of these workflows. Migration units should be complete workflows (list, details, creation/editing, errors, and navigation), rather than isolated attractive screens.

## 11. Phased implementation and gates

### Phase 0 — feasibility and contracts (2–4 working days)

- Build the current Flutter scaffold; repair stale test and establish Android tooling.
- Audit auth challenges, store-scoped APIs, V6 tokens, and existing customer-commerce work.
- Prove native login/challenge completion, API request, ticket exchange, and one authenticated web workflow on a physical device.
- Prove cookie/storage cleanup and native/web back navigation. Validate iOS bridge feasibility before promising parity.
- Gate: architecture works without skipped OTP/MFA or credential exposure; record resolved contracts and package versions.

### Phase 1 — combined app foundation (approximately 2–3 weeks including Phase 0)

- Implement V6 shared components, entry modes, login/challenges, persisted session validation, and mandatory sign-out transition.
- Implement customer identity/auth foundation after model audit; customer mode remains feature-gated until its useful experience exists.
- Implement real business dashboard, store selection, app web layout, destination registry, and navigation restrictions.
- Gate: Business login → dashboard → allowed web workflow → logout → Customer login has no session/history/data leakage.

### Phase 2 — business pilot (approximately 3–5 weeks cumulative)

- Adapt priority existing business web workflows for phones; verify permissions, form submission, downloads/share, errors, and session expiry.
- Add release signing/configuration, staging environment, diagnostics with sensitive-data redaction, and representative device testing.
- Gate: supported business tasks work reliably in the contained application. Do not present an unfinished Customer option as usable shopping; hide behind a release feature flag or clearly identify limited availability.

### Phase 3 — customer shopping and merchant handling (approximately 8–12 weeks for this workstream)

- Implement storefront publishing, discovery, catalogue, cart, addresses, server quotes, idempotent ordering, customer history, and merchant inbox/status handling.
- Gate: a real customer order can be placed, accepted, fulfilled, and reflected correctly in existing stock/accounting according to the chosen policy.
- If this starts after the business pilot, estimate roughly 11–17 weeks overall; overlap only with sufficient development capacity. The one-app packaging does not eliminate commerce backend work.

### Phase 4 — progressive Flutter migration

- Prioritise products, customers/khata, sales/invoices, purchases, inventory, approvals, then reports based on actual usage.
- For each workflow: inventory dependencies, define/reuse APIs, build V6 screens, verify domain outcomes, enable via feature flag, and retain a controlled web rollback.
- Expand offline capabilities and printing/scanning only after explicit platform/device feasibility work. Browser IndexedDB offline logic is not automatically reusable as Flutter offline storage.

Planning assumptions: one experienced full-time developer with AI assistance, working staging backend, prompt product decisions, and Android first. Ranges are provisional, not delivery guarantees; store review, iOS build environment/device work, payment onboarding, and extended offline/device integration add time. A mature marketplace remains a separate multi-month scope.

## 12. Verification and release criteria

Required automated and device checks:

- Session state machine: cold start, valid/expired session, every challenge path, logout online/offline, mode switch, and stale-response rejection.
- Server authorisation: customer tokens fail business APIs; business tokens fail customer-only APIs; suspended memberships and other-store IDs fail; pending challenge credentials cannot access protected data.
- Isolation: log in as account A, create web history/cache, sign out, log in as B/opposite mode, and verify no old data, cookies, drafts, push links, or back-stack access.
- Navigation: marketing/root/external destinations, redirects, encoded paths, popups, SPA links, deep links, and notification destinations follow registry policy.
- Web bridge: replayed/expired tickets fail; destination manipulation fails; logout invalidates associated web sessions; web mutations retain CSRF protection.
- Commerce: duplicate retries create one order; stock contention, server-price changes, failed fulfilment, cancellation, and repeated status events do not double-post stock/accounting.
- UI: narrow/wide phones, keyboard, text scaling, light/dark theme, loading/empty/error states, background/resume, and connectivity interruption.

Use staging fixtures and test identities. Release via the repository's deployment policy for backend changes. Roll out to a small pilot first, with per-workflow feature flags and server-compatible fallback. Never use debug builds, sample balances, or placeholder commerce controls as customer-ready functionality.

## 13. First concrete implementation milestone

Deliver a reviewable Android build with:

1. V6 mode selection and Business/Customer authentication entry points.
2. Existing required business OTP/MFA preserved.
3. Business store selection and dashboard using real data.
4. One approved business web workflow inside the app layout.
5. Blocked public marketing/general browsing destinations.
6. Verified sign-out, storage cleanup, and fresh authentication before changing mode.
7. A feature-gated Customer experience until catalogue and ordering are functional.

This milestone proves the combined-app architecture before expanding business screens or committing to marketplace delivery.

## 14. Implementation references

- Flutter WebView package: https://pub.dev/packages/webview_flutter
- Navigation delegate API: https://pub.dev/documentation/webview_flutter/latest/NavigationDelegate-class.html
- Flutter deployment/platform guidance: https://docs.flutter.dev/deployment

Recheck current official package/platform documentation during implementation. Paths and API contracts above distinguish inspected existing files from proposed additions.
