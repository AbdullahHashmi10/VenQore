# 07 — Sequence, Parity & Acceptance

The weekly driving document. Everything else describes *what*; this describes *when*, *in what order*, and *how we know it is safe*.

---

## 01 — The strategy in one paragraph

Every backend change ships to production the week it is written, with a default that reproduces today's behaviour exactly, so it soaks against real customers on real data for months. The new interface is built in a separate tree that classic users never download. On reveal day nothing is deployed — a database default is changed, per tenant, reversible with one `UPDATE`. **The invisible work is invisible because its defaults reproduce today, not because it is hidden.** Hiding gives you months of hope; no-op defaults give you months of proof.

---

## 02 — Phase plan

```
 PHASE 0 · SAFETY                                      weeks 1–3     [invisible]
   02_LEGACY_TO_V3 in full
   test harness green in one process against amd_pos_test (MariaDB)
   CI guards: no legacy generation · key↔registry · capability↔enforcement
   tenants.experience column (default 'classic')
        ↓
 PHASE 1 · SILENT FOUNDATION                           weeks 3–10    [invisible]
   capabilities registry (~269 keys promoted from the seeder, classified)
   dependency resolver from the §04 graph
   F-1 featuresFor() · F-2 API guards · F-3 ~40 unwired enforcement points
   guards on jobs, exports, imports, offline sync, scheduled commands
   R-4 Occupancy unification (4 deploys, shadow-compared)
   R-1/R-2/R-5/R-9 renames
   ▸ PARITY SUITE 1: enforcement parity green
        ↓
 PHASE 2 · SILENT PLUMBING                             weeks 8–18    [invisible]
   navigation renders from the registry (byte-identical output)
   t() helper + ~25 term keys + ~450 conversion sites
   dashboard_layouts + widget registry (default = today's dashboard)
   DashboardController split per widget
   layout_preferences table
   capability_search_index populated
   promote experience to tenant level; re-verify retired themes
   ▸ PARITY SUITES 2–5 green
        ↓
 PHASE 3 · SERVICES ENGINE (parallel with 2)           weeks 10–18   [invisible
   products.type += 'service' + service columns                       until a
   kitchen_orders → work_orders + kind                                capability
   jobs · job_lines · job_assignments · job_events                    is on]
   employee_skills · van stock · service_contracts
   offline layer generalised for services
        ↓                                  ╭──────────────────────────────────╮
 PHASE 4 · THE NEW INTERFACE (parallel)    │ weeks 12–30  [Next/, unreachable]
   Domain/ extraction, screen by screen    │
   design system · AppShell · CommandBar   │  built in the open
   screens in the 05_SCREEN_SPECS order    │  reviewed continuously
   Studio: Onboarding · MyErp ·            │  never downloaded at
     Terminology · Appearance · Layout     │  experience = 'classic'
   Vena discovery (tiers 0–2, no LLM)      │
                                           ╰──────────────────────────────────╯
        ↓
 PHASE 5 · SOAK                                        weeks 26–34
   Ring 0: your own store + staff
   Ring 1: THE PUBLIC DEMO STORE on experience = 'new'
   parity suites green 14 consecutive days
   latency and error budgets held
   Ring 2: 5–10 hand-picked volunteer customers
        ↓
 PHASE 6 · REVEAL                                      1 week
   Rings 3 → 4. Marketing, positioning, pricing.
   No deployment. Defaults flipped.
        ↓
 PHASE 7 · AFTER                                       ongoing
   Vena tier 3 (free-text composition)  → the investor demo
   Scheduling + Resource + Period       → 16 new businesses
   Projects family                      → 7 more
   Ring 5 (default on) at reveal +30d · Ring 6 (classic retired) at +12m
```

---

## 03 — Timeline

| Phase | Solo + AI | Solo | + 1 senior React engineer |
|---|---|---|---|
| 0 · Safety | 1.5–2 wks | 2.5–3 wks | 1–1.5 wks |
| 1 · Silent foundation | 5–7 wks | 8–11 wks | 3–4 wks |
| 2 · Silent plumbing | 7–10 wks | 12–16 wks | 4–5 wks |
| 3 · Services engine *(overlaps 2)* | 5–7 wks | 8–11 wks | 4–5 wks |
| 4 · New interface *(overlaps 2 & 3)* | 16–20 wks | 26–34 wks | 8–11 wks |
| 5 · Soak *(mostly waiting)* | 4–8 wks | 4–8 wks | 4–8 wks |
| 6 · Reveal | 1 wk | 1 wk | 1 wk |
| **To reveal** | **≈ 30–38 wks → 7–9 months** | **≈ 48–62 wks → 11–14 months** | **≈ 18–24 wks → 4.5–6 months** |

**Two notes on these numbers.**

They are longer than Blueprint V2's estimate for one honest reason: **Services was not in that plan.** Phase 3 is genuinely new work worth 5–7 weeks, and the interface phase grew because the headless extraction is a real cost that buys the "never do the work twice" guarantee. Some of that is offset by the theming and experience-switch work already being built.

