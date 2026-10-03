# Dashboard cards and editor — implementation handoff for Claude

Date: 2026-10-03  
Repository root: `E:\AMD POS\AMD POS`  
Production application: `app-code/main-app`  
Status: implementation plan; production work is not performed by this document.

## 1. Start here

**Build a polished, data-correct dashboard card system, beginning with Sales. Preserve the visual language of the existing dashboard modal editor, extend its controls, and use the actual BKLIT components wherever applicable.**

The user will give this plan to Claude for implementation. Codex will subsequently review the implementation, its visual behavior, and its coverage against the requirement IDs below. Do not treat the prototype as a finished design or copy its shortcuts into production.

Suggested instruction to Claude:

> Implement `extras/mockups/DASHBOARD_IMPLEMENTATION_HANDOFF.md` in phases. First inspect the current production routes, editor, layout rules, persistence, and BKLIT components. Preserve unrelated work. Establish the shared architecture and complete Sales end to end before migrating other cards. Match the existing NewDashboard modal editor's visual presentation, with the additional capabilities specified here. Use real data contracts and explicitly report unsupported capabilities. Produce a requirement coverage report, actual browser screenshots, test results, and remaining issues for Codex review. Do not call the implementation complete based only on a build or on the HTML prototype.

### Authority and scope

1. The user's requirements in this document govern behavior.
2. The existing **NewDashboard modal editor / StylePanel** and the user's screenshot govern the editor's visual language: mint identity panel, size tiles, chart/style pills, background swatches, pale grid preview, and fixed footer.
3. `extras/mockups/sales-card-studio.html` demonstrates the proposed range of controls and chart types. Its current visual quality and implementation details are **not approved production standards**.
4. The actual production layout constants, metric definitions, authorization, and persisted contracts govern integration.
5. Reinspect the checkout before implementation; file names and findings below are a starting map, not permission to overwrite newer work.

The repository contains substantial unrelated Commerce changes. Do not reset, reformat, or revert them. Do not edit `app-code/production-clean-repo` as a substitute for the active application. Do not deploy, remove legacy routes, or rewrite the entire dashboard framework as incidental work.

## 2. What success looks like

- A Sales card gives a clear business answer at its chosen size, with truthful values and an appropriate visual representation.
- Users can choose a number tile, a chart, or a suitable list; they see only compatible choices or an explicit explanation of missing data.
- Width and height changes visibly change the live preview. Width uses grid columns; height uses rows. Full width fills the available board after side panels.
- Cards contain no internal scrollbars. Content fits by design, without microscopic text or indiscriminate clipping.
- The editor looks like the current polished dashboard editor, expanded to accommodate richer options. It does not become a generic wall of dropdowns.
- The preview and saved card use the same rendering and sizing pipeline.
- Chart types and variants are shared components, not separately authored combinations for every metric, size, and theme.
- Data availability, reconciliation, permissions, and sparse series are represented honestly.
- Existing layouts and users' preferences survive migration, with reversible rollout.

## 3. Source map and integration audit

All paths in this section are relative to `app-code/main-app`, unless stated otherwise.

| Area | Starting files | Required investigation |
|---|---|---|
| Actual visual reference | `resources/js/Pages/NewDashboard.jsx` — `StylePanel`, step-two editor, preview and resize handlers | Extract/reuse its design vocabulary and behavior; avoid another competing editor implementation. |
| Other editor paths | `resources/js/Dashboard/components/DashboardCardEditor.jsx`, `AddCardModal.jsx`, `DashboardBuilderSheet.jsx` | Identify callers. The older narrow drawer is not the user's visual reference. Bring applicable entry points onto shared controls. |
| Chart and layout decisions | `resources/js/Dashboard/chartRegistry.js`, `variantLaw.js`, `layoutLaw.js` | Audit aliases, unsupported families, and geometry restrictions before extending. |
| Layout constants | `resources/layout-law.json` | Current contract: 12 columns, 64px row unit, 24px gutter. Preserve a shared source of truth. |
| Chart rendering | `resources/js/Dashboard/charts/`, especially `kit.jsx`; `resources/js/Components/Charts/` | Inventory genuine BKLIT components versus fallbacks. Audit series padding and rendering ownership. |
| Server validation | `app/Reckoner/DashboardSanitizer.php`, `app/Reckoner/LayoutLaw.php` | Keep client/server geometry, variants, periods, permissions, and capability validation consistent. |
| Metric calculations | `app/Reckoner/Engine/MeasureEngine.php` | Trace actual Sales/revenue definitions, trend data, dimensions, and exclusions. |
| Persistence | `app/Models/DashboardCard.php`, `app/Http/Controllers/Api/DashboardController.php` | Trace validation, fillable/casts, serialization, save and reload for every setting. |
| Existing spec migration | `database/migrations/2026_09_16_000020_add_spec_to_dashboard_cards.php` | Already adds `spec` and `definition_version`; do not blindly add another migration. The inspected model did not list these in its fillable/casts. Verify whether and how these fields are used. |
| Dashboard composition | `app/Services/Dashboard/` — registry, presenter, access policy, frame services | Integrate with existing definitions, packing, permissions, and presentation. |
| Route ownership | `routes/web.php`, dashboard controllers | Trace `/dashboard`, `/new-dashboard`, `/dashboard-v1`, `/home`, `/overview`, `/workspace` to their real renderers. Identify the supported destination and affected entry points. Do not assume they are interchangeable. |

