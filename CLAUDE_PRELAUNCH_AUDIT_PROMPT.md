# VenQore: evidence-based prelaunch audit prompt

Copy the prompt below into Claude with access to this repository and, ideally, an isolated runnable application. This is an audit assignment, not permission to change production or implement fixes.

---

Act as a principal product engineer and independent prelaunch auditor. Audit VenQore end to end, covering business suitability, onboarding, AI behavior, backend enforcement, frontend behavior, data correctness, security, reliability, and honesty of customer-facing promises.

The central product promise is: a customer describes their business, answers a small number of useful questions, optionally chooses deeper discovery, reviews and confirms their proposed configuration, and receives software that fits those choices. The software must show and enable the relevant workflows, including details inside screens, without silently including unrelated functionality. Establish exactly where that promise holds and where it breaks. Do not claim perfection or certification: provide reproducible evidence, explicit coverage, and launch decisions.

## 1. Scope and operating rules

- Inspect the working tree first, including local uncommitted changes. Record commit, dirty files, date, environment, and commands. Preserve existing work. Do not assume HEAD represents the code being evaluated.
- Read applicable repository instructions. Identify the actual active application from bootstrapping, routes, imports, build configuration, and deployment configuration. Start with `app-code/main-app`; inspect `app-code/mobile-app` and `app-code/windows-app` if they participate in the shipping experience. Clearly identify which clients were verified.
- Treat `extras/BRAIN`, `_extra-legacy`, `_archive`, mockups, superseded pages, historical reports, and comments as context, not evidence of current execution. Trace reachability before attributing a defect in an old page to the shipped product. Do not trust hardcoded module counts or old route exports.
- This is an audit. You may create reports, isolated test fixtures, and non-destructive verification scripts. Do not edit production application behavior, deploy, commit, reset existing work, delete customer data, send messages, or execute real payments. Inspect test launchers and database targets before running them. Use synthetic users and a dedicated disposable database for mutations. Redact secrets and customer information.
- Work through the whole scope; do not stop after a few obvious issues. If tools, credentials, or runtime access are unavailable, continue independent static work and record exactly what remains unverified. Never turn “could not test” into “passed.”
- Keep an audit ledger so work can continue across context limits. Record completed files/surfaces, outstanding tests, findings, and next steps. Produce an interim report if constrained, explicitly labeled incomplete.

## 2. Establish the intended product contract

Before judging behavior, write a concise intended-versus-implemented contract. Distinguish:

1. Always-on platform infrastructure and internal transaction/accounting foundations.
2. Explicitly requested and confirmed modules.
3. Hard dependencies explained in, and accepted with, the final proposal.
4. Optional recommendations that remain off until accepted.
5. Explicit rejections, skipped questions, unanswered questions, and uncertain AI inferences.
6. Module-level features versus independently configurable subfeatures and presentation preferences.
7. Tenant enablement, plan entitlement, user permissions, module release status, and contextual relevance.

Absence of a request is not consent to an optional feature. Internal foundations can remain active without exposing an unrelated screen. Rejecting a module must not silently disable a valid core transaction. A necessary dependency conflicting with a rejection requires resolution and explanation, not a hidden override. Define “off” for visibility, API execution, background work, retained history, and future re-enablement separately.

For barcode scanning versus barcode/label generation, determine actual ownership and desired behavior separately; do not assume they are identical capabilities because their names overlap. If the current system cannot express the requested detail, report a product/architecture gap instead of inventing an existing setting.

My desired discovery experience is a short useful first round, a reviewable proposed system, an invitation to refine it through optional relevant questions, and an editable final confirmation. Essential ambiguity must still be resolved. Customers must be able to finish quickly, skip optional questions, go back, correct misunderstandings, and refine later. Coverage means every sellable module has a legitimate discovery/manual-selection path, not that every customer must answer a question about every module.

## 3. Repository starting points to verify

These were observed during a preliminary source inspection on 2026-09-12. Recheck them in the current working tree; they are leads, not completed audit findings. Paths below are relative to `app-code/main-app`.

