# VenQore — the two remaining items, in detail

For handing to your IDE agent (it has PHP + a browser; I don't, which is exactly why these two
are the ones left). Everything else from the original 12-item plan is done and pushed
(`874fa3fc`, plus two more staged batches on top).

---

## Item A — Connect the V6 dashboard to real data

### Where things stand today

- `store.dashboard` (`routes/web.php`, inside the `store.` group) still points at
  `DashboardController::index()` — the OLD/classic dashboard. **This is what a customer actually
  lands on right now.**
- `store.new-dashboard` is a bare closure, no controller:
  ```php
  Route::get('/new-dashboard', fn() => Inertia::render('NewDashboard', [
      'readings' => \App\Reckoner\ReckonerRegistry::v6Catalog(),
  ]))->name('new-dashboard');
  ```
  `ReckonerRegistry::v6Catalog()` returns metric **metadata** (key, label, domain, area, module) —
  not a computed number for any real tenant.
- `resources/js/Pages/NewDashboard.jsx` (5,067 lines) takes that `readings` prop and stores it as
  `window.__VENQORE_READINGS__`, used only to power the "add card" library search (the
  "Search N readings…" box). It is never used to render an actual card's value.
- Every number you actually see on that page — the headline stat, sparklines, parts/segment
  breakdowns, heatmaps, geo charts, up/down status — comes from `function seed(str)` (line 368):
  a deterministic pseudo-random generator keyed off the card's name + period string. It's called
  from at least 6 separate rendering paths (lines 380, 419, 1109, 1133, 1208, 1328). It looks real
  because it's deterministic (the same card always shows the same fake number), but every bit of
  it is fabricated.

### The good news — the real pieces already exist

Two production-quality endpoints already do the actual work. They're just never called from this
page:

1. **`POST /api/reckoner/read`** (`App\Http\Controllers\Api\ReckonerController::read()`) — takes a
   batch of `{key, period}` requests (capped at `Reckoner::MAX_BATCH`), runs them through
   `Reckoner::readMany($requests, $user, $tenant)`, returns real computed values per reading, per
   tenant, period-aware. Fully built. Its only current caller anywhere in the frontend is
   `resources/js/Dashboard/components/AddCardModal.jsx` (line ~220) — and only for a live preview
   when someone is picking a card to add, never for the dashboard's main grid.
2. **`GET /api/dashboards`** (`App\Http\Controllers\Api\DashboardController::index()`) — returns
   the user's saved board (layout + which cards: `{reading_key, period, x, y, w, h, style}` each),
   auto-creating a sensible one on first call via `createDefaultDashboard()` — which I already
   wired into signup this session (`WorkspaceBuilderController::provision()` now calls it, so a
   brand-new tenant has a real, business-type-correct board waiting). Nothing in `resources/js`
   calls this endpoint — the only reference anywhere in the frontend is the auto-generated
   `ziggy.js` route list.

### The actual gap

`NewDashboard.jsx` needs to, on load: call `GET /api/dashboards` for the tenant's real board, call
`POST /api/reckoner/read` with those cards' `{reading_key, period}` pairs for real values, and
render using those values instead of `seed()`. Then — and only then — `store.dashboard` needs to
point here instead of at the classic controller.

### Why I didn't attempt this myself

- It's a real integration job, not a wiring job: matching a 757-line API's response shape to what
  a 5,067-line rendering file expects, across roughly 5 different chart types, each of which may
  expect a different data shape.
- I have no browser. I can reason about the contract from the code, but I cannot load the page and
  see whether a chart renders correctly, breaks, or silently shows garbage — and shipping that
  unverified on the flagship screen is worse than leaving it on `seed()` a little longer.
- The original audit estimated this at 2–3 days on its own, and explicitly warned it's "not
  wiring in the trivial sense."

### Suggested approach

1. In `NewDashboard.jsx`, add a `useEffect` on mount that calls `GET /api/dashboards` to get this
   tenant's real card list.
2. Batch-call `POST /api/reckoner/read` with each card's `reading_key` + `period` (chunk if the
   card count exceeds `Reckoner::MAX_BATCH`).
3. Replace `seed()` call sites with the matching value from that response, one chart type at a
   time — start with plain stat cards (simplest), verify visually in a browser, then sparklines,
   then parts breakdowns, then heatmaps, then geo. Don't do all six at once.
