> ## ⚠️ SUPERSEDED — 11 August 2026
> Replaced by **`v3/00_MASTER_INDEX.md`** and the numbered set beside it.
> Three things changed: (1) **Services and field work** were added to V1; (2) the UI strategy became the **headless split** in `v3/04` — new UI in its own tree, shared logic in `Domain/`, nothing written twice; (3) most of §04 (themes) and §06 (the `ui_version` switch) turned out to be **already built** in `App\Support\Appearance` and currently behind the `NEW_EXPERIENCE_ENABLED` kill switch.
> The core strategy of this document — invisible because defaults reproduce today, not because it is hidden — is unchanged and carried forward in `v3/07`.

# VenQore — Blueprint V2
## Silent Build, Single Reveal

**Prepared:** 8 August 2026 · **Status:** the plan to build from
**Supersedes:** `VENQORE_FINAL_IMPLEMENTATION_BLUEPRINT.md` on *sequencing, rollout and theming*. That document remains authoritative for **what** to build (capability registry, dependency graph, business catalogue, Vena architecture, AI cost model, Protocol 7, estimates). This one governs **how it ships**.

---

# 01 — Verdict on your proposal

**Your instinct is right, and it is a proven engineering strategy — but one correction makes it dramatically safer, and it is the difference between this working and this failing.**

You proposed: *build everything invisibly, keep the visible changes in a separate folder, soak for two months, then flip it all on in a week.*

The invisible-build half is exactly correct and is standard practice. The separate-folder half is right for **new** screens and **fatal** for **existing** ones.

**Here is why.** If "all visible changes live in a new folder" means a second copy of screens that already exist, you now have 297 pages in two places for two months. Every bug fix to the live ERP must be applied twice. Every customer-driven tweak must be applied twice. After eight weeks the two copies have diverged in ways nobody can enumerate, and the "one week reveal" becomes a three-month merge. This is the single most common way a big-bang rewrite dies, and it dies slowly enough that you do not notice until you are inside it.

**The correction:**

> **Do not hide the work. Ship it live, with defaults that reproduce today's behaviour byte-for-byte.**

A registry-driven navigation that, with no configuration rows present, renders *exactly the menu it renders today*, is **invisible** — and you can ship it to production on a Tuesday. A `t('customer')` helper that returns `"Customer"` when no terminology map exists is **invisible** — ship it. A dashboard engine whose default layout is today's dashboard is **invisible** — ship it.

You get three things a dark folder cannot give you:

1. **Two months of real soak testing, with real customers, on real data** — instead of two months of hoping.
2. **No merge.** The reveal is flipping defaults, not integrating a branch.
3. **Instant rollback.** One `UPDATE` statement, per tenant, at any moment.

And you still get exactly what you asked for: *nothing visible changes for two months, then one week later it is a new product.* The difference is that on reveal week you are switching on code that has already been running in production for eight weeks.

**So: yes, this is how we do it — with a precise boundary between what changes in place and what goes in the new folder.**

---

# 02 — The boundary rule

> **If a screen exists today, change it in place with a no-op default.
> If a screen does not exist today, build it in `resources/js/Next/`.
> Never duplicate an existing page.**

That single rule resolves everything.

## Layer A — Live and invisible (ships continuously to production)

Everything here goes into `main` and onto the production server as it is finished. Every item defaults to today's behaviour.

