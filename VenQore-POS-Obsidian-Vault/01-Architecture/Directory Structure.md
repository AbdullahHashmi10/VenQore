---
tags: [architecture, directory-structure]
---

# Directory Structure

Part of [[VenQore POS - Home]] · [[Project Overview]]

## Backend
```
app/
  Console/          — Artisan commands
  Http/
    Controllers/    — One controller per feature area
      Admin/        — Store-level admin controllers
      SuperAdmin/    — Platform-level monetization controllers
      Api/           — API-only controllers
      Auth/          — Auth controllers
      V3/            — New double-entry ERP layer (36 controllers)
      WooSync/       — WooCommerce integration controllers
      Marketing/     — Public marketing site controllers
      SmartCapture/  — AI document/receipt scanning
  Models/            — Eloquent models (128, mostly tenant-scoped)
  Services/          — Business logic
    V3/              — Hardened double-entry accounting engine
    WooSync/         — WooCommerce sync engine
  Jobs/              — Queued jobs
  Mail/              — Mailable classes
  Exports/           — Excel exports (maatwebsite)
  Imports/           — Excel imports
  Helpers/           — Utility helpers
  Traits/            — Reusable model/controller traits (e.g. HasTenant)
  Providers/         — Service providers
routes/
  web.php            — All web + Inertia routes (1735 lines)
  api.php             — API routes (94 lines)
  auth.php            — Auth routes
```

## Frontend
```
resources/js/
  Pages/             — Inertia page components (238 files, maps ~1:1 to routes)
    Auth/, Dashboards/, Pos.jsx (root), Sales/, Purchases/, Inventory/,
    Parties/, Accounting/, Finance/, Settings/, SuperAdmin/, Admin/,
    Marketing/, Hub/, V3/, WooCommerce/, VenSynQ/, Reports/ (~50 pages), ...
  Components/        — 100+ shared React components
  Layouts/            — Layout wrappers (Authenticated, GlobalProvider, OneGlance, Platform, Reports, SuperAdmin, Guest)
  Contexts/           — WorkspaceContext, ThemeContext, AttendanceContext, AlertContext
  DB/LocalDB.js        — Dexie database definition
  Utils/db.js           — Dexie instance + isOnline()
  Hooks/useOfflineSync.js — offline sale queue sync engine
```

See [[Controllers Directory]] and [[Pages Directory Structure]] for full breakdowns.

## Related
- [[Frontend Architecture]]
- [[Route Map Overview]]