**The soak is not extra time.** It runs while Phase 4 finishes and while you keep selling. Your instinct — *even when we're 100% ready, let it sit two months* — costs nothing here, because the code is already live and earning the whole time.

**If you can afford one hire, make it a senior React engineer.** It roughly halves the calendar, and 85% of the remaining gap is frontend.

---

## 04 — The five parity suites

This is what turns *"we're ready, we just haven't switched it on"* from a feeling into a fact. All five run on **every commit**.

| Suite | Method | Passing means |
|---|---|---|
| **Enforcement** | Tenant with zero override rows: every one of ~80 composable capabilities resolves to the boolean it resolves to today | No existing customer loses access to anything |
| **Navigation** | 8 reference tenants × 7 roles = 56 combinations, legacy array vs registry, JSON trees compared | Registry nav is provably a no-op |
| **Terminology** | Snapshot every converted page with an **empty** map; assert zero rendered string diffs | The ~450-site conversion introduced no typos |
| **Dashboard** | No `layout_preferences` row → today's exact widgets in today's exact order | The composable dashboard defaults to today |
| **Theme** | `npm run theme:build -- --check` extended: `[data-vq-theme="midnight-nebula"]` byte-identical to today's output | Emitting five themes changed nothing visible |

**Plus two suites specific to this programme:**

| Suite | Method |
|---|---|
| **Extraction** | Every screen whose logic moved to `Domain/`: rendered DOM byte-identical before and after |
| **Dual-shell** | Same domain hook, both shells: identical totals, identical validation errors, identical POST body across the fixture set |

**The eight reference tenants:** Retail · Restaurant · Pharmacy · Wholesale · **Field service (electrician)** · **Repair shop** · Services-only (consultant) · Everything-on.

> **Definition of "silently ready": all seven suites green for 14 consecutive days in production, with zero support tickets attributable to any of this work.**

---

## 05 — Rollout rings

`tenants.experience` (default `'classic'`) sets the tenant default; the existing per-user `user_preferences` entry overrides it.

| Ring | Who | When | Rollback |
|---|---|---|---|
| **0** | Your own store + staff accounts | The week AppShell lands (≈ week 16) | instant |
| **1** | **The public demo store** | ≥ 8 weeks before reveal | instant |
| **2** | 5–10 hand-picked volunteers, personally supported | 4 weeks before | instant |
| **3** | All new signups | Reveal day | instant |
| **4** | Existing tenants, **opt-in banner** | Reveal day | instant |
| **5** | Existing tenants, **default on with opt-out** | Reveal + 30 days | instant |
| **6** | `classic` retired | Reveal + 12 months | — |

**Ring 1 is the highest-value item in this document.** `DemoStoreService`, `DemoSessionService`, `demo_sandbox_cloner` and `sandbox_time_shift` are already in production. Run the demo store on `experience = 'new'` two months before the reveal: real strangers, real-shaped data, zero risk to a paying customer — and on announcement day your first screenshot is not a mockup.

**Ring 0 at week 16, not week 30.** The resolver's fallback (§04.3 of the UI programme) means the new shell is usable as soon as it exists, with classic screens rendering inside it. Living in it yourself for fourteen weeks is worth more than any amount of review.

---

## 06 — Existing customers

> **A `classic` tenant and a `new` tenant run the same code. They differ only in defaults.**

Not two codebases. One codebase, two default sets. That property is what makes "keep using it the way it is" nearly free here, and what would make it ruinously expensive under a dark-folder rewrite.

| | classic | new |
|---|---|---|
| Navigation | Legacy shell, full menu, locks as today | 9-slot registry nav, hide-not-lock |
| Capabilities | Everything their plan allows, always on | Their chosen composition |
| Terminology | Canonical English | Their own words |
| Theme & colour | Midnight Nebula | Their choice |
| Dashboard | Today's fixed layout | Composable, rearrangeable |
| Vena | Existing assistant | Discovery + composition |
| **Their data** | **Identical** | **Identical** |
| **Their ledger** | **Identical** | **Identical** |

Switching is reversible in both directions, at any time, with no data change. A customer can try it, dislike it, switch back and lose nothing.

**State the sunset publicly on day one: 12 months.** Two shells forever is a tax on every future change. A stated sunset is respected; a silent one is resented.

---

## 07 — Risk register