| Work | Default that makes it invisible |
|---|---|
| `capabilities` registry table | Seeded so every existing tenant resolves to "everything their plan allows" — today's answer |
| Dependency resolver | Nothing calls it to change state yet |
| `featuresFor()` fix (D-1) | Same output as today for tenants with zero override rows |
| API + job + export guards (D-2) | Keys resolve true for existing tenants → no behaviour change |
| ~40 unwired enforcement points | Same — resolve true today |
| **Navigation from the registry** | Renders **byte-identical** to the hard-coded array (proved by parity test, §05) |
| **`t()` terminology helper** | Returns canonical English when no tenant map exists |
| **Dashboard engine + `dashboard_layouts`** | Default layout is today's dashboard, exactly |
| **All 5 themes emitted to CSS** | `<html data-theme="midnight-nebula">` — today's look |
| Per-tenant theme setting | Defaults to `midnight-nebula` |
| Tenant custom-colour `<style>` block | Empty by default |
| Capability search index | Nothing queries it yet |
| `ui_version` column on `tenants` | Defaults to `1` |
| DUP-1 Occupancy unification | `restaurant_tables` reads through the new model; UI unchanged |
| Legacy service deletion, test harness, CI guards | Invisible by nature |

**Roughly 80% of the total work is Layer A.**

## Layer B — `resources/js/Next/` (built in the open, never reachable until the flip)

Only screens with **no equivalent today**. Nothing here duplicates an existing page.

```
resources/js/Next/
├── Shell/
│   ├── AppShell.jsx          new layout: 9-item nav, command bar, org switcher
│   ├── CommandBar.jsx        the single AI/search/action entry point
│   └── CardGrid.jsx          12-col snapping, pinned cards
├── Onboarding/
│   ├── BusinessType.jsx      template picker / free text / "not sure"
│   ├── Questions.jsx         only questions that change configuration
│   ├── Recommendation.jsx    included / optional / not applicable
│   └── Building.jsx          apply + preview
├── MyErp/
│   ├── CapabilityBrowser.jsx Settings → My ERP (the manual path)
│   ├── DependencyDialog.jsx  consequences of enable/disable
│   └── TerminologyEditor.jsx rename things
├── Appearance/
│   ├── ThemePicker.jsx       5 themes
│   └── ColorCustomiser.jsx   5 controls, no more
└── Vena/
    ├── DiscoveryPanel.jsx    "do we have X?" → capability + [Enable]
    └── ProposalReview.jsx    AI proposal, editable, approve/reject
```

**Wiring cost is trivial.** `app.jsx` resolves pages with `import.meta.glob('./Pages/**/*.jsx')`. Adding a second glob and choosing between them on a prop is about five lines:

```js
resolve: (name) => {
    const next = usePageProps.ui_version === 2;
    return next && nextPages[`./Next/Pages/${name}.jsx`]
        ? resolvePageComponent(`./Next/Pages/${name}.jsx`, nextPages)
        : resolvePageComponent(`./Pages/${name}.jsx`, pages);
}
```

But you will barely need it, because Layer B contains almost no page *replacements* — it contains a **shell** and **new screens**. The 297 existing pages render inside whichever shell is active, unchanged.

---

# 03 — What "invisible" costs, honestly

Three things in Layer A are not free, and pretending otherwise would be the wrong kind of plan.

**1. Performance.** Registry-driven navigation adds capability resolution to every page render. Today's nav is a static array — free. Mitigation: `featuresFor()` is already cached 300s; extend the same cache to the resolved nav tree, keyed on `tenant + role + capability-set hash`. **Measure it during the soak** — this is exactly the kind of regression a dark folder would hide until launch day and a live no-op default exposes in week one.

**2. Bundle size.** Five themes at ~989 CSS lines each ≈ 5,000 lines, roughly 60 KB raw / ~8 KB gzipped. Acceptable. `Next/` adds JS, but it is code-split by Vite and never imported on `ui_version = 1`.

**3. Discipline.** Every PR must answer: *"what does this do for a tenant with no configuration?"* If the answer is anything other than *"exactly what it does today,"* it does not merge. This is a habit, and it is the whole strategy.

---

# 04 — Themes: how to make them runtime without breaking what works

Your requirement — *users choose their own colours, we don't force our taste* — collides with a deliberate, well-reasoned decision in the existing code. `theme/active.js` is a **build-time constant**, and `theme/build/generate.js` explains exactly why:

