# VenQore — permission-safe dashboards and staff presets

Prepared September 30, 2026. Give this file to the IDE agent in the VenQore repository.

## Request to the IDE

Implement the smallest complete, tested version of permission-safe dashboards using existing components, cards, resolvers and permission keys. Fix information exposure, inappropriate actions, empty dashboard slots and the financial total. Add reusable staff presets only after the access rules are reliable. Do not build all the optional card proposals.

Read applicable repository instructions and inspect the current changes first. Preserve unrelated work. This repository already contains dashboard and permission changes: audit and finish them rather than repeating or overwriting them. The HTML files are planning references, not evidence that the proposed rules or data scopes are implemented.

## Time and scope

These are rough engineering estimates, not measured completion promises. They assume a working local environment, existing usable resolvers and no large data or permission migration.

| Milestone | Rough effort | Delivery |
|---|---|---|
| Focused first milestone | 2–3 hours | Audit the existing implementation; fix and test the highest-priority sidebar, action and payload leaks; correct the balance formula where the source is already available. This is not a promise of complete coverage. |
| Reuse-first release | Approximately one working day, 6–8 hours | Complete all dashboard variants, server enforcement, layout cleanup, usable existing-card/action defaults, essential preset assignment and regression checks, if the existing architecture supports reuse. |
| Full optional roadmap | Multiple days; estimate after source audit | All 25 card/scope proposals, new data sources, extensive new workflows and rollout work. Excluded from the first release. |

Start with a short source audit and revise these estimates using actual gaps. If the complete reuse-first release will exceed one working day, finish a safe, reviewable patch for the core issues and report the unfinished scope. Do not start optional features or claim the whole release is done. Do not remove necessary authorization tests to meet a deadline. Do not deploy a partially protected dashboard; keep affected surfaces unavailable until their data access is verified.

## References and entry points

- `extras/VENQORE_STAFF_PRESETS_DASHBOARD_PLANNER.html`: 32 proposed staff templates, 77 permission decisions, 364 card definitions and 25 optional proposals. Embedded `PLAN` is the structured planning data.
- `extras/VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html`: module dependencies and the earlier permission/card map. Preserve this file.
- Application root: `app-code/main-app`.
- `config/permissions.php`: authoritative permission vocabulary; confirm the current count instead of assuming the snapshot still matches.
- `resources/js/Pages/Admin/Users.jsx`: staff permission assignment and presets; inspect its actual server validation and persistence path too.
- `app/Services/Dashboard/CardAccessPolicy.php`, `DashboardRegistry.php`, `DashboardPresenter.php`.
- `config/dashboard_access.php`, `resources/data/reckoner/cards.json`, Reckoner registry/resolvers and `app/Traits/ResolvesDashboardWidgets.php`.
- `app/Http/Controllers/DashboardController.php`, dashboard data/drill/export routes and their middleware.
- `resources/js/Components/V6FinancialSidebar.jsx`, `resources/js/Pages/NewDashboard.jsx`, `resources/js/Pages/Next/Dashboard.jsx`, the dashboard builder/picker components and `resources/js/Hooks/usePermission.js`.

Discover all other active sidebar/dashboard variants and shared data providers. These paths are starting points, not the complete scope.

Observed risks to verify: the inspected card policy allows an empty permission list and ordinarily matches any declared permission; the inspected sidebar maps Add Bank to `finance.transactions`. Verify unknown-card behavior, all-of requirements, export overrides and the actual bank-creation authorization. Do not treat these observations as proof that every current route is vulnerable.

## Required implementation

### 1. One permission contract, enforced before data leaves the server

- Reuse the existing access policy and catalogue where possible. Do not introduce a competing role-based dashboard rules engine.
- Eligibility must include effective user grants, enabled modules and dependencies, tenant/branch scope, feature availability and a working resolver. Resolve grants using the application's real custom-role/inheritance semantics; make replacement versus additive behavior explicit.
- Support alternative permission clauses where needed: OR between alternatives, AND within each alternative. A list of required companion grants must never become an any-one-grant check.
- Treat unknown card IDs, unresolved mappings and missing resolvers as unavailable. A permission-free card is allowed only when explicitly classified as safe, not because its metadata is missing.
- Enforce the same rule for initial page props, card APIs, sidebar APIs, refreshes, drill-downs and exports. Filter before querying/serializing sensitive records. UI hiding alone is insufficient.
- A write grant does not imply unrestricted reads. Own work requires an actual authenticated-actor/session/assignment filter before aggregation. A planning clause such as `pos.checkout → own_session` cannot safely reuse an all-store sales resolver unchanged.
- Export must require both export authority and source-read/record-scope authority, including any override path.
- Invalidate or re-filter user-specific cached data and saved layouts after grants change; prevent cross-user and cross-tenant cache reuse.

### 2. All sidebar variants, cards and actions

- Enumerate each active variant and document where its values and actions originate. Use shared eligibility instead of independent scattered role-name checks.
- Cash, bank identity/details and balances require their exact read authority. Stock quantities and stock valuation are separate capabilities; cost-sensitive data must not follow from basic product lookup.
- Gate sales, expenses, money-in/out, activity feeds and trends individually. Generic dashboard access or checkout access must not unlock them.
- Check each button and nested menu item against its destination operation and required context. Include New Invoice, Purchase, Add Bank, payments, refunds, transfers, exports and More Actions.
- Hide empty menus/sections. If a user has no eligible sidebar content, hide the entire analytics sidebar and reclaim its width across desktop and mobile variants.
- Apply filtering to defaults, saved layouts, the card picker, customization and restored preferences. Unauthorized cards must not flash on initial render or appear as disabled placeholders.
- Preserve valid personal or assigned approval cards; never use approval decision grants as unrestricted read authority.

