# VenQore — Fix Tasks (2026-09-15)

Investigated against the working copy at `E:\AMD POS\AMD POS\app-code\main-app`.
All line numbers are from that copy.

**Four fixes. Ship them one at a time, verifying each, in the order below.** If
several go out together and something breaks, you won't know which caused it.

| # | Fix | Type | Urgency |
|---|---|---|---|
| 0 | Reseed the dashboard board | Data — no code | **Do now, 30 seconds** |
| 1 | Plan integrity | Code | High — prevents recurrence |
| 2 | Theme ownership | Code + build | High — visibly broken |
| 3 | Retire `new-dashboard` | Code + build | Housekeeping |

---

# Background — what actually happened

A production deploy on 2026-09-14 shipped code that **fails closed** on plan
limits. Five tenants had an empty string in `tenants.plan`, including the live
store `amd-outlets-1`. Every `PlanLimit` lookup for those tenants was therefore
denied, producing log lines like:

```
production.WARNING: Unknown or unseeded plan limit key queried: 'report_ledger'
for plan ''. Denying access (fail-closed).
```

This had two consequences, one immediate and one that persisted after the plan
was fixed:

1. **Immediate** — every gated card, report and module returned nothing. The
   dashboard rendered as empty cards with `Rs 0` and `Rs NaN`.
2. **Persistent** — "Start Fresh" was clicked *while the plan was empty*. The
   board seeder dropped every gated card and **wrote the starved board to the
   database**. Restoring the plan did not restore those cards, because the board
   was already persisted.

`tenants.plan` was corrected manually on 2026-09-14 (`amd-outlets-1` → `scale`;
four others → `starter`). Consequence 1 is resolved. **Consequence 2 requires
Fix 0 below.**

Separately, two theme edits made on the evening of 2026-09-14 (19:59) were never
compiled — the production build ran at 19:53, before both. Those changes have
never reached any browser.

---

# Fix 0 — Reseed the dashboard board *(data only, do this first)*

**Root cause:** `app/Http/Controllers/Api/DashboardController.php:729`,
`getDefaultRoleCards()`:

```php
$availability  = $reckoner->checkAvailability($keys, $user, $tenant);
$availableKeys = array_keys(array_filter($availability));

$candidates = $this->presetBoard($role, $tenant);

foreach ($candidates as $candidate) {
    if (! in_array($candidate['reading_key'], $availableKeys, true)) {
        continue;   // dropped, and the board is then persisted without it
    }
    ...
}
```

Its docblock states the intent plainly: *"Readings the user cannot see
(permission, **plan**, capability, module) are dropped and the survivors are
re-packed so a dropped card never leaves a hole."*

Because the survivors are **re-packed**, the resulting board looks tidy and gives
no signal that most cards were discarded. That is why this reads as a layout bug
rather than a gating one.

## Action

`tenants.plan` is now correct, so reseeding through the same filter produces a
full board.

1. Open the dashboard as the store owner.
2. Click **Start Fresh**.
3. Hard-refresh (and unregister the service worker first — see the note at the
   end of this document).

## Verify first, if you want confidence before clicking

```bash
php artisan tinker --execute="
\$t = App\Models\Tenant::where('slug','amd-outlets-1')->first();
\$u = App\Models\User::find(5);
\$r = app(App\Reckoner\Reckoner::class);
\$a = \$r->checkAvailability(array_keys(App\Reckoner\ReckonerRegistry::all()), \$u, \$t);
echo count(array_filter(\$a)).' of '.count(\$a).' readings available'.PHP_EOL;
"
```

If most readings now report available, the reseed will produce a full board.

## Code change — stop this recurring

A seeded board silently bakes in whatever gates happened to be failing at that
instant. A transient misconfiguration — an empty plan, a permission not yet
granted, a module mid-install — permanently amputates a customer's dashboard,
with no error and no trace.

In `getDefaultRoleCards()`:

- **Log the drop count and reasons.** How many candidates were discarded, and
  which gate discarded each. One log line at seed time would have made this
  diagnosable in seconds.
- **Refuse to seed a starved board.** If more than ~50% of the authored preset is
  dropped, do not persist it. Return an error the UI can surface
  ("your plan or permissions are still resolving — try again in a moment")
  rather than writing a two-card board and calling it done.

---

