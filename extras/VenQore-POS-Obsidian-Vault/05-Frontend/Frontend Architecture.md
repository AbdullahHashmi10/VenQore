---
tags: [frontend, react, inertia]
---

# Frontend Architecture

Part of [[VenQore POS - Home]]

Laravel + Inertia.js v2 + React 18. `resources/js/Pages/*.jsx` maps ~1:1 to backend routes (238 files). No separate CSS files — Tailwind utility classes throughout, matching the `CLAUDE.md` convention.

## No shadcn/ui or Redux
Hand-rolled component library on Tailwind. No shadcn/ui or Radix primitives detected (no `components/ui/*`, no class-variance-authority). No Redux/Zustand/Recoil — state management is React Context + component-local `useState`, with `localStorage`/`sessionStorage` for cross-reload persistence and Dexie/IndexedDB for the POS offline queue specifically. See [[State Management]].

## Layer Summary
| Layer | Detail note |
|---|---|
| Pages | [[Pages Directory Structure]] |
| Components/Layouts | [[Components & Layouts]] |
| Offline/Dexie | [[Offline Sync - Dexie & IndexedDB]] |
| POS terminal | [[POS Terminal Deep Dive]] |
| State/Context | [[State Management]] |

## Ziggy Routing
`resources/js/ziggy.js` is the generated route cache. Per `CLAUDE.md`: **every time a route is added/renamed in `routes/web.php`, run `php artisan ziggy:generate`** before building/committing, or the build guard fails. Used globally as `route('feature.action', { store_slug })`.

## Related
- [[POS Terminal Deep Dive]]
- [[Route Map Overview]]
- [[Code Conventions]]