Existing APIs include `/api/reckoner/read`, dashboard/card CRUD under `/api/dashboards`, and layout update endpoints. Extend appropriate existing contracts rather than introducing a parallel dashboard API without justification.

Prototype sources, relative to repository root:

- `extras/bklit-ui/sales-studio/{App.jsx,EditorDemo.jsx,AutoCard.jsx,Charts.jsx,model.js,studio.css,ProductionNotes.jsx}`
- `extras/bklit-ui/sales-studio/model.test.mjs`
- `extras/bklit-ui/src/components/charts/`
- `extras/bklit-ui/build-sales-studio.mjs`
- `extras/mockups/sales-card-studio.html` and `sales-card-system.html`

Audit installed versions before importing. Production currently uses React 18; prototype code and downloaded components may assume a newer React/toolchain. Preserve production compatibility, SSR safety, styling utilities, fonts, and existing design tokens. Record upstream component provenance and license requirements. Check current official BKLIT documentation/source when needed; downloading everything does not automatically wire its behavior into the application.

## 4. Shared architecture — avoid thousands of bespoke cards

Implement five cooperating layers using existing structures wherever practical:

1. **Metric definition:** stable ID, business meaning, unit, aggregation, allowed dimensions, permission requirements, query inputs, and supported data capabilities.
2. **Data adapter:** converts authorized real responses into a documented shape; it does not invent missing history, targets, or relationships.
3. **Visualization definition:** family, actual variants, required data shape, supported features, minimum content area, legend and label strategy, loading behavior.
4. **Card specification:** user's metric/query, presentation, requested grid geometry, appearance, visible actions, and optional goal reference.
5. **Shared card renderer and geometry resolver:** consumed by the live dashboard and editor preview, with the same state handling and content budgets.

Think `metric × compatible renderer × configuration`, with a tested renderer per family. A new metric should normally need an adapter/definition, not copies of every chart at every size.

Keep metric identity separate from display title and presentation. Changing Sales from area to bar must not change the measure from recognized revenue to orders, payments, or pipeline value.

### Proposed configuration responsibilities

Use the existing schema if it can carry these responsibilities cleanly; the following is a logical contract, not a demand for new field names:

| Responsibility | Persisted information |
|---|---|
| Identity | Stable definition ID/version and optional title override |
| Query | Period, custom dates, granularity, authorized filters/dimensions, comparison policy |
| Presentation | Family, variant, legend, label density, supported variant options |
| Geometry | Requested columns/rows, full-width intent where applicable, placement; distinguish requested from effective geometry |
| Appearance | Existing surface token, supported accent, motion preference, border/glare options |
| Card face | Timeframe caption/picker, comparison, open action and other supported buttons |
| Goal | Goal reference/version or supported goal settings; never just a fabricated percentage |

Validate server-side; do not persist arbitrary rendering code or unvalidated navigation URLs. Defaults must be versioned and migrations idempotent. On new invalid input return a meaningful validation error; legacy normalization must be explicit and documented.

## 5. Capability matrix and chart coverage