| Risk | Why it is specific to *this* plan | Mitigation |
|---|---|---|
| 🔴 **Logic leaks into `Next/`** | The single failure mode that makes this a double-build. It happens gradually — one `useForm` "just for now". | CI greps `Next/` for `fetch`, `router.post`, `useForm`, hardcoded hex. Fails the build. Reviewed on every PR. |
| 🔴 **A "no-op default" is not actually a no-op** | Silent breakage for paying customers, found late | Seven parity suites, green 14 consecutive days, on every commit |
| 🔴 **Marketing outruns the registry** | Tier C verticals are tempting and visible; selling scheduling before it exists produces refunds | Only the 48 in `06_BUSINESS_CATALOGUE_V1.md` appear anywhere public. Every claim enforceable in code. |
| 🔴 **Hiding before enforcing** | Hide-not-lock plus unguarded API routes is a data-exposure vulnerability, not a UX choice | F-2 lands in Phase 1 and gates all of Phase 4. No screen hides a capability until its API route 403s. |
| 🟠 **R-4 Occupancy migration loses a parked sale** | It touches live carts | Four deploys, dual-write, 7-day shadow compare with zero divergence before the read flip. Reuse `RunShadowMigration`. |
| 🟠 **Registry nav slower than a static array** | Per-render resolution replaces a constant | Cache the resolved tree on `tenant + role + capability-hash`, same 300s cache as `featuresFor()`. Measure p95 during soak, not after. |
| 🟠 **Terminology conversion changes a string by accident** | ~450 edit sites; a typo ships silently | Empty-map snapshot test; any rendered diff fails the build |
| 🟠 **Composition explodes the test surface** | Capabilities combine multiplicatively | Test the 8 reference tenants exhaustively, not the power set. Add a tenant to the reference set whenever a real customer finds a broken combination. |
| 🟠 **Services promises a calendar** | "Field service" implies scheduling to most buyers | Say "jobs have a date and an assigned technician" in every piece of material. Log calendar requests as the Scheduling waiting list. |
| 🟠 **Months of discipline erode** | Human, not technical — the pull to "just ship this one visible tweak" | Weekly parity report. One question on every PR: *what does this do for a tenant with no configuration?* |
| 🟡 **Offline layer breaks on services** | Dexie is retail-shaped and fails quietly | Explicit offline test: sell a service offline, sync, assert zero stock movement attempted |
| 🟡 **Custom colours produce unreadable screens** | User-chosen hues vs contrast | Curated hues with pre-computed ramps; `contrastRatio()` enforced at runtime; failing combinations rejected |
| 🟡 **Reveal collides with peak season** | Retail and food customers have peaks | Not Ramadan, not Eid week, not December. Pick a quiet fortnight. |
| 🟡 **Demo store on `new` leaks the plan** | Ring 1 is public | Acceptable, arguably useful. It is a demo; nobody has to be told it is the future. |

---

## 08 — Definition of done

The reveal may not be scheduled until **every** line is true.

**Invisible in production**

- [ ] Phases 0–3 fully deployed for ≥ 14 days
- [ ] All seven parity suites green 14 consecutive days
- [ ] p95 page latency within 10% of the pre-programme baseline
- [ ] Zero support tickets attributable to any invisible-layer work
- [ ] Legacy service generation gone; CI guard prevents its return
- [ ] `occupancies` live; `parked_sales` and `restaurant_tables` dropped
- [ ] Every composable capability enforced on web, API, jobs, exports, imports, offline sync and scheduled commands

**Ready but unreachable**

- [ ] `Next/` feature-complete for the 12 screens in `05_SCREEN_SPECS.md`
- [ ] Zero logic in `Next/` — CI grep clean
- [ ] `Next/` fully code-split; a classic user downloads none of it, verified in the network tab
- [ ] `experience = 'new'` verified end to end on rings 0 and 1
- [ ] Public demo store on `new` for ≥ 8 weeks
- [ ] 5–10 ring-2 customers on `new` for ≥ 4 weeks, feedback captured
- [ ] `classic ↔ new` reversible both directions, zero data change
- [ ] All 8 reference compositions pass the full suite
- [ ] Per composable capability: enabled reachable / disabled **403 on web and API**
- [ ] Vena never returns a capability key absent from the registry; the ERP is fully functional with Vena disabled

**Services**

- [ ] Service sale creates zero stock rows and zero FIFO lots
- [ ] Service revenue separated from goods revenue in P&L
- [ ] Quotation → job → parts issued → completed → invoiced produces correct stock, FIFO cost and journals
- [ ] Offline sale of a service syncs cleanly
- [ ] All 12 templates walked end to end by a human

**Commercially ready**

- [ ] New landing, pricing and positioning pages built and reviewed
- [ ] Every marketing claim enforceable in code; the four Critical false promises in `extras/FEATURE_GATING_AUDIT.md` closed
- [ ] Only the 48 catalogued business types claimed anywhere public
- [ ] `classic` sunset date stated publicly
- [ ] Support briefed; opt-out path documented
- [ ] Reveal fortnight avoids customer peak season

---

## 09 — The weekly ritual

One page, every Friday. Four numbers and one question.

```
PARITY          7 suites · green days: __/14
SOAK            days since last Layer-A-attributable ticket: __
LATENCY         p95 vs baseline: __%
NEXT/           screens complete: __/12 · logic-leak violations: __

THIS WEEK'S PR QUESTION
   What does everything we merged this week do for a tenant
   with no configuration?
```

If the answer to that question is ever anything other than *"exactly what it did before"*, stop and fix it before writing another line. That single habit is the whole strategy.