> *"Injecting at runtime means the first paint happens with no variables set… the user sees a flash of unstyled content on every page load. It also breaks server-side rendering, which this app uses."*

That reasoning is correct. **Do not overturn it. Work with it.** Four steps, all invisible until the last.

**Step 1 — Emit every theme, not just the active one.** Change `generate.js` to write each registered theme as a scoped block instead of only the active theme under `:root`:

```css
:root, [data-theme="midnight-nebula"] { --vq-slate-900: 15 23 42; ... }
[data-theme="daylight-calm"]          { --vq-slate-900: ...; }
[data-theme="classic"]                { ... }
[data-theme="colour"]                 { ... }
[data-theme="minimal"]                { ... }
```

Static stylesheet, no FOUC, SSR-safe — the original reasoning is fully preserved. With `midnight-nebula` also on `:root`, **the rendered output is identical to today.** Ship it.

**Step 2 — Server renders the attribute.** `app.blade.php` emits `<html data-theme="{{ $tenantTheme ?? 'midnight-nebula' }}">`. Default unchanged → invisible. Switching a theme is now one attribute, applied before first paint.

**Step 3 — Custom colours as a server-rendered override block.** In `<head>`, after the stylesheet:

```blade
@if($tenantThemeOverrides)
<style>:root{ {!! $tenantThemeOverrides !!} }</style>
@endif
```

Empty for everyone by default → invisible. When a tenant picks a primary colour, this emits a handful of overridden ramp variables. Server-rendered, so no flash and no SSR problem.

**Step 4 — Reveal.** `Next/Appearance/ThemePicker.jsx` and `ColorCustomiser.jsx` become reachable.

**Keep the customiser to five controls:** primary colour · accent colour · light/dark preference · density (comfortable/compact) · corner radius. Every one maps to an existing token. Business owners are not designers; an unconstrained colour editor produces unreadable screens and support tickets. Constrain the primary/accent pickers to a curated set of hues with pre-computed, contrast-checked ramps — you already have `contrastRatio()` in `theme/color.js` and a build-time parity verifier. **Reuse the verifier at runtime** to reject any custom combination that fails contrast.

---

# 05 — Parity testing: the mechanism that earns the flip

This is what makes "we're ready, we just haven't switched it on" a fact rather than a feeling.

**Nav parity.** For each of 6–8 reference tenants (Retail, Restaurant, Wholesale, Workshop, Pharmacy, Books-only, Services, Everything-on) × each of 7 roles, render the menu twice — once from the legacy array, once from the registry — and assert the JSON trees are **identical**. Run on every commit. When this is green for two weeks across all 56 combinations, registry-driven nav is provably a no-op.

**Terminology parity.** Snapshot every converted page with an empty terminology map; assert no rendered string changed. Any diff is a bug in the conversion, not a feature.

**Dashboard parity.** With no `dashboard_layouts` row, the default layout must render the same widgets in the same order as today.

**Theme parity.** `npm run theme:build -- --check` already exists. Extend it to assert that `[data-theme="midnight-nebula"]` produces byte-identical values to today's `:root`.

**Enforcement parity.** For a tenant with zero override rows, every one of the ~80 composable capabilities must resolve to the same boolean it resolves to today. This is the test that guarantees no existing customer loses access to anything.

> **Definition of "silently ready": all five parity suites green for 14 consecutive days in production, with zero support tickets attributable to Layer A.**

---

# 06 — The reveal

Not a merge. A sequence of default flips, per tenant, each individually reversible.

## The switch

```sql
ALTER TABLE tenants ADD COLUMN ui_version TINYINT DEFAULT 1;
```

`1` = today's shell. `2` = the new experience. **Rollback for any tenant, at any time, is one `UPDATE`.**

## Ring rollout