The prototype offers the variants below. Inventory them against actual BKLIT source and production support. Each exposed variant must visibly implement its promised behavior; multiple names pointing to the same generic fallback do not satisfy coverage.

| Family | Required data and meaning | Candidate variants |
|---|---|---|
| Number | Scalar with unit; comparison needs a comparable prior value; progress needs a target | Value, comparison, progress |
| Area | Ordered time series; cumulative/stacked meaning explicit | Gradient, step, soft, fade, pattern, markers |
| Line | Ordered observations with timestamps; gap policy explicit | Smooth, straight, step, markers, dashed tail |
| Bar | Comparable categories or time buckets; stacked series must be additive | Vertical, horizontal, square, pattern |
| Composed | Aligned compatible series; axes and units explained | Columns + line, grouped, stacked, stacked + line |
| Funnel | Ordered stages for a defined cohort/time window; conversion denominator known | Vertical, horizontal, straight, gradient, grouped labels |
| Gauge | Actual and target/range, direction of success, period and unit | Arc, linear, gradient, dense |
| Heatmap | Two-dimensional buckets, value scale, missing-versus-zero policy | Rounded, square, spaced |
| Live line | Genuine changing timestamped data with freshness/reconnection semantics | Filled, line only, momentum |
| Pie/donut | Nonnegative parts of the same whole; limited categories and totals | Solid, donut, legend, grow, pattern, half |
| Radar | Several comparable or explicitly normalized dimensions | Filled, outline, points |
| Ring | Progress measures and their individual denominators/targets | Full, three-quarter, half, legend, butt caps |
| Scatter | Paired observations, x/y units, optional third measure | Dots, rings, gradient |
| Sankey | Source/target weighted flows with valid nodes and explained losses | Gradient, solid, no labels |
| Sunburst | Hierarchy with consistent parent/child aggregation | Drilldown, labeled |
| Records | Authorized row records with stable IDs and useful columns/actions | Table, activity/feed |

Candlestick and choropleth are explicitly outside this scope.

**Compatibility rules:**

- A sales total alone supports a number, not a funnel, heatmap, scatter, or Sankey.
- Channel shares can support bars/pie; channel achievement rings additionally require channel targets. Do not confuse share of sales with progress toward a goal.
- An order lifecycle is not automatically a valid funnel: define cohort, stage ordering, re-entry, cancellation, and observation window.
- Financial values with negatives/refunds may invalidate pie/flow assumptions. Use an appropriate alternative with an explanation.
- Sales amount, gross profit, payments received, order count, and net revenue are distinct measures. Preserve the existing ledger-backed definition until a deliberate product decision changes it.
- Size selection never silently changes the metric, dataset, or chart family. Offer an explicit compatible alternative or explain the minimum size.
- In production, never switch to mock data when the selected chart's requirements are missing.
- Keep a development showcase for all implementations, separate from the customer editor's capability-filtered choices.

For Sales, deliver a capability audit with statuses: **supported now**, **requires real adapter/query**, **requires product definition**, **not applicable**. Do not claim full Sales support merely because every family renders with fixtures. For missing capabilities document the actual source/query and remaining work.

## 6. Layout and sizing requirements

| ID | Requirement and acceptance condition |
|---|---|
| L01 | Use the production 12-column board, 64px row unit, and exactly 24px gutters horizontally and vertically. Use shared constants on client/server. |
| L02 | Height is an integer row count: `height = rows × 64 + (rows − 1) × 24`. Examples: 1 row = 64px; 4 = 328px; 6 = 504px; 8 = 680px. Custom controls show rows, not arbitrary pixel height. |
| L03 | For available inner board width B, column width is `(B − 11 × 24) / 12`; a c-column card is `c × columnWidth + (c − 1) × 24`. Recompute from the actual container, not window width alone. Respect the application's existing responsive column policy if narrow screens change column count. |
| L04 | Offer meaningful tile, compact, square, portrait, standard, wide, full-width and custom choices when compatible. Map these to legal spans/minimums rather than fixed pixel rectangles. |
| L05 | Full width is an explicit intent that fills the remaining dashboard board, not the viewport behind the navigation or right panel. Persist and restore that intent. |
| L06 | Account for header, title, headline, controls, chart, legend and footer before choosing minimum rows. Legal sizes must be readable. If a requested size is too small, show why and resolve predictably. |
| L07 | Preserve preferred dimensions across temporary narrow viewports. Report effective dimensions when different. Do not permanently overwrite the desktop preference during responsive fitting. |
| L08 | No internal scrolling in cards. Long records use a bounded excerpt with total count and an external detail action; long legends use documented aggregation or a larger legal size. Never silently hide critical values with overflow clipping. |
| L09 | Ring/pie/gauge centers must fit inside their actual inner geometry at readable on-screen sizes. Abbreviate large amounts with full accessible/tooltip values. If there is no room, move the label outside or raise minimum size instead of shrinking indefinitely. |
| L10 | Packing preserves stable order, non-overlap, 24px gutters and reasonable density after add/remove/resize. Use existing packing semantics where possible. Do not promise all gaps disappear for every arbitrary combination of spans. Explain incompatible placements without arbitrary card stretching. |

