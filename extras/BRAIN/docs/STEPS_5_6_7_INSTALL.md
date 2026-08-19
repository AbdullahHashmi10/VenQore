# STEPS 5, 6 & 7 — INSTALL & ROLLOUT

### `tenant_modules` · `ModuleService` · `ModuleDependencyResolver` · `EnsureModule`

**15 August 2026 · six new files, two edits to existing files, zero edits to `routes/web.php`**

---

## What you are installing

| Step | File | What it does |
|---|---|---|
| 5 | `database/migrations/2026_08_16_000000_create_tenant_modules_table.php` | The table + the backfill |
| 6 | `app/Services/ModuleService.php` | The read side: `enabled()`, `visible()`, `allEnabled()`, `enable/disable()` |
| 6 | `app/Engines/ModuleDependencyResolver.php` | The Rulebook's brain: cascades, `requires_one`, cascade-disable, validation |
| 7 | `app/Support/ModuleRouteMap.php` | route name → owning modules, derived from the registry |
| 7 | `app/Http/Middleware/EnsureModule.php` | The Rulebook's teeth |
| — | `tests/Feature/Module/EnsureModuleTest.php` | Both acceptance criteria, plus the safety rails |

Two edits: one line in `bootstrap/app.php`, a few lines in `HandleInertiaRequests.php`.

**`routes/web.php` is not touched at all.** That is deliberate — see §3.

---

## 1. The one design decision you should review

The build plan says *"extend `app/Engines/CapabilityDependencyResolver.php` — the only authorised file in `app/Engines/`"*. **I did not extend it. I added a sibling instead.** Here is why, so you can overrule me:

- The existing resolver reads the **`capabilities` database table**, not `config/modules.php`. Different source, different vocabulary.
- That table holds keys the 46 modules do not contain — `optical_prescription`, `tailor_measurements`, `jewelry_metal_rates` — and **`PlanRepository::featuresFor()` reads them** to build the tenant feature map. Changing the resolver's data source ripples into the plan gate.
- `CapabilityDependencyResolverTest` currently passes. Rewriting the class breaks it on the same day you are trying to reach exit code 0.

So `ModuleDependencyResolver` lives beside it, in the same authorised folder, reading the registry. When the `capabilities` table is eventually retired, **delete the old class — do not merge them.** Two resolvers with one source of truth is fine; one resolver with two sources is not.

---

## 2. Install order — do not reorder these

Each step is safe on its own. The order is what keeps it safe.

### 2.1 Registry first

```
config/qore.php
config/modules.php
config/ai_builder.php
tests/Feature/Module/ModuleRegistryIntegrityTest.php
```

```bash
php artisan route:list --json > route_list_current.json
php artisan test --filter=ModuleRegistryIntegrityTest
```

**Do not proceed until green.** It will fail the first time; every failure is a route pattern that would not have gated anything.

### 2.2 Table + backfill

```bash
php artisan migrate
```

Then prove the acceptance criterion — *existing tenants byte-identical*:

```bash
php artisan tinker
>>> DB::table('tenant_modules')->distinct()->count('tenant_id');   # every tenant
>>> DB::table('tenant_modules')->where('enabled', false)->count(); # must be 0
```

Every tenant gets all 46 modules, `source = 'system'`. **Not "what we think they use" — everything.** Narrowing a customer's system is a decision they make in the builder, not one a migration makes at 3am.

### 2.3 Service + resolver

```
app/Services/ModuleService.php
app/Engines/ModuleDependencyResolver.php
app/Support/ModuleRouteMap.php
```

Nothing changes behaviour yet — nothing calls them.

```bash
php artisan test --filter=EnsureModuleTest
```

The resolver tests pass without the middleware being wired at all.

### 2.4 The gate — last, and only after the three above are green

`app/Http/Middleware/EnsureModule.php`, then **one line** in `bootstrap/app.php`:

```php
$middleware->alias([
    // ...existing aliases...
    'plan.feature' => \App\Http\Middleware\EnsurePlanFeature::class,
    'module'       => \App\Http\Middleware\EnsureModule::class,   // ← add
]);
```

and append it to the web stack so it covers every route automatically:

```php
$middleware->web(append: [
    // ...existing entries, HandleInertiaRequests etc...
    \App\Http\Middleware\PreventAuthenticatedPageCaching::class,
    \App\Http\Middleware\EnsureModule::class,     // ← add LAST
]);
```

**Append it last.** It needs `TenantMiddleware` to have run so `current.tenant` is bound; it falls back to resolving the slug itself, but the bound instance is the fast path.

---

## 3. Why a route map instead of `->middleware('module:pos')` on 464 routes

Annotating each owned route by hand means a 464-line diff through a 2,172-line file — and **the gate ends up exactly as complete as the person applying it was patient.** Every route somebody forgets is a module that stays reachable when it is switched off, and you will not find out from a test; you will find out from a customer.

Deriving the map from `config/modules.php` instead means:

- adding a module gates its routes automatically,
- `ModuleRegistryIntegrityTest` already proves every pattern resolves,
- `ROUTE_OWNERSHIP.md` already proves **zero routes are unclaimed**,
- `routes/web.php` is untouched, so this is trivially revertible.

The `module:key` alias still exists for genuine exceptions — a route that needs gating but does not belong to the module its name implies.

---