# Fix 1 — Plan integrity

`tenants.plan` is `VARCHAR(100) NOT NULL DEFAULT 'trial'` — but `NOT NULL`
permits the **empty string**, which is what five rows contained.

`StoreProvisioner::create()` is **not** the culprit: it always sets
`'plan' => $plan` where `$plan` is a license plan or `'trial'` (lines 201, 208).
New signups are safe.

**The hazard is `app/Support/PlanCatalog.php:51`:**

```php
public static function canonical(?string $slug): string
{
    $slug = (string) $slug;
    return $slug === '' ? '' : PlanRepository::normalizePlanSlug($slug);
}
```

`canonical(null)` returns `''`. The codebase is instructed to funnel every plan
value through `canonical()`, so any caller passing a missing value writes an
empty string.

## 1a. Make `canonical()` fail safe *(highest value — one line)*

```php
return $slug === '' ? 'trial' : PlanRepository::normalizePlanSlug($slug);
```

`'trial'` is the column default and ranks below every paid tier
(`PlanCatalog::rank()` returns 0), so this cannot accidentally grant access. This
single change makes every read *and* write path safe regardless of which caller
misbehaved.

## 1b. Guard the column at the model

Add a mutator on `App\Models\Tenant` that refuses to persist an empty plan,
coercing to `'trial'`. Catches any writer that bypasses `canonical()` entirely.

## 1c. Make the fail-closed warning traceable

The current log line reads `for plan ''` with **no tenant identifier**. That is
why this sat in the log for weeks without anyone being able to act on it. Include
the tenant id and slug.

## 1d. Find any remaining writer

```bash
grep -rn "'plan'\s*=>\|->plan\s*=" app/Http/Controllers/ app/Services/ \
  | grep -v "plan_limits\|store_licenses"
```

## 1e. Verify the platform UI writes canonical slugs

Canonical values are `solo · starter · core · scale · custom`. If the superadmin
plan dropdown offers legacy labels ("Growth", "Business") it may write
`growth`/`business`. After changing a plan from the platform UI:

```bash
php artisan tinker --execute="echo App\Models\Tenant::where('slug','amd-outlets-1')->value('plan');"
```

Must print the canonical slug. If not, fix the dropdown.

---

# Fix 2 — One owner for `data-theme`

Three separate pieces of code write `data-theme` on `<html>`, in sequence, from
three different sources. Last writer wins, and they disagree:

| # | Where | Source of truth |
|---|---|---|
| 1 | `resources/views/app.blade.php:17-20` — PHP writes `<html>` attributes | user's saved DB preference |
| 2 | `resources/views/app.blade.php:23-37` — inline pre-paint script | `localStorage` |
| 3 | `resources/js/theme/appearance.js:130-133` — `applyAppearance()` on mount | Inertia props |

A user with `mode=dark` in the DB gets: dark (PHP) → light (localStorage empty) →
dark (React). Components reading the attribute at first paint keep the light
values; components reading after mount get dark. That is the observed mixed
state — dark shell with a white modal, light page with a dark search bar.

**Principle: the server decides, the client remembers.** PHP is the source of
truth for signed-in users. `localStorage` is the memory for guests. React writes
back instead of fighting.

## 2a. Blade — stop ignoring the server value

**File:** `resources/views/app.blade.php`
**Replace:** lines 23–37 (the existing `<script>` block)

```blade
<script>
  /* Theme before paint. Server value wins; localStorage is the guest fallback. */
  (function () {
    var serverMode = @json($vqAppearance['mode'] ?? 'light');
    var hasServerPreference = @json(auth()->check());
    var mode = 'light';

    try {
      if (hasServerPreference) {
        mode = serverMode === 'dark' ? 'dark' : 'light';
      } else {
        var saved = localStorage.getItem('vq_theme');
        mode = saved === 'dark' ? 'dark' : 'light';
      }
    } catch (e) {
      mode = serverMode === 'dark' ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  })();
</script>
```

This now **agrees with** the attributes PHP already wrote on `<html>` at lines
19-20 instead of overwriting them.

## 2b. `appearance.js` — write back, don't just write

**File:** `resources/js/theme/appearance.js`
**Insert:** inside `applyAppearance()`, immediately after line 133