Use deterministic minimum-size/content-budget rules. The prototype's ResizeObserver-driven automatic row growth is an experiment, not the production packing specification. If measurement is needed, bound it, prevent feedback loops, avoid repeated layout jumps, and reflect the actual resolved rows in both preview metadata and persistence.

Use production shell dimensions/breakpoints. Prototype sidebar/right-panel widths and thresholds are illustrative. Test both panels expanded, each independently expanded, and both collapsed.

## 7. Editor design and behavior

### Visual specification

Use a large, nearly full-screen white modal with rounded corners, dimmed backdrop, restrained shadow, and existing typography/tokens. At desktop width, retain two panes: a carefully spaced controls pane and a larger pale grid preview. Keep the header and Save/Cancel footer visible. Only the controls pane may scroll when necessary; the card itself must not scroll.

The top-left identity block is mint, containing the metric name and a useful business description. Size choices are illustrated tiles with short hints. Chart and style choices are pill buttons. Background choices are swatch tiles using the current Default Surface, Mint Accent, Obsidian Ink and Aurora Mesh vocabulary. Avoid duplicate dropdowns beside the same choices.

Two or three steps are acceptable: **Data & meaning → Presentation → Behavior**, with the live preview maintained across steps. Do not force a wizard if a well-organized single controls pane fits better. On small screens use an intentional controls/preview switch or stacked layout with reachable Save/Cancel; avoid squeezing both into unusable columns.

| ID | Required editor behavior |
|---|---|
| E01 | All applicable chart families and their actual variants can be selected directly. Selection, disabled reasons, focus and hover states are clear. |
| E02 | Size tiles and integer custom column/row controls update the live card immediately. The preview reports effective span and displayed scale accurately. |
| E03 | Preview uses the same CardRenderer, resolved configuration and data envelope as the saved card. No separate fake summary/card implementation. |
| E04 | Fit uniformly scales the complete card to the preview area; 100% displays its actual size. Zoom affects presentation only. A preview canvas may pan when necessary, but no scrollbar belongs inside the card. |
| E05 | Corner dragging snaps to legal columns/rows. Pointer deltas must be divided by the actual uniform preview scale. Use the real column pitch and 88px row pitch. Handle pointer capture, cancellation and cleanup. Offer keyboard/numeric equivalents. |
| E06 | Include title, period/custom dates, granularity when meaningful, filters, comparison, legend and family-specific options. Period changes affect the actual read, not only a caption. |
| E07 | Provide existing surface options and supported motion, priority/star border and glare settings. Show only applicable controls and preserve readability in all surfaces. |
| E08 | Configure visible card actions: open details, timeframe picker/caption, comparison and any supported buttons. Buttons perform real authorized actions with correct destinations. |
| E09 | Goal-oriented views expose a goal editor: target, unit, period and scope; per-channel targets where relevant. Explain missing targets and invalid values. |
| E10 | Editing is a draft. Cancel/Close discards unpublished changes; Save validates and persists. Handle saving/error/conflict states and double submits. A failed save keeps the draft available. |
| E11 | Preserve draft settings across editor steps and compatible view changes. Do not silently reset unrelated settings. Explain incompatible settings when changing data shape. |
| E12 | Modal has focus management, Escape/close behavior, labels, keyboard operation and reduced-motion support. Unsaved changes follow the application's established discard convention. |

Use short transitions for selection and geometry changes without hiding resizing results. Avoid re-running chart entry animation on every keystroke, tooltip move, or unrelated rerender.

