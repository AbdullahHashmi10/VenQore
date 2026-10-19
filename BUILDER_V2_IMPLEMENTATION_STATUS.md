# Builder v2 — implementation status (14 Oct 2026)

Implements `BUILDER_FINAL_PLAN.md` Phases 0–2 and the engine half of Phase 3/5. Nothing existing was changed or removed; everything is new files. The old builder is untouched and still the live path.

## What now exists

| Plan item | File(s) | State |
|---|---|---|
| §2 fact schema | `config/builder/facts.php` | Done. 60+ keys, 3 derived facts, source precedence |
| §3 question bank, exact copy | `config/builder/questions.php` | Done. Every question/option from the plan; Q4+till and Q6 share a screen; Q7 split into tax (band 4) and money tasks (band 6) |
| §4 rules table | `config/builder/workflows.php` | Done. W1–W26 plus gap rules; bundles are explicit |
| 48-module ledger | `config/builder/module_policy.php` | Done, all 48 classified |
| 85 type hints | `config/builder/type_hints.php` | Done. Generated from `business_types.php` + the coverage doc: starting template, question raises, unresolved facts, counterexample |
| §8 summary | `config/builder/summary.php`, `SummaryWriter` | Done |
| §7 + Phase 0 flags | `config/builder/capabilities.php`, `CapabilityGate` | Flags written from code evidence only. See "Phase 0" below |
| §5 selector and stop rules | `ScreenSelector` | Done: bands, type raises, screen counting, preview after 3, hard stop at 10, reasons logged beyond 8 |
| Composition | `WorkflowComposer`, `Condition`, `FactStore`, `BuilderSession` | Done: all reasons kept, closure + gate to a fixed point, overrides, conflicts, assumptions, gaps, gifts unpublished |
| Extraction | `FactExtractor` | Keyword path done; AI hook (`$ai` callable) is in place but not wired to `AiGateway` |
| §10 behaviour | `BuilderEngine` | start / answer / revise / override / missing / review / modulesFor |
| §12 tests | `tests/tests/Feature/Builder/BuilderEngineTest.php` | 25 tests, 11,471 assertions, all green (run with a plain-PHP harness, see below) |

## Phase 0 — what is and is not done

**Not done, and cannot be done by reading code:** walking each bundle's real task in the running product. 44 of 48 modules are therefore `registry_live` (registry says live, task not walked). `CapabilityGateTest` prints that count; it must reach 0 before launch (plan §14).

Set from code evidence:
- blocked (never composed, kept as a "coming soon" gap): `quotations`, `b2b_proposals`, `landed_cost`, `composite_items`
- `pos_pure_service = false` → pure services paid on the spot get a quick invoice, not the till, until someone proves POS works without a fake product
- `woocommerce = true` (WooSync exists); `marketplace_provider_selected = false` → no Daraz or other marketplace is offered
- tasks to walk are written in each module's `note` in `capabilities.php`

## Judgement calls I made (change if you disagree)

1. Picking a business type writes the sector's activity (goods / services / making) as an answer, so Q1 is skipped. Everything else the type "usually" does is only a disclosed assumption.
2. Bands 5–6 (users, stock places, money tasks, channels, rewards, attendance, offers) are never asked automatically: the plan stops at band 4. They stay reachable through "Change" and "Something's missing", and are listed as disclosed defaults. If you want Q6 (team / places) asked by default, it is one number in `questions.php`.
3. Skipping Q1 with no type asks it once more, then stops without guessing.
4. Table service now also brings `sales_returns` (registry already pulled in `pos` and `park_recall`).
5. The summary sentence says "goods" / "service work", not the catalogue label (it read as "grocery & kiryana stores").
6. `live_adds` only shows areas newly added by an answer; for a type-picked run the template already contains most areas, so it is often empty.

## Added in the second pass (backend + screens)

| Plan item | File(s) | State |
|---|---|---|
| §10 API | `app/Http/Controllers/BuilderDiscoveryController.php`, 12 routes `workspace.discover.*` in `routes/web.php` | Done. start, answer, back, resume, confirm-card, revise, override, search, catalogue, missing, readback-confirmed, review. Sessions live in cache for 3 hours. Everything 404s while `VQ_BUILDER_V2` is off |
| §6.7 provisioning | `WorkspaceBuilderController::provision` | Done. When `builder_session` is sent, the server composes the modules and ignores the browser's list. Old path unchanged when it is not sent |
| Switch | `config/venqore.php` → `builder_v2` (`VQ_BUILDER_V2`, default off); `AppServiceProvider` bindings | Done |
| "Something's missing" → demand log | `missing` endpoint writes `feature_requests` (source `builder_missing`) with the answers attached | Done |
| §11 telemetry | `BuilderTelemetry` + migration `builder_events` | Done for the builder events and `provisioned`. Not yet: after-signup events (module enabled by owner, search miss, Vena "where is", absent-feature tickets) |
| §6 screens | `resources/js/Components/Builder/v2/` (BuilderV2, QuestionScreen, ConfirmCard, Preview, ReadBack, MissingSomething, api) wired into `Pages/Workspace/BuildWorkspace.jsx` (shown as phase `v2` when the switch is on; plan, account and building steps are the existing ones) | Done and syntax-checked. NOT yet seen in a browser |
| §13 phase 7 playground | `php artisan builder:playground` | Terminal version done (facts, screens, reasons). The Platform HQ page is not built |

## Before you flip the switch

1. `php artisan migrate` (creates `builder_events`)
2. `php artisan ziggy:generate` (new named routes; your build runs an audit on them)
3. `php artisan config:clear && php artisan route:clear`
4. Set `VQ_BUILDER_V2=true` locally, open `/build-workspace?type=grocery` and walk it on a phone-width window
5. Run `BuilderEngineTest` and the Phase 0 walk-throughs (`capabilities.php` notes)

## Still not built

- Wire `FactExtractor` to `AiGateway` (feature key `builder_extract`)
- Phase 6 navigation grouping (Purchasing / Sell / Stock / Customers / Accounts parent areas with tabs; identity as fields inside item forms). This changes the main app's menu and needs its own pass
- Platform HQ "Builder Playground" page; after-signup telemetry and the Phase 10 safety net
- Plan entitlement callback for `CapabilityGate`
- Retire the old builder files (only after `VQ_BUILDER_V2` has run clean for 7 days)
- Phase 8 pilot with 12 owners, Phase 9 launch — yours

## How to run the tests

`BuilderEngineTest` uses plain `PHPUnit\Framework\TestCase` — no database. From `app-code/main-app`:
`php artisan test --filter=BuilderEngineTest`
(It was verified here with a stub runner because no PHP/Composer vendor tree was available on this machine's shell. Run it once in your normal environment.)
