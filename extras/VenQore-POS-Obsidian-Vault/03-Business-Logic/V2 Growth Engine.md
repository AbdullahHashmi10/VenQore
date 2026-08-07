# V2 Growth Engine

**Status:** Live
**Core Mechanism:** 4-Brain architecture analyzing real tenant sales data.

## The Root Cause of V1 Failure
The original Growth Engine was structurally dead. It queried the `invoices` table filtering by `type = 'sale'`. However, every writer to the `invoices` table in the codebase hardcoded `type = 'purchase'`. Real sales are routed to `sales`/`sale_items` via `SaleController`. As a result, the query returned zero rows for every tenant across the platform.

## V2 Architecture

### The Four Brains
The engine is now wired directly into the General Ledger (GL) core (`journal_items`, FIFO `sale_item_batches`) rather than derived reports, scaling the insight types from 4 to 32.
1. **Brain A (Customer Analytics):** Analyzes retention and reorder frequencies.
2. **Brain B:** Product velocity.
3. **Brain C:** Cash flow.
4. **Brain D (Profit Intelligence):** Added in V2. Utilizes FIFO COGS sitting in `sale_item_batches` to think in margin, not just revenue.

### Adaptive Thresholds
Instead of a universal hardcoded threshold (e.g., lateness = `1.3 × average gap`), thresholds are now measured using standard deviations of each customer's *own* rhythm. 
- Example: A customer ordering every 30 ± 2 days is flagged at 35 days. A customer ordering every 30 ± 28 days is flagged at 90 days.

### The Maturing Loop (Self-Learning without LLM)
Every prediction is graded against actual events per tenant per insight type. 
- **Accurate / Acted-On:** Insight types get more sensitive.
- **Wrong / Ignored:** Insight types get muted temporarily.
- **Note:** An ignored insight that resolves itself counts as a "miss."

### Performance Improvements
- Replaced synchronous `growth:analyze --force` inside the HTTP request.
- Server load decreased while frequency increased 24x.
- Utilizes set-based SQL (~12 queries/tenant instead of thousands).
- Queued per tenant. Tenants with no new transactions are skipped after a single indexed query.

## Deployment & Setup Notes
- The queue worker must be run with `--queue=growth,default`.
- Required 5 new routes generated via `ziggy`.
- The frontend now utilizes real data and a dedicated Settings page.