| Ring | Who | When | Rollback |
|---|---|---|---|
| **0** | Your own store + staff accounts | The day Layer B is feature-complete | instant |
| **1** | **The public demo store** | ~8 weeks before reveal | instant |
| **2** | 5–10 volunteer customers, hand-picked, personally supported | 4 weeks before | instant |
| **3** | All new signups | Reveal day | instant |
| **4** | All existing tenants, **opt-in** banner | Reveal day | instant |
| **5** | All existing tenants, **default on with opt-out** | Reveal + 30 days | instant |
| **6** | `ui_version = 1` retired | Reveal + 12 months | — |

**Ring 1 is the most valuable thing in this document.** You already have `demo_store`, `DemoStoreService`, `DemoSessionService`, `demo_sandbox_cloner` and `sandbox_time_shift` in production. Run `ui_version = 2` on the public demo store **two months before the reveal.** You get real strangers using the new experience on real-shaped data, with zero risk to a paying customer — and simultaneously the marketing asset you need for the announcement. Nobody has to know it is the future product; it is simply the demo.

## Reveal week — what actually happens

| Day | Action |
|---|---|
| Mon | Ring 3 on (new signups). Watch error rates, latency, support queue. |
| Tue | Ring 4 banner to existing tenants: *"Try the new VenQore — switch back any time."* |
| Wed | Marketing: new landing page, repositioning, pricing page. Demo store already looks like this and has for two months. |
| Thu | Monitor. Support triage. First adopters interviewed. |
| Fri | Go / no-go on ring 5 timing. |

**There is no code deployment on reveal week.** The code has been in production for two months. You are changing a default.

---

# 07 — Existing customers: "keep using it the way it is"

Your requirement is fully met, and it is nearly free — because of one property of this architecture:

> **A `ui_version = 1` tenant and a `ui_version = 2` tenant run the same code. They differ only in defaults.**

This is not two codebases. It is one codebase with two default sets. That is why "keep the old way" costs almost nothing here and would cost enormously under a dark-folder rewrite.

What a v1 tenant gets:

| | v1 (old way) | v2 (new) |
|---|---|---|
| Navigation | Legacy shell, full menu, locks as today | 9-item registry nav, hide-not-lock |
| Capabilities | All their plan allows, always on | Their chosen composition |
| Terminology | Canonical English | Their own words |
| Theme | Midnight Nebula | Their choice |
| Dashboard | Today's fixed layout | Composable |
| Vena | Existing assistant | Discovery + composition |
| **Their data** | **Identical** | **Identical** |
| **Their ledger** | **Identical** | **Identical** |

**Switching is reversible in both directions, at any time, with no data change.** A tenant can try v2, dislike it, switch back, and lose nothing. That single property is what makes the announcement safe to make.

**Be honest about the end date.** Supporting two shells forever is a tax on every future change. Commit publicly to **12 months** of v1, then retire it. Say so on day one — a stated sunset is respected; a silent one is resented.

---

# 08 — Revised sequence

Every step below ships to production as it completes. Nothing is held back except Layer B, which is built in the open but unreachable.