```js
root.classList.toggle('dark', isDark);
root.setAttribute('data-theme', isDark ? 'dark' : 'light');

// Keep the pre-paint script in step so the next load doesn't flash the
// other theme before React mounts.
try {
    localStorage.setItem('vq_theme', isDark ? 'dark' : 'light');
} catch (e) { /* private mode — the server value still carries it */ }
```

## 2c. Collapse the three localStorage keys

The old blade script read `amd_theme`, `vq-theme`, **and** `vq_theme`. Nothing in
`appearance.js` ever wrote any of them, so that branch could only be populated by
legacy code. Standardise on `vq_theme`, then:

```bash
grep -rn "amd_theme\|vq-theme" resources/js/ resources/views/
```

Repoint or delete every remaining writer.

## 2d. Delete dead code

`resources/js/theme/appearance.js:57` — `const prefersDark = () => false;` is
declared and never called.

## 2e. Decide what "System" mode means

`Appearance::MODES` still offers `'system'` and `AppearanceSettingsController`
still ships it to the settings screen as selectable — but it now silently
resolves to light. It is a control that does nothing. Pick one:

- **Remove it** *(recommended — consistent with "light by default everywhere")*.
  Drop `'system'` from `MODES` in `app/Support/Appearance.php`. Users who already
  saved it fall through to light, which is the intended behaviour anyway.
- **Or honour it.** Restore `prefersDark` to
  `window.matchMedia('(prefers-color-scheme: dark)').matches` and have
  `resolveDarkMode()` use it for the `'system'` case.

## Verify Fix 2 locally before deploying

```bash
npm run build
php artisan serve
```

1. Toggle light → dark → light.
2. **Hard-reload in each mode.** The theme must survive with no flash of the
   other theme. This is the specific thing the fix addresses.
3. Sign out, reload — should be light.
4. Sign in with a saved dark preference — dark immediately, no flash.

Only then deploy `public/build`.

---

# Fix 3 — Retire `new-dashboard` (archive, do not delete)

**Goal:** `new-dashboard` stops being reachable by anyone, but the code stays in
the repo so it can be read and lifted from later.

**Finding:** `store.new-dashboard` and `store.dashboard` call the **identical
controller action**, `DashboardController@index`, which renders
`Inertia::render('Dashboard')` (line 556). There is no `NewDashboard` render in
that controller. The store-level `/new-dashboard` is a pure alias.

**What sends users there:** `resources/js/Layouts/OneGlanceLayout.jsx:284-320` —
four handlers hard-code `store.new-dashboard` as their destination.

**Where the archived file goes:** `_archive/dashboards/` at the repo root,
*outside* `resources/js` entirely. That location matters for three reasons:

1. Inertia's page resolver globs `resources/js/Pages/**` — a file outside it can
   never be resolved as a page, so no route can accidentally render it.
2. Vite only bundles what is imported. Nothing will import it: zero build cost.
3. `resources/js/scratch/audit_ziggy_routes.cjs` scans `.jsx` for `route()` calls
   and fails the build on unknown route names. `NewDashboard.jsx` contains such
   calls, and you are about to remove those names — so the file **must** leave
   the scanned tree or `npm run build` breaks.

It stays in git, so history, blame and content remain available. To view it
rendered again, copy it back to `resources/js/Pages/` temporarily and add a
route.

> ⚠️ **Order matters.** JSX first, routes second.
> `routes/web.php:1169-1186` documents that route *names* are deliberately kept
> registered because the ziggy audit cannot distinguish "unreachable because a
> controller 404s it" from "does not exist".

## Step 1 — Repoint the layout

**File:** `resources/js/Layouts/OneGlanceLayout.jsx`, lines 284–320

Each handler currently branches on
`window.location.pathname.includes('/new-dashboard')` then visits
`store.new-dashboard`. Collapse each to the store route:

| Current line | Handler | New destination |
|---|---|---|
| 287 | edit | `route('store.dashboard', { store_slug: store.slug, edit: 1 })` |
| 297 | add card | `route('store.dashboard', { store_slug: store.slug, add_card: 1 })` |
| 308 | side panel | `route('store.dashboard', { store_slug: store.slug, side_panel: 1 })` |
| 318 | `handleStartFresh` | `route('store.dashboard', { store_slug: store.slug, reset: 1 })` |

Remove the pathname checks and the bare `/new-dashboard?...` fallbacks.