## 8. Real data, goals and states

Define a normalized data envelope with value/unit, series or rows, metadata, state, observation period, freshness, coverage and capability information. The exact implementation may reuse current Reckoner structures.

| ID | Required semantics |
|---|---|
| D01 | Preserve tenant/store/user authorization on every read, save, goal and drilldown. Never rely on hidden controls as authorization. |
| D02 | Distinguish zero, no observations, unavailable source, forbidden, reconciling, partial, stale and loading. Do not turn a failed or forbidden read into Rs 0. |
| D03 | A scalar-only response shows a number or a clear unavailable-chart state. Do not pad it into invented flat history. Audit `kit.jsx` carefully: valid carry-forward balances and missing sales flows are different semantics. |
| D04 | Define sales inclusion rules: recognized versus booked/paid, refunds, cancellations, taxes/discounts, timezone, boundaries and currency. Use existing business definitions rather than inventing new totals for aesthetics. |
| D05 | Compute comparisons from equivalent real periods and explain missing/zero denominators. Do not hardcode change percentages. |
| D06 | Abort or ignore stale reads after filter/period changes. Cache keys include all authorization scope and query inputs. Avoid duplicated preview requests and cross-tenant cache reuse. |
| D07 | Loading uses relevant BKLIT skeleton/pulse/sweep behavior where supported and a consistent fallback elsewhere. Preserve the allocated footprint. Error/empty states provide meaningful recovery or detail actions. |
| D08 | Live mode is genuine and bounded: pause/resume, freshness, reconnection, hidden-tab handling, cleanup and reduced motion. A simulation is labeled and restricted to fixtures/showcase. |
| D09 | Monetary precision and aggregation follow server conventions. Format abbreviations only for display; retain exact accessible values. Do not sum different currencies without an explicit conversion contract. |
| D10 | Goals have validated positive targets where progress requires them, matching units/period/scope, ownership/permissions and concurrency handling. Define over-target presentation instead of concealing it. |
| D11 | Card/goal saves are consistent: preferably an atomic transaction where supported, otherwise an explicit recoverable sequence with no orphan goals or false saved state. Cancel must not create a live goal. |
| D12 | Large datasets are aggregated/downsampled with declared semantics and bounded render cost; raw records and long legends do not grow cards without limit. |

For partial or stale data, expose the period/coverage or freshness rather than silently presenting a complete current answer. Keep raw-data inspection and extensive detail outside the card face.

## 9. BKLIT integration and visual quality

Build an inventory: family → upstream component → production wrapper → supported variants → loading/hover behavior → required adapter → tests. Reuse actual BKLIT components; port with attribution where needed. Do not replace all charts with a generic SVG simply to claim coverage.

The visual improvement comes from meaningful composition as well as animation:

- Clear hierarchy: metric label, primary answer, context/comparison, visual evidence and optional detail action.
- Purposeful differences between a number tile, category breakdown, trend, goal and records card.
- Chart margins reserve space for ticks and labels; bars, axes, values, and legends do not overlap.
- Sparse series use points or an honest limited-data explanation, rather than a giant almost-empty smoothed line.
- Ring center sizing uses the actual hole and available displayed area, including hover values, long currency amounts and partial arcs.
- Legends retain label/value relationships. Half and three-quarter rings have intentional alignment and center placement.
- Tooltip layering and clipping work inside the modal and on the dashboard; tooltip content is reachable by keyboard or a suitable accessible alternative.
- Dark/gradient surfaces have readable values, axes, tooltip and disabled controls; color is not the only signal.
- Reduced motion removes unnecessary animated transitions, pulsing and simulated movement.

Prefer existing theme tokens and fonts. Do not introduce an unrelated visual identity while trying to improve the editor.

## 10. Known prototype issues — do not carry forward

These are reasons to review the source, not a claim that the current prototype is finished:

1. Latest fullscreen editor styling/behavior has not received a complete browser verification pass. Prior build/model checks do not establish visual correctness.
2. Some controls have both a dropdown and visual choices; consolidate them.
3. Earlier deep-green preview styling conflicts with the requested pale grid reference.
4. Preview fit metadata can disagree with automatically expanded card height. Resolve geometry once and use that result everywhere.
5. Prototype drag math and lifecycle need production-quality scaled coordinates, pointer cancellation/cleanup and keyboard alternatives.
6. Prototype periods and datasets are mocked; changing a label is not a real filtered read.
7. The editor's comparison pill has a hardcoded 18.7% value. Sample 214,400 versus 183,600 is approximately 16.78%; production must derive the delta.
8. Goals and editor draft persistence are illustrative, not a server-backed lifecycle.
9. Some visible actions are demonstrations without real navigation.
10. Automatic row expansion can create excess height or layout instability; records must not grow indefinitely.
11. Family selection in the showcase may switch fixture datasets. Production must preserve metric meaning and request explicitly supported data.
12. Ring center sizing has been adjusted several times; validate readability and overlap on actual screen sizes, including hover. A small font that technically fits is not a solution.

## 11. Implementation phases and gates

### Phase A — map the live application and freeze contracts

- Identify active dashboard route, all editor entry points and authoritative layout/metric contracts.
- Trace existing Sales reads and saves end to end; record supported capabilities.
- Inventory BKLIT components/variants and missing production wrappers.
- Audit existing `spec`/`definition_version` migration and model/controller use.
- Record baseline screenshots, representative saved layouts and existing test results.

**Gate:** a concise source map, Sales capability matrix and configuration/migration decision exist. No destructive route consolidation or schema duplication.

### Phase B — build the shared Sales foundation

- Implement shared definition/adapter/renderer contracts and server validation.
- Implement truthful Sales scalar/time-series states and real comparison behavior.
- Implement layout resolution using 64/24 and actual board width.
- Add representative number, trend and goal/breakdown views where real data exists.
- Make saved card and preview consume the same code.

**Gate:** real Sales values agree with their authoritative source; geometry round-trips; empty/scalar/error data is honest; no card scrollbars or resize mismatch.

### Phase C — replace/extend the editor presentation

- Reuse the NewDashboard modal visual language and expand it to the specified full-screen experience.
- Implement illustrated size choices, chart/style pills, swatches and coherent option groups.
- Wire responsive live preview, Fit/100%, snapped drag and accessible custom dimensions.
- Complete periods, face controls, appearance, motion, goals and draft/save flows.

**Gate:** demonstrate the actual editor in the running application at several widths. Size changes visibly affect the preview. Saved output matches it after reload.

### Phase D — complete renderer coverage and data compatibility

- Implement remaining applicable chart families/variants with real BKLIT components.
- Keep development fixtures for complete visual coverage, while filtering customer options by real capability.
- Implement missing adapters where the source and business definition are known; clearly report unresolved product/data decisions.
- Complete loading, sparse, long-label, large-number, negative-value and accessibility behavior.

**Gate:** a renderer matrix links every exposed option to implementation and evidence. No generic aliases masquerade as implemented variants; no mock fallback in production.

### Phase E — extend to other cards and migrate safely

- Group existing cards by data shape: scalar, time series, categories, targets, records, hierarchy, flow and other specialized shapes.
- Register real adapters/capabilities and migrate incrementally after Sales passes review.
- Preserve existing positions/settings; perform versioned idempotent normalization where necessary.
- Route existing add/edit paths through shared functionality. Consolidate duplicate pages only through an explicit parity/migration decision.

**Gate:** old layouts load, new settings persist, permissions remain correct, and unsupported old options have documented fallback behavior.

### Phase F — verification and review handoff

- Complete the checks below, fix defects, then provide screenshots and the coverage report.
- Keep a rollback path/feature flag where the application supports it. Retain recoverable old specifications during migration.
- Do not delete existing user layouts to make the new implementation appear clean.

## 12. Verification matrix

### Functional and data checks

- Real Sales totals, comparisons, refunds and period boundaries match the authoritative read.
- Every exposed family/variant selects and persists; unsupported choices explain why.
- All geometry controls, drag, Fit/100%, full width and panel changes agree with displayed dimensions.
- Save/reload restores the complete specification; Cancel changes neither card nor goals.
- Invalid dimensions/variants/periods, unauthorized scopes and concurrent saves are handled correctly server-side.
- Slow and out-of-order reads cannot replace newer selections. Loading/error states retain layout stability.
- Hover, keyboard focus, tooltips, legend interaction, drilldown and visible card actions actually work.

