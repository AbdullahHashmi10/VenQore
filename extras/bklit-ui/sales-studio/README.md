# Sales card studio

Standalone React prototype using the already downloaded BKLIT components in `../src/components/charts`. It does not modify the production dashboard.

From the workspace root:

```powershell
node extras/bklit-ui/build-sales-studio.mjs
node extras/bklit-ui/sales-studio/model.test.mjs
```

Build outputs `extras/mockups/sales-card-studio.html` and updates the previous preview at `extras/mockups/sales-card-system.html`. Both are self-contained and work without network requests. Browser storage saves only demo configuration under `venqore-sales-studio-v2`.

- `model.js`: datasets, capability registry, variants, geometry resolver, preference validation.
- `Charts.jsx`: real BKLIT chart compositions and shared loading states.
- `App.jsx`: editor, one-card shell simulator, save/cancel, accessible tables.
- `ProductionNotes.jsx`: evidence from existing code, proposed contracts and unresolved production work.
- `studio.css`: frame, editor, responsive shell and chart tokens.

The production notebook is part of the visible artifact. It explicitly distinguishes demonstrated presentation from backend capabilities that still need implementation or verification. Current mock scope: 14 BKLIT chart families plus number and record views; candlestick and choropleth are intentionally excluded. This is not the upstream Studio and does not claim every BKLIT setting is exposed.

The shell keeps 12 logical columns, promotes spans at measured width floors, and uses overlay panels when the remaining width budget is insufficient. It intentionally tests one card; multi-card packing and saved-layout migration remain separate rollout gates. Card height is a whole row span: rows × 64px + (rows − 1) × 24px. Both grid gutters are 24px. Minimum readable rows can promote a request; measured content increases the card height to the next whole row when necessary. Cards do not scroll.

Data sources are fictional and explicitly labeled. Real financial semantics, accounting reconciliation, period alignment, targets, cohorts, event streams and hierarchy/flow adapters must pass the notebook gates before production use.

Current work is limited to perfecting this standalone HTML artifact and its build sources. The notebook records future decisions only; it is not authorization to migrate or edit the main dashboard.

Audit additions: resizing preserves dataset semantics; scalar variants require their inputs; inactive editor controls are hidden; daily channel amounts reconcile with breakdowns; unknown, partial, stale, reconciling and denied states remain distinct. A coverage record below the preview lists unresolved acceptance checks. Latest changes pass the build and model tests. The browser tool blocks file:// preview access. Latest ring-sizing and popup-editor changes pass the build but still need visual review. The separate editor demo now uses a full-screen workspace with section navigation, a live chart preview, animated transitions, selectable controls/backgrounds and editable goals. Period selection configures the card; sample dates stay explicitly labeled and do not simulate a backend query.