## Step 2 — Grep for stragglers

```bash
grep -rn "new-dashboard\|NewDashboard" resources/js/
```

Every hit must be gone before Step 3.

## Step 3 — Remove the routes

**File:** `routes/web.php`

| Lines | What |
|---|---|
| 1140 | store `/new-dashboard` → `DashboardController@index` |
| 1141 | `/new-dashbaord` typo redirect |
| 122–133 | **public** `/new-dashboard` — renders `Inertia::render('NewDashboard')` with hardcoded fake data (`'VenQore Enterprise Store'`, invented revenue). Guarded by `abort_if(production && !is_platform_admin, 404)` so not publicly reachable, but a distinct page component. |
| 135–137 | public `/new-dashbaord` typo redirect |

## Step 4 — Archive the page

```bash
mkdir -p _archive/dashboards
git mv resources/js/Pages/NewDashboard.jsx _archive/dashboards/NewDashboard.jsx
```

Confirm `_archive/` is **not** in `.gitignore` — the point is that it stays in
the repo. Confirm nothing in `vite.config.js`, `jsconfig.json` or the ziggy audit
script globs `_archive/`.

Add `_archive/dashboards/README.md`:

```markdown
# Archived dashboard pages

`NewDashboard.jsx` — the v6 Live Card Builder preview. Retired 2026-09-15.

It was never a distinct dashboard: `store.new-dashboard` and `store.dashboard`
both called `DashboardController@index`, which renders `Pages/Dashboard.jsx`.
This file was only reachable via the public `/new-dashboard` preview route,
which rendered it with hardcoded demo figures.

Kept for reference — the card-builder interactions and layout ideas are worth
lifting into the real dashboard. Not routed, not bundled, not resolvable by
Inertia. To view it again, copy it back to `resources/js/Pages/` and add a
temporary platform-admin-only route.
```

## Step 5 — Regenerate and build

```bash
php artisan ziggy:generate
npm run build
```

Build failure on a missing route name means a `route('store.new-dashboard')` call
survived Step 2.

## Step 6 — Confirm unreachable

```bash
php artisan route:list | grep -i "new-dash"
```

Should return nothing. Then, signed in as a platform owner, hit
`/new-dashboard` and `/s/<slug>/new-dashboard` — both must 404.

## Optional — same sweep, decide separately

- **`store.dashboard-v1`** (`routes/web.php:1164`) — a third alias to the same
  action. The comment at 1169-1186 calls it a deliberate unconditional escape
  hatch back to the classic dashboard. Decide before removing.
- **`/next-dashboard`** — exists twice (lines 100 and 1188), both rendering
  `Next/Dashboard` with hardcoded fake revenue figures. Same category of dead
  preview route.

---

# Testing note — the service worker will lie to you

VenQore registers a service worker that caches the app bundle. After **any**
deploy or rebuild, a plain refresh can serve the old broken bundle, making a
correct fix look like it failed.

Before judging any fix:

1. DevTools → **Application** → **Service Workers** → **Unregister**
2. DevTools → **Application** → **Storage** → **Clear site data**
3. **Ctrl+Shift+R**

---

# Deployment note

The live server is deployed from the **`release`** branch. Never
`git pull origin main` on it — that is what caused the 2026-09-14 incident. The
only safe form is:

```bash
git fetch origin release
git reset --hard origin/release
```

---

# Not part of these fixes — flagged separately

**403s on `api/sync/*` and `attendance/check-in` (local only).**
Observed against store `store-custom-merch-6aa5e64738b7f`. If the local user is
not a member of that store, this is the `store.member` middleware working
correctly. The live server hydrated 2,167 products fine. **Confirm store
membership before anyone "fixes" this** — loosening that middleware would be a
tenant-isolation regression.

**`LOG_LEVEL=debug` in production.**
`TenantMiddleware sharing store: …` is written on every request. It grew
`laravel.log` to 22 MB and buried the real errors throughout this incident. Set
`LOG_LEVEL=warning` in the production `.env`.

**Stale committed log file.**
`storage/logs/laravel.log` on production was last written 2026-07-25 and is 22 MB.
Daily logs (`laravel-YYYY-MM-DD.log`) are the live ones. Confirm the stale file is
not tracked in git, and add `storage/logs/*` to `.gitignore` if it is.