- Registry and rules: `config/modules.php`, `config/ai_builder.php`, `config/qore.php`, `app/Engines/ModuleDependencyResolver.php`, `app/Engines/CapabilityDependencyResolver.php`.
- Discovery and application: `app/Services/AiBuilder/` including `CapabilityRegistry`, `BusinessUnderstanding`, `DiscoverySession`, `DiscoveryResolver`, `ConversationalBuilderService`, `ConfigurationValidator`, `ConfigurationAIService`, `ModificationParser`, `ModuleManifest`, and `ApplyConfigurationService`.
- Entry points: `app/Http/Controllers/WorkspaceBuilderController.php`, `BuilderController.php`, `OnboardingController.php`, `OnboardingExperienceController.php`, `routes/web.php`, other route files, and middleware registration.
- Builder UI: `resources/js/Pages/Workspace/BuildWorkspace.jsx`, `Pages/Builder/Index.jsx`, `Components/Builder/`, and any routed onboarding flow.
- Enforcement: `app/Services/ModuleService.php`, `app/Http/Middleware/EnsureModule.php`, `HandleInertiaRequests.php`, `app/Support/ModuleRouteMap.php`, `ModuleNavBuilder.php`, `ReportModuleMap.php`, and action-level permission/tenant policies.
- Surfaces: `resources/js/Layouts/OneGlanceLayout.jsx`, `Components/StockModuleTabs.jsx`, `SellModuleTabs.jsx`, `MoneyModuleTabs.jsx`, `ContactsModuleTabs.jsx`, `PurchaseModuleTabs.jsx`, and `ReportsNavigation.jsx`.
- Dashboard and intelligence: `app/Services/Dashboard/DashboardRegistry.php`, `app/Traits/ResolvesDashboardWidgets.php`, dashboard controllers, `app/Reckoner/`, `app/Services/Growth/InsightCatalog.php`, `resources/js/Pages/NewDashboard.jsx`, and `resources/js/Dashboard/`.
- Terminology: `app/Support/Terms.php`, its frontend consumers, preset terminology, and persisted overrides.
- Verification: `tests/tests/Feature/Module/`, `tests/tests/Unit/AiBuilder/`, `tests/phpunit.xml`, `phpunit.xml.dist`, `tests/README.md`, and `package.json` scripts. Discover the actual test collector and JS/browser tests before trusting historical suite counts.

Specific leads:

- `DiscoverySession` defines four opening turns and ten deeper turns, separate confirmed/rejected/skipped collections, and a 30-minute TTL. Prove these rules work through the routed browser flow and survive refresh, expiry, correction, and auth handoff.
- The module registry documents field-level settings as deferred. Explicitly compare that design boundary with our stronger personalization promise.
- `StockModuleTabs` and `SellModuleTabs` contain fixed feature groups; the former is imported by inventory screens. Verify all relevant render paths and gates, including manufacturing, recurring invoices, reminders, and e-invoicing.
- `ModuleService::enabled()` returns true for unknown module keys, no configuration rows, and missing individual keys. `EnsureModule` allows unclaimed routes; report mapping also documents permissive defaults. Examine migration compatibility, fresh signups, new registry entries, API coverage, and real bypass potential. Do not call a security exploit proven merely because a module gate is permissive; inspect the remaining authorization layers.
- `ApplyConfigurationService` validates dependencies, snapshots configuration, writes module rows, applies terminology, and invalidates caches in a transaction. Verify atomicity, authorization, confirmation binding, concurrency, cache timing, and restore behavior rather than accepting the comments.
- Test documentation describes historical collection problems. Verify which tests run today and whether test-only tenant handling hides production defects.

## 4. Build inventories and traceability before scoring

Generate a complete current inventory of modules, release status, capabilities, presets, questions/conditions, aliases, dependency edges, settings, route ownership, screens/subscreens, cards, report/export types, insights, AI tools, scheduled jobs, and data ownership. Reconcile implemented features absent from registries and registry entries without working implementations.

Produce a module traceability matrix with one row per module and linked subfeature rows where behavior differs:

`module → user need → question/manual path → capability mapping → preset/default origin → proposal explanation/consent → saved configuration → dependency handling → backend read/write gates → UI surfaces/fields → dashboards/reports/AI → terminology → off/on tests → evidence → verdict`.

Use a separate surface inventory if necessary. Inventory every relevant surface; then identify which items have static review, runtime tests, or no verification. Record denominators, not just percentages. Explicitly identify orphan routes, unmapped cards/reports, unreachable questions, unsupported promises, duplicate authorities, and drift between registries and actual code.

## 5. Audit workstreams

### A. Discovery, AI, and confirmation

Trace real customer language through facts, questions, capabilities, modules, validation, preview, and application. Check generic businesses, mixed businesses, atypical operations, local terminology/Roman Urdu where supported, typos, negation, conflicting answers, changes of mind, and explicit exclusions. Trade presets must not override facts or prevent legitimate cross-category needs.

Audit relevance, progressive disclosure, repeated questions, skip semantics, branching, readiness/confidence claims, optional deepening, manual selection, backtracking, and accessibility. A confidence number must not be presented as proof of operational readiness.