4. Handle the empty-tenant case on purpose: a brand-new business has zero sales, so most readings
   will legitimately be zero — that needs a real "nothing recorded yet, here's the first thing to
   do" empty state per card, not a chart trying to draw a line through nothing.
5. Only after the whole page is visually verified working, change `store.dashboard`'s target from
   `DashboardController::index()` to whatever now correctly serves `NewDashboard.jsx`. This is the
   step that changes what every existing customer sees on login, so it should be last, done with
   the most confidence, and probably behind a quick before/after screenshot check.

---

## Item B — Wire `OneGlanceLayout` to the derived nav, delete the hardcoded menu

### Where things stand today

- `app/Http/Middleware/HandleInertiaRequests.php` (~lines 180–182) already computes a `nav` prop
  on every request via `App\Support\ModuleNavBuilder::build()` — a flat array of
  `{key, route, label, icon, order, group}`, derived automatically from which modules are enabled
  + live + permitted for that tenant. It's shared to every Inertia page already.
- `resources/js/Pages/NewDashboard.jsx` reads this `nav` prop correctly.
- `resources/js/Layouts/OneGlanceLayout.jsx` — the shell used by roughly **158 other pages** —
  does not. Its sidebar comes from a large hardcoded array, filtered by a hand-maintained
  `SUBITEM_MODULE` map (~35 entries as of the latest commit) that hides individual sub-items when
  their module is off, plus logic that hides an entire top-level group if every sub-item under it
  is gone.
- `resources/js/Components/SidebarItem.jsx` has its own separate, independent ~90-entry hardcoded
  label-to-route map (`getRoute()`), used across two rendering paths (grouped sub-items and flat
  items).

### What this means in practice today

It mostly works. The `SUBITEM_MODULE` map is reasonably complete, and — importantly — the actual
security property ("a disabled module's URL doesn't work even if you type it directly") is
**already fully closed** by the `EnsureModule` middleware, independent of what the sidebar shows.
So today's gap is only: the nav is correct by manual maintenance, not automatically correct by
construction. The risk is that the hand-maintained map can quietly drift out of sync as new
modules or routes get added later, and someone has to remember to update it by hand.

### Why I didn't attempt this myself

- `OneGlanceLayout.jsx` is the single most shared file in the frontend — a mistake here has the
  widest blast radius of any file in the app.
- I have no browser to verify a sidebar renders correctly after a structural change. This kind of
  bug doesn't throw an exception — it fails as "the menu looks subtly wrong" or "this now goes
  nowhere," which only a human looking at the rendered page catches.
- Your other IDE session has been actively editing this exact file this week (it's where the
  current `SUBITEM_MODULE` map came from) — real risk of two rewrites colliding.
- What this buys you — automatic correctness instead of manually-maintained correctness — is real
  but secondary. It is not a launch blocker the way Item A is, since the URL-level gate already
  protects you regardless of what the sidebar displays.

### Suggested approach

1. In `OneGlanceLayout.jsx`, read the existing `nav` prop (already sent — `usePage().props.nav`)
   alongside the current hardcoded menu array.
2. Build a lookup of "route names present in `nav`" and use that as the filter condition for
   whether a sidebar item renders — replacing the `SUBITEM_MODULE` map's checks **one group at a
   time**, not all 158 pages' worth at once. After each group: open the app, toggle the relevant
   module on/off in the Builder screen, confirm the sidebar updates correctly, before moving to
   the next group.
3. Only once every group is converted and verified, delete the `SUBITEM_MODULE` map and the
   group-hiding logic that depended on it.
4. Do the same conversion for `SidebarItem.jsx`'s `getRoute()` map if there's time — it's smaller
   and more contained, so it's the safer of the two to tackle first if your IDE agent wants to
   build confidence before touching the bigger file.
5. Keep this behind manual QA until it's been clicked through for a few different module
   configurations (e.g. a 5-module cafe vs. a 20-module retail store) — this is exactly the kind
   of change where "looks right in the diff" and "looks right in the browser" can disagree.

---

## One thing to flag to your IDE agent up front

Two batches of my changes from this session are staged in git but not yet committed (the network
drive makes `git commit` unreliable from where I run) — it should commit those first (or ask you
to) so it's building on top of them rather than working from a dirty, uncommitted tree.