## 4. The safety rails, and why they matter more than the gate

A gate that is too aggressive is worse than no gate. It locks paying customers out of software they already have, and they will not wait for a fix. Four rails, each with a test:

**A tenant with no rows in `tenant_modules` has EVERYTHING.**
The middleware ships before, during and after the backfill. Any tenant the backfill missed — created by a signup that raced the migration, say — keeps working exactly as they did yesterday. Absence of configuration is an unasked question, not a denial.

**Unknown module keys are never denied.** An unknown key is not a module, so it cannot be "off".

**Unclaimed routes are never blocked.** If the registry does not claim it, it is not ours to gate.

**Always-on routes are never blocked.** Settings, billing, backups, the dashboard, the profile. A customer must always be able to reach their own account — including to pay you.

The gate blocks **only** when a module explicitly owns the route and **every** owner is explicitly switched off.

---

## 5. Shared routes are OR, not AND

Seven routes are claimed by two modules each — mostly reports (`store.reports.party-statement` belongs to both Khata and Reports). The route is allowed when **any** owner is enabled.

Requiring all owners would hide the party statement from someone who switched off the Reports module but still runs khata. That is the module system arguing with the customer, which is the failure this whole architecture exists to prevent.

---

## 6. Wiring the front end

`HandleInertiaRequests.php` — share modules the same way plan features are shared today:

```php
'modules' => fn () => $tenant
    ? \App\Services\ModuleService::allVisible($tenant, $request->user())
    : [],
```

Then in `Next/Shell/Nav.jsx`, change the gate from `props.plan.features` to `props.modules`. The build plan calls this a ~20-line change to one file, and it is — the hard architectural work (`useTerms()`, permission filtering) is already done.

**Nav is derived, never stored.** It is the union of `provides_nav` across visible modules, sorted by `order`, labelled through `Terms::`. No `tenant_navigation` table: that is a sync-bug generator with no V1 payoff.

Dashboard cards: add `'module' => 'x'` to entries in `DashboardRegistry`, filter by `ModuleService::visible()`. **A card with no `module` key stays always-visible**, which keeps the change additive — existing dashboards are unaffected until a card is explicitly assigned.

---

## 7. Acceptance — the build plan's criteria, verbatim

> **Step 6:** *"no path can produce an invalid configuration. Disabling never deletes."*
> **Step 7:** *"NO MODULE ROUTE REACHABLE BY URL WHEN OFF."*

```bash
php artisan test --filter=EnsureModuleTest
```

Verified offline against the real registry before shipping:

| Check | Result |
|---|---|
| Deep cascade `table_service` + `production_runs` | resolves to 7 modules, valid, every addition explained |
| Hostile input (`teleportation`, `accounting`, `fifo`) | dropped silently, `products` + `pos` survive |
| `requires_one` with two live options (Khata) | **asks**, adds neither |
| `requires_one` with one shippable option (Invoicing) | adds it **and says why** — see §8 |
| `canDisable('products')` with 3 dependents | offers the choice, never a bare refusal |
| `disableCascade('pos')` | removes `pos`, `park_recall`, `table_service` — never `expenses`, never `products` |
| All 12 shippable presets | resolve valid, no questions, nothing dropped |
| Idempotence | `resolve(resolve(x)) === resolve(x)` |

Then the manual check that matters:

```
1. Log in to a test store.
2. Disable Cookbook in tinker: ModuleService::disable($tenant, 'cookbook')
3. Confirm the nav item is gone.
4. TYPE THE URL: /s/{slug}/cookbook
5. It must 403 with code=module_disabled and send you to the builder.
6. Re-enable. It must work again immediately.
```

Step 4 is the whole point. Steps 3 and 5 are what make it feel like a product rather than a wall.

---

## 8. One behaviour worth understanding before it surprises you

Invoicing needs Products **or** Services. Services is still `building`, so **today that question has exactly one possible answer.**

A question with one answer is a dead end wearing a choice's clothing. So the resolver adds Products and explains itself:

> *"Invoicing needs Products. (Products is the only option available today.)"*

**When Services goes live, this reverts to a real two-way question with no code change** — and `EnsureModuleTest::a_requires_one_with_a_single_shippable_option_is_resolved_not_asked` will start failing, which is exactly the reminder you want at that moment.

---

## 9. Rollback

Each step reverses cleanly and independently:

| To undo | Do this | Effect |
|---|---|---|
| The gate | remove `EnsureModule` from `bootstrap/app.php` | nothing is gated; everything reachable |
| Service + resolver | delete the three files | nothing referenced them |
| The table | `php artisan migrate:rollback` | no configuration → `ModuleService` fails open → everyone has everything |

**Every rollback path gives customers more of their software, never less.** That is the property to preserve if you change any of this.

---

## 10. What comes next

- **The report → module map.** `store.reports.*` has 59 names and `store.v3.reports.*` has 15. Reports #42 auto-scales, so each report needs an owning module or a report queries a disabled module's tables and 500s. Build it next to `ReportController` and unit-test it: for every report, assert it disappears when its owner is off **and** that its route returns a friendly 403, never a 500.
- **`ApplyConfigurationService`** — the single writer. Preset, AI and manual toggle all go through it. One transaction, one version snapshot.
- **`tenant_config_versions`** — with a working undo, not a stored blob nobody has ever restored.
