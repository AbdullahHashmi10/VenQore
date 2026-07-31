---
tags: [routes, controllers]
---

# Route Map Overview

Part of [[VenQore POS - Home]]

Source: `routes/web.php` (1735 lines), `routes/api.php` (94 lines), `routes/auth.php`.

## Top-Level Groups
| Group | Prefix | Notes |
|---|---|---|
| Marketing / Public | none | `/features`, `/pricing`, `/contact`, `/blog`, `/terms`, `/privacy`, `/sitemap.xml` — see [[Route Map Overview#Marketing]] |
| Demo Sandbox | `/demo` | Public login/logout into the Golden Master clone |
| VenSynQ OAuth Callbacks | fixed URLs | `/amazon/callback`, `/tiktok/callback`, `/ebay/callback`, `/google/callback` |
| Auth | `routes/auth.php` | Standard Breeze + platform owner + staff login variants |
| Hub / Multi-Store | `/hub`, `/start`, `/join` | Cross-tenant, authenticated, no tenant context bound yet |
| **Store Context** | `s/{store_slug}/*` | The largest group — see [[Store Context Routes]] |
| **Platform Owner** | `VenQore/*` | See [[Platform & SuperAdmin Routes]] |
| **Superadmin (separate)** | `/superadmin/*` | See [[Platform & SuperAdmin Routes]] |
| **V3 ERP Module** | `s/{store_slug}/v3/*` | See [[V3 ERP Routes]] |
| **API (Sanctum)** | `/api/*` | See [[API Routes]] |

## Middleware Notes
- Store context group: `auth, verified, tenant, lifecycle, drm, ...`
- Platform Owner group: `SuperAdminMiddleware`
- Separate `/superadmin/*` group: `auth, superadmin` (a **different** middleware than `SuperAdminMiddleware` — see [[Three Admin Surfaces]])

## Related
- [[Controllers Directory]]
- [[Three Admin Surfaces]]