### 3. Fix Total Balance with a defined source

- Define this sidebar value as cash plus bank balances. Inventory valuation is a separate asset reading, excluded from this total.
- Compute the total from the same authorized accounts, accounting basis, currency, branch scope and snapshot as the displayed breakdown. Avoid double-counting a cash account already in the bank/account collection.
- For restricted account visibility, label the result as the total of visible accounts; do not reveal hidden balances through an aggregate. Do not silently substitute this for an existing business-wide accounting total elsewhere.
- Do not sum mixed currencies without a defined conversion. If conversion is unsupported, separate totals by currency. Respect configured decimal precision and sign rules.
- Missing/failed data is unavailable, not zero. A genuine successful empty result may be zero.
- Trace and remove demo/fallback values from these production paths. Do not purge unrelated development fixtures or customer data.

### 4. Useful dashboards through reuse

- First reuse verified, authorized existing cards: personal submissions, assigned review queues and domain-specific operational cards.
- Where a numeric card has no safe source, show a useful permitted workflow action using the current action-card component. For a checkout operator, opening POS is useful; company finances are not required to fill the screen.
- Action-only and context-only permissions do not each need a new statistic. Discounting, voiding, deleting and approving may require a current cart/document and companion access. Explain missing prerequisites in staff setup; do not broaden grants automatically.
- Compact the grid. Do not retain repeated Add a card slots in the normal dashboard. Offer a single customization control only when supported and useful.
- No sample balances, invented chart points, fake activity or fabricated counters. Genuine empty states are allowed for authorized, working cards; loading/error/zero/unauthorized must remain distinct.
- A user with no usable grants should see a clear access explanation. Do not promise a metric for an isolated permission that cannot safely read anything.

### 5. Staff presets without an account migration

- Reuse the existing staff invitation/edit form and preset selector. Do not build a separate role-management application.
- Read the 32 template definitions from the new planner, verify their keys and scope, then store approved defaults in one maintainable application configuration. Treat them as starting grant sets, never authorization bypasses.
- Group templates by job function and keep grants editable for custom users. Selecting a preset must preview its grants and explicitly replace or merge according to a visible choice; do not retain hidden previous grants.
- Keep sensitive grants opt-in. Restrict owner-reference templates appropriately. Permission assignment endpoints must prevent unauthorized privilege escalation.
- Reconcile the snapshot discrepancy of 77 backend keys versus 54 staff-editor choices. Determine which omitted keys are assignable, contextual or reserved; do not expose all keys to every manager merely to match a count.
- If a preset requires a proposed source or unsupported scope, mark the limitation or omit that proposed card. Do not describe broader inventory access as isolated production access.
- Do not create live users, overwrite existing staff grants, migrate all users into new templates or change subscription modules automatically.

## Explicitly deferred

The 25 planner proposals are a backlog, not release requirements. Defer new resolvers, personal financial queues, fiscal calendars, recovery/export-job panels, new metrics, new schema and bespoke dashboards unless a narrowly scoped extension is necessary for the core acceptance checks and fits the revised estimate. Do not add permissions. Do not redesign the UI or build one dashboard per role.

If time is short, priority is server data protection → sidebar/action protection → total correctness → compact useful defaults → preset convenience → optional cards. Report incomplete preset work instead of rushing access control.

## Acceptance evidence

Use the existing test framework. Add meaningful regression tests around actual policies/endpoints and representative UI behavior, not tests that merely repeat a hardcoded mapping.

1. Checkout-only/custom cashier: can use authorized checkout and own work; cannot receive bank details, company cash, stock value/trend, purchase controls or unauthorized invoice buttons in HTML/JSON, card picker, sidebar or direct API requests.
2. Creation-only user: can start the permitted workflow without receiving global sales/purchase/payment totals.
3. Stock lookup versus cost/report grants: quantities do not expose valuation or purchase costs; disabled modules/dependencies remove affected content.
4. Finance reader versus payment/refund operator: read/write permissions stay separate; direct mutations, links and menus follow the same contract.
5. Approval maker versus reviewer: own/assigned records only; review decisions require exact document/action authority.
6. Custom mixed grants: outcomes follow permissions, not role names; all-of companion requirements hold. Parameterize checks across all current permission keys and validate all 32 templates for valid grants and usable authorized content/actions.
7. Access revocation, saved layouts, refresh/cache, another tenant and another user's session cannot restore or leak denied content.
8. Total fixtures cover cash plus multiple banks, negative balances, duplicate accounts, partial visibility, missing data, decimal precision and currency separation. Stock remains excluded.
9. Every active sidebar variant hides unauthorized buttons/rows and collapses when empty. Verify narrow/mobile layout and initial render as well as final rendered state.
10. Unknown/unimplemented cards and resolver failures never become fake zero cards. Real authorized zero-activity results remain accurate.

Run the targeted tests and normal frontend build/lint gates applicable to the changed files. Record commands and outcomes. If tests cannot run, identify the exact limitation and do not call the patch verified.

## Delivery and stopping point

Deliver a reviewable local patch with a summary of changed files, actual permission rules, tested variants, corrected total source, preset availability, remaining risks and deferred proposals. Preserve the two HTML planning files. Do not deploy or create accounts as part of this handoff.

If the one-day scope is infeasible, state what was safely completed, what remains unprotected or unavailable and the revised effort. Leave incomplete sensitive surfaces disabled or behind the established feature control; do not declare success merely because the UI looks correct.