Test unsupported requests, non-live modules, hallucinated keys, malformed provider output, prompt injection, timeout, provider outage, quota exhaustion, fallback behavior, and retries. Verify deterministic validation on all entry points, not only the happy path. Distinguish mocked AI tests from live-provider checks, and record repeated-run consistency where feasible.

Verify session ownership, expiry, anonymous-to-authenticated transfer, tenant provisioning, authorization, rate limiting, and replay resistance. Confirm the applied configuration exactly matches the version the user reviewed, including dependency additions, terminology, exclusions, and late edits. Test forged requests bypassing the UI, double submission, stale previews, and two concurrent tabs.

### B. Backend and configuration lifecycle

Trace module gating through web, JSON/API, direct URLs, reads, writes, exports/imports, bulk operations, nested resources, AJAX endpoints, background jobs, and alternate clients. Examine wildcard collisions, shared-route ANY/ALL semantics, unnamed routes, platform exemptions, missing rows, migration/backfill gaps, and new modules added after tenant creation.

Verify module enablement is distinct from action-level permission and tenant isolation. Use two tenants and multiple roles; test IDs belonging to another tenant, stored configuration ownership, and cached responses. UI hiding alone is not enforcement.

Test enable, disable, re-enable, undo, dependency removal, existing-data warnings, partial failure, and concurrent changes. Preserve historical records and accounting integrity. Validate cache/worker refresh, config version consistency, audit trails, and stale sessions. Document what happens to queued/offline transactions created before a module or permission is revoked.

### C. Frontend and every nested surface

Inspect the rendered sidebar and all Sell, Money, Contacts, Products/Stock, Purchase, Reports, and other discovered sections. Inspect tabs, subtabs, buttons, forms, columns, filters, dropdown options, settings, empty states, dialogs, context menus, keyboard shortcuts, global search, command palettes, mobile navigation, quick actions, onboarding tips, and links in notifications.

For each surface test both inclusion and exclusion. Verify POS absent when not selected; irrelevant barcode controls absent according to the agreed subfeature contract; manufacturing/cookbook/production absent for non-manufacturing businesses; service-only businesses free from mandatory stock/product workflows; unrelated supplier/customer/credit features absent. Also prove selected workflows remain usable.

Check empty parent groups, invalid default tabs, saved deep links, stale browser props, reloads, multi-tab changes, and error handling. Test accessible navigation and responsive behavior at relevant desktop/mobile widths. Identify mock/demo data that reaches real customer screens. Trace the routed POS implementation instead of assuming a folder named NewPos is active.

### D. Dashboards, reports, insights, and AI output

Inspect default cards, card picker, saved layouts, custom dashboards, drilldowns, feeds, search, exports, scheduled reports, recommendations, alerts, AI prompts/tool permissions, and generated narratives. Disabled or unauthorized capabilities must not leak through alternate surfaces or API payloads.

Test module removal after a card/report was saved; backend data access as well as rendering; role-specific financial visibility; mixed-module formulas; empty states; disabled versus zero-activity states; and stale caches. A report can exist but still be misleading if its formula assumes a disabled input module.

For financial and stock outputs, reconcile representative seeded transactions through source records, calculations, dashboard, report, export, and AI summary. Include returns, partial payment, discounts, tax, costs, dates/timezones, currency/rounding, and relevant cancellation/reversal cases. Distinguish internal accounting records from optional user-facing modules.

### E. Terminology and business fit

Trace business vocabulary from discovery/preset through persistence to navigation, singular/plural headings, forms, validation, empty states, cards, reports, exports, printed documents, notifications, and AI output. Check fallback labels, hardcoded words, stale caches, tenant switching, and safe rendering of customer-defined terms. Assess whether each configured business can complete its actual core job without irrelevant mandatory fields or concepts.

### F. Broader launch risks and truthful positioning

Inspect authentication/authorization, tenant isolation, secret handling, AI data exposure, financial integrity, offline sync/idempotency/conflicts, migrations, backup/restore evidence, rollback, error recovery, observability, and representative performance. Check that production startup/build and test commands reflect the current repo. Bound this review honestly; do not describe it as a penetration test or legal certification.

Inventory marketing, pricing, onboarding, and AI capability claims from current source and available supplied launch material. Map each claim to implementation and runtime evidence. Classify supported, partly supported, unsupported, or unverified, and recommend exact safer copy where evidence falls short. Clarify configured existing modules versus AI-generated custom functionality if the customer language blurs that distinction.

## 6. Required verification strategy

Use every module for static traceability and an on/off contract check where runnable. Do not attempt to claim exhaustive coverage of all combinations. Cover every dependency edge, conflict, shared-route rule, and high-risk interaction; add pairwise combinations where practical and report residual combinatorial risk.

