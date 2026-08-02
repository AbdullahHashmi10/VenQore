# Route Sweep

How every URL, page and Ziggy binding in VenQore is verified.

Run it: **`RUN_ROUTE_SWEEP.bat`**

---

## What exists, and what each piece actually covers

There were two route checkers before this consolidation, and between them they
left a hole.

### 1. `ZiggyRouteIntegrityTest` — frontend-driven

`Tester/tests/Feature/ZiggyRouteIntegrityTest.php`, 7 tests. Scans the React
source for `route('...')` calls and asserts each name is registered in Laravel.
Also pins specific prefix conventions (backup, recycle bin, migration, returns).

**Blind spot:** it is driven by what the frontend *calls*. A route that exists
in Laravel but was never regenerated into `resources/js/ziggy.js` is invisible
to it — which is precisely the failure mode `CLAUDE.md` warns about.

### 2. `audit:ledger-truth` — live HTTP sweep

`app/Console/Commands/LedgerTruthAuditCommand.php`, 1438 lines. Seeds a Golden
Audit tenant, hits every GET route, and reconciles the financial numbers
rendered on each page against `journal_items`. Strict mode fails the build on
any mismatch.

This is genuinely good, and the concern about it being stale turned out to be
**unfounded**: `discoverGetRoutes()` enumerates `Route::getRoutes()` at runtime,
so new pages are picked up automatically. The hardcoded `154` appears only in
the old BAT file's banner text, not in the logic.

**Real blind spot:** line 544 —

```php
if (!str_starts_with($name, 'store.')) continue;
```

It sweeps `store.*` only. Current route census:

| Namespace | Named routes | HTTP-swept? |
|---|---:|---|
| `store.*` | 619 | **Yes** |
| `platform.*` | 130 | No |
| `tools.*` | 52 | No |
| `marketing.*` | 22 | No |
| `superadmin.*` | 5 | No |
| `vensynq.*` | 4 | No |
| everything else | ~88 | No |
| **Total named** | **920** | |

### 3. `FullRouteSweepTest` — new, closes the hole

`FinalTester/tests/Routes/FullRouteSweepTest.php`, 6 tests. Registry-and-
filesystem based: no database, no HTTP, runs in seconds. Safe in front of every
deploy.

| Test | Catches |
|---|---|
| `every_ziggy_route_still_exists_in_the_laravel_registry` | Stale `ziggy.js` entry → `route()` produces a URL that 404s |
| `every_laravel_route_is_present_in_the_generated_ziggy_file` | **The Ziggy error.** Route added, `ziggy:generate` forgotten → "route is not in the route list" in the browser |
| `every_rendered_inertia_page_component_exists` | `Inertia::render('Foo/Bar')` with no `Pages/Foo/Bar.jsx` → white screen |
| `every_route_action_resolves_to_an_existing_controller_method` | Route wired to a missing class or method → guaranteed 500 |
| `no_route_namespace_exists_without_a_declared_sweep_story` | A whole new area of the app shipped with nobody deciding how it gets tested |
| `route_coverage_census_is_recorded_and_has_not_shrunk` | Route files failing to load; writes `reports/route-coverage.json` |

The Inertia-page test is not hypothetical. The 2026-08-02 run contains:

```
Inertia page component file [Settings/SettingsPanel] does not exist.
```

That is exactly this class of defect, and it was found only because a test
happened to hit that page. Now it is caught statically, for all 240 rendered
components, in seconds.

---

## Why two phases

`RUN_ROUTE_SWEEP.bat` runs static first, then live:

```
PHASE 1  FullRouteSweepTest        seconds, no DB
PHASE 2  audit:ledger-truth        minutes, seeds amd_pos_test
```

Phase 1 first is deliberate. A missing route or a missing page component makes
phase 2 fail in confusing, cascading ways. Fix phase 1 red before reading phase
2 output.

Flags:

```
RUN_ROUTE_SWEEP.bat /skip-seed        reuse the existing tenant, much faster
RUN_ROUTE_SWEEP.bat /financial-only   only pages carrying financial props
RUN_ROUTE_SWEEP.bat /no-phase2        static only
```

---

## Current coverage, honestly stated

| Layer | Coverage |
|---|---|
| Route name registered | **920 / 920** — static, complete |
| Ziggy binding correct | **920 / 920** — static, complete, both directions |
| Controller action resolves | **All non-vendor routes** — static, complete |
| Inertia page exists | **240 / 240 rendered components** — static, complete |
| Page renders without error over HTTP | `store.*` GET only (~460 routes) |
| Financial numbers reconcile to ledger | `store.*` GET only |

**The gap that remains:** `platform.*` (130 routes) and `superadmin.*` (5) are
verified to exist and to be wired correctly, but nothing loads them over HTTP.
A runtime error inside a platform controller — a null dereference, a bad
Eloquent call — would not be caught.

That is the single most valuable next addition to route coverage. Two options:

1. Extend `discoverGetRoutes()` to accept a namespace list. Cleanest, but it
   edits production code, which this consolidation deliberately avoided.
2. Add `PlatformSmokeTest` alongside `Feature/Smoke/InertiaPageRenderTest`,
   asserting HTTP 200 for each `platform.*` GET route as a superadmin. No
   production code touched. **Recommended.**

---

## Maintenance

When you add a route:

```bash
php artisan ziggy:generate     # ALWAYS. This is what the sweep enforces.
RUN_ROUTE_SWEEP.bat
```

When you add a whole new namespace, `FullRouteSweepTest` will fail with a clear
message. Add it to `KNOWN_NAMESPACES` **with a truthful note** on how it is
covered. That note is the coverage argument; keeping it honest is the entire
maintenance burden of this file, and it is what stops route coverage rotting
silently.

`preflight.php` also warns when `routes/web.php` is newer than `ziggy.js`, so
you usually hear about it before the sweep even runs.