```
 PHASE 0 · SAFETY                                    weeks 1–3      [invisible]
   test harness green in one process
   delete legacy service generation (V3 duplicates)
   CI guards: key↔registry, capability↔enforcement, V3↔Golden
   API + job + export guards
   ui_version column (default 1)
        ↓
 PHASE 1 · SILENT FOUNDATION                         weeks 3–10     [invisible]
   capabilities registry (~250 keys, classified)
   dependency resolver
   featuresFor() fix (D-1)
   wire ~40 unguarded enforcement points
   DUP-1 Occupancy unification
   retire dead transactions table; correct CLAUDE.md
   ▸ PARITY SUITE 1: enforcement parity green
        ↓
 PHASE 2 · SILENT SHELL PLUMBING                     weeks 8–18     [invisible]
   navigation renders from registry (identical output)
   t() helper + ~25 term keys, ~450 sites converted
   dashboard_layouts + widget registry (default = today)
   DashboardController split per widget (fixes D-8)
   all 5 themes emitted; data-theme attribute; empty override block
   capability_search_index populated
   ▸ PARITY SUITES 2–5 green
        ↓                                 ╭─────────────────────────────────╮
 PHASE 3 · NEW SURFACES (parallel)        │ weeks 12–24   [Next/, unreachable]
   AppShell · CommandBar · CardGrid       │
   Onboarding (type → questions →         │  built in the open
     recommendation → build)              │  reviewed continuously
   MyErp capability browser               │  never loaded at ui_version=1
   ThemePicker + ColorCustomiser          │
   Templates (8–10 config bundles)        │
   Vena DiscoveryPanel (tiers 0–2, no LLM)│
                                          ╰─────────────────────────────────╯
        ↓
 PHASE 4 · SOAK                                      weeks 20–28
   Ring 0: internal
   Ring 1: PUBLIC DEMO STORE on ui_version=2
   parity suites green 14 consecutive days
   latency + error budgets held
   Ring 2: 5–10 volunteer customers
        ↓
 PHASE 5 · REVEAL                                    1 week
   Rings 3 → 4. Marketing. New positioning. New pricing page.
   No deployment. Defaults flipped.
        ↓
 PHASE 6 · AFTER                                     ongoing
   Vena tier 3 (free-text composition)  → the investor demo
   Workforce execution (Protocol 7 concepts, native)
   Scheduling + Resource + Period       → 16 new businesses
   Ring 5 (default on) at reveal +30d · Ring 6 (v1 retired) at +12m
```

---

# 09 — Revised timeline

Same underlying work as the previous blueprint; re-phased for continuous invisible shipping. Calendar assumes the ERP continues to be maintained and sold throughout.

| Phase | Solo + AI coding | Solo | +1 senior React engineer |
|---|---|---|---|
| 0 · Safety | 2–3 wks | 3–4 wks | 1.5–2 wks |
| 1 · Silent foundation | 5–7 wks | 8–11 wks | 3–4 wks |
| 2 · Silent shell plumbing | 8–11 wks | 13–18 wks | 4–6 wks |
| 3 · New surfaces *(overlaps 2)* | 7–10 wks | 12–16 wks | 4–6 wks |
| 4 · Soak *(mostly waiting)* | 4–8 wks | 4–8 wks | 4–8 wks |
| 5 · Reveal | 1 wk | 1 wk | 1 wk |
| **To reveal** | **≈ 22–30 wks → 5–7 months** | **≈ 36–48 wks → 9–12 months** | **≈ 14–20 wks → 3.5–5 months** |

Then:

| Milestone | Solo + AI | +1 engineer |
|---|---|---|
| **Reveal — "Build Your Own ERP"** | 5–7 months | **3.5–5 months** |
| **+ Vena tier 3 — "Describe your business"** *(investor demo)* | 7–10 months | **5–6.5 months** |
| **+ Scheduling family — 16 new businesses** | 11–16 months | 7–9 months |

**Note the soak is not extra time.** It runs while Phase 3 finishes and while you keep selling. Your instinct — *"even when we're 100% ready, let it sit two months"* — costs you nothing here, because the code is already earning its keep in production the whole time.

---

# 10 — What could still go wrong