### Visual browser checks

Use actual supported application routes and the user's dashboard/editor, not only a fixture page. Capture screenshots with viewport and configuration recorded.

| Dimension | Required coverage |
|---|---|
| Viewport | Wide desktop, typical laptop, constrained desktop, tablet and supported phone width |
| Shell | Both panels collapsed; left expanded; right expanded; both expanded |
| Card shape | Tile, minimum legal chart, square, portrait, wide, full width, custom max/min |
| Preview | Fit, 100%, drag-resize, numeric resize, size tiles, return from narrow to wide |
| Ring | Full, three-quarter, half, legend, butt; default and hover values; large amounts and long labels |
| Other charts | Each family and each visually distinct variant; axes/labels at minimum legal size |
| State | Ready, loading, empty, scalar-only, unavailable, reconciling, partial, stale, forbidden |
| Appearance | Each supported surface; reduced motion; focus/selected/disabled states |

Use pairwise coverage for broad combinations plus exhaustive checks for high-risk paths such as ring centers and scaled resizing. Do not multiply all combinations mechanically or claim that a count of renders proves quality.

Required screenshot set: editor overview matching the reference vocabulary; tile; portrait funnel; full-width trend with both panels expanded; readable ring with legend; ring on hover; loading state; narrow editor; saved dashboard after reload. Include defect screenshots if anything remains unresolved.

### Automated checks

Extend existing tests where they actually cover the contract. Starting points include:

- `tests/tests/Unit/Reckoner/DashboardSanitizerTest.php`
- `tests/tests/Unit/Reckoner/DashboardApiTest.php`
- `tests/tests/Unit/Reckoner/DashboardLockTest.php`
- `tests/tests/Feature/Core/DashboardConsistencyTest.php`
- `tests/tests/Feature/Approval/RuntimeRoleDashboardMatrixTest.php`
- Frontend tests under `resources/js/tests`.

Add meaningful cases for capability legality, grid math, preferred/effective geometry, scaling-aware resize, configuration round-trip, missing-versus-zero data, goal consistency and authorization isolation. Test the behavior rather than reproducing implementation calculations verbatim.

Inspect the actual test configuration before invoking PHP test paths. Run relevant frontend/backend tests and the production build from `app-code/main-app`. Current build includes font/design-system/theme/route audits and client plus SSR builds; preserve those checks. Report pre-existing failures separately and do not suppress them. Check browser console/runtime errors and observer/listener cleanup.

For performance, compare baseline and new dashboard/preview with representative many-card data. Avoid repeated fetches, unbounded SVG nodes, heavy resize work and animation on off-screen cards. Record measured regressions rather than making unsupported performance claims.

## 13. Required implementation report for Codex review

Create a companion report with:

1. Summary of final behavior and exact application route to open.
2. Changed files grouped by shared rendering, editor, data/API, persistence/migration and tests.
3. Completed phase gates and remaining phases.
4. Requirement table: `ID | implementation path | evidence/test | pass / partial / blocked` covering L01–L10, E01–E12 and D01–D12.
5. Family/variant matrix with real-data availability and fixture-only coverage explicitly separated.
6. Screenshot links and tested viewport/panel/card configurations.
7. Commands run, their results and any existing failures.
8. Migration/rollback instructions and saved-layout compatibility results.
9. Remaining design/data decisions and concrete defects; no unqualified “everything works” claim.

Codex's later review should independently inspect the diff and running application, verify the user's reference has been respected, exercise settings and persistence, check data semantics and geometry, and identify omissions against this document. A build alone, a static screenshot alone, or a fixture showcase alone is insufficient for approval.

## 14. Decisions requiring explicit documentation during implementation

- Which route is the supported dashboard, and which other routes remain intentionally available?
- What exactly does the Sales measure represent in this application?
- Which Sales capabilities have production sources today, and which need a new business definition?
- What is the canonical persisted specification given the existing `spec` migration and model mismatch?
- How are goals owned, scoped, versioned and saved with a card?
- What are the legal minimum dimensions for each family/variant and the narrow-screen fallback policy?
- How does stable packing respond when a card's legal minimum changes?

Resolve questions through existing application contracts where possible. Ask the user only when a material business/product choice cannot be inferred. Never fabricate real data or silently redefine Sales to avoid a decision.