Use these scenarios as a minimum, derive exact valid configurations from the registry, and record expected/actual modules and visible/hidden surfaces:

1. Freelancer: services and invoicing; no POS, inventory, barcodes, or manufacturing.
2. Small shop: basic products/POS; explicitly declines barcode functionality and production.
3. Product catalogue/invoicing business: no POS; product-related routes must still work.
4. Bakery that only resells versus bakery that makes goods: distinguish production needs.
5. Restaurant versus takeaway-only business: distinguish tables/KOT/delivery requirements.
6. Repair business: labor and spare parts; track legitimate mixed products/services needs.
7. Pharmacy and clothing business: relevant batch/expiry versus variants questions, without stereotyping explicit exceptions.
8. Wholesale business: relevant supplier, purchasing, credit and pricing workflows.
9. Reports enabled with inventory/manufacturing disabled; test direct report/export access.
10. Existing configured tenant disables a used module and then re-enables/restores it.
11. Fresh signup, legacy tenant with no rows, and configured tenant missing a newly introduced key.
12. Owner versus restricted employee across two tenants, with cached cards and direct API calls.
13. Skipped discovery, optional deeper round, corrections, explicit rejection, expired session, and failed AI provider.
14. Stale browser/offline client submitting after configuration or permissions change.

Use realistic non-test-store tenant identifiers where special test handling exists. Verify actual test collection and assertions, not only green exit codes. Existing tests are evidence only for the behavior they assert. Add minimal isolated reproductions for uncovered high-risk behavior. Run appropriate discovered PHP/JS tests and browser checks safely; record commands, environment, pass/fail/skip counts, and limitations. No runtime access means runtime verdict remains unverified.

## 7. Evidence and finding standards

For each finding provide:

- Stable ID, concise title, severity, confidence, and category (implementation defect, design gap, misleading claim, test gap, or unresolved product decision).
- Affected persona/configuration/role and the violated intended contract.
- Expected versus actual behavior; exact trigger/reproduction and minimal fixture.
- Current source path and line references, traced caller/route, and runtime evidence where available. Clearly separate source-proven behavior from observed runtime behavior and hypotheses.
- Business/customer impact, technical root cause, affected surfaces, and likely blast radius.
- Concrete recommended correction, dependencies, rough effort with uncertainty, and an acceptance test proving the issue stays fixed.

Severity: Critical = tenant/data compromise, destructive corruption, or comparable immediate launch danger; High = core promise or common business workflow broken; Medium = meaningful narrower functionality/UX defect; Low = minor polish. Mark launch-blocking separately and explain why. Deduplicate root causes but preserve every affected surface. Do not inflate severity based on a suspicious comment alone.

## 8. Deliverables and completion criteria

Write reviewable artifacts in a new audit output directory:

1. `AUDIT_REPORT.md`: plain-English executive assessment; intended contract; implemented architecture; proven strengths; findings; limitations; launch verdict per affected persona/claim and overall.
2. `MODULE_TRACEABILITY.csv`: every discovered module and its end-to-end evidence, with links to subfeature detail.
3. `SURFACE_COVERAGE.csv`: every relevant screen/subscreen/card/report/API surface, ownership and tested configuration, static/runtime status, and evidence.
4. `DISCOVERY_COVERAGE.md`: every capability/question mapping, unreachable/missing paths, exclusions and mixed-business handling, and recommended short/deep discovery design grounded in findings.
5. `SCENARIO_RESULTS.md`: exact fixtures/configurations, commands, expected/actual results, and screenshots or logs where useful.
6. `CLAIMS_VS_REALITY.md`: customer-facing promises mapped to working evidence and recommended wording.
7. `FIX_PLAN.md`: ordered launch blockers and follow-ups, grouped by root cause, dependencies, effort, and measurable acceptance criteria. Separate necessary fixes from redesign proposals.
8. `AUDIT_LEDGER.md`: inventory totals, verified coverage, blocked checks, residual risks, and continuation instructions if unfinished.

Do not mark the audit complete until every inventory item has an explicit status and the stated scope is accounted for. Use verified-pass, verified-fail, static-only, blocked, not-tested, or not-applicable with justification; never count static-only as runtime-pass. Recommend READY only when the critical launch contracts have adequate executed evidence and no unresolved launch blockers. Otherwise use NOT READY or INSUFFICIENT EVIDENCE, identify the exact gates still outstanding, and provide a practical route to resolving them.

End with a concise owner-facing answer: What can we honestly sell today? Which business configurations work? What must be fixed before launch? What do we still not know? What should we change first?