| Risk | Why it is specific to *this* plan | Mitigation |
|---|---|---|
| 🔴 **Layer B drifts into duplicating existing pages** | The single failure mode that kills this strategy | Hard rule §02. CI check: no file in `Next/` may share a name with a file in `Pages/`. Review every addition. |
| 🔴 **A "no-op default" is not actually a no-op** | Silent breakage for paying customers, discovered late | Five parity suites (§05), green 14 consecutive days, run on every commit |
| 🔴 **Terminology conversion changes a string by accident** | ~450 edit sites; a typo ships silently | Snapshot tests with an empty map — any rendered diff fails the build |
| 🟠 **Registry nav is slower than a static array** | Added per-render resolution | Cache the resolved nav tree keyed on tenant+role+capability-hash; measure during soak, not after |
| 🟠 **Two months of discipline erodes** | Human, not technical — the temptation to "just ship this one visible tweak" | Weekly parity report. One rule per PR: *what does this do for a tenant with no configuration?* |
| 🟠 **Reveal week collides with a busy season** | Retail/food customers have peaks | Do not reveal in Ramadan, Eid week, or December. Pick a quiet fortnight. |
| 🟠 **Two shells become permanent** | v1 support tax on every future change | Publicly commit to a 12-month sunset on day one |
| 🟡 **Custom colours produce unreadable UI** | User-chosen colours vs contrast | Curated hues with pre-computed ramps; reuse `contrastRatio()` at runtime; reject failing combinations |
| 🟡 **Demo store on v2 leaks the plan early** | Ring 1 is public | Acceptable — and arguably useful. It is a demo; nobody has to be told it is the future. |
| 🟡 **Bundle growth from 5 themes** | ~60 KB raw / ~8 KB gzipped | Measured, acceptable |

---

# 11 — Definition of "silently ready"

The reveal may not be scheduled until **every** line is true. This is the checklist that replaces guesswork with evidence.

**Invisible in production**
- [ ] Layer A fully deployed to production for ≥ 14 days
- [ ] Nav parity: 8 reference tenants × 7 roles, legacy vs registry, byte-identical, green 14 consecutive days
- [ ] Terminology parity: empty map → zero rendered string diffs across all converted pages
- [ ] Dashboard parity: no `dashboard_layouts` row → today's exact widgets and order
- [ ] Theme parity: `[data-theme="midnight-nebula"]` byte-identical to today's `:root`
- [ ] Enforcement parity: zero override rows → every capability resolves as it does today
- [ ] p95 page latency within 10% of the pre-Layer-A baseline
- [ ] Zero support tickets attributable to Layer A

**Ready but unreachable**
- [ ] Layer B feature-complete; no file in `Next/` duplicates a file in `Pages/`
- [ ] `ui_version = 2` verified end-to-end on ring 0 and ring 1
- [ ] Public demo store running v2 for ≥ 8 weeks
- [ ] 5–10 ring-2 customers on v2 for ≥ 4 weeks with feedback captured
- [ ] Switching v1 ↔ v2 verified reversible, both directions, zero data change
- [ ] 6–8 reference compositions pass the full suite
- [ ] Boundary test per composable capability: enabled reachable / disabled **403 on web and API**
- [ ] Vena (if included): never returns a key absent from the registry; ERP fully functional with Vena disabled

**Commercially ready**
- [ ] New landing, pricing and positioning pages built and reviewed
- [ ] Every marketing claim enforceable in code (`FEATURE_GATING_AUDIT.md` — four Critical false promises closed)
- [ ] v1 sunset date stated publicly
- [ ] Support team briefed; opt-out path documented
- [ ] Reveal fortnight avoids customer peak season

---

# 12 — Final word

What you described is right, and it now has a shape that cannot quietly fail:

> **Nothing visible changes for two months. Then one week later it is a different product — and not one line of it is new to production.**

The correction that makes it safe is small but absolute: **the invisible work is invisible because its defaults reproduce today, not because it is hidden.** Hiding gives you two months of hope. No-op defaults give you two months of proof.

And it delivers everything you asked for. The main ERP keeps running and keeps selling throughout. Existing customers can stay exactly as they are, or move, or move back. Themes and terminology become theirs, not yours. Reveal day is a default flip, not a deployment. Rollback is one `UPDATE`. And on the day you announce it, the public demo store has already been running the new product for two months — which means your first screenshot is not a mockup.

Build Layer A in the open. Build Layer B in `Next/`. Never duplicate a page. Keep the parity suites green. Then pick a quiet week and turn it on.
