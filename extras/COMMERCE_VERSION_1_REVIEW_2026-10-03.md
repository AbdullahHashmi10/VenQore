# Commerce MVP / Version 1 verification — 3 October 2026

Verdict: substantial MVP and Version 1 functionality is implemented. The claim that Version 1 is fully complete and ready for pilots is not supported. Existing tests pass, but additional review tests reproduce stock, opening-hours and collected-payment gaps.

This review uses the local working tree in `app-code/main-app` against `extras/VENQORE_COMMERCE_MASTER_ROADMAP.md`, especially sections 4–7. It does not verify a deployed site or Claude's cloud browser session. No application fixes were made.

## Verified evidence

- Local existing Commerce suite: **80 tests, 464 assertions, all passing**, PHP 8.2.12 / MariaDB, 33.952 seconds.
- Test database explicitly selected: `amd_pos_test_current_0d33d5b0`, localhost. Its missing commerce tables were created by applying only the seven additive `2026_10_03_*commerce*` migrations. No production/app database migrations were run.
- The normal test invocation initially could not autoload `Tests\Feature\Commerce\CommerceTestCase`. A review-only bootstrap adds the nested `tests/tests` namespace path without changing Composer or application files. Initial missing-table errors were environment setup failures, not 80 product defects.
- PHP syntax checks passed for 28 files in Commerce models, services, controllers and tests.
- Targeted frontend oxlint exited 1 with 21 diagnostics, including one in the old OnlineStore placeholder page; issues include missing control labels, interactive ARIA roles, ref use during render and effect-state rules. Lint failure alone does not prove a checkout crash, but frontend checks are not clean.
- Three new review-only safety regression tests: **3 failures, 0 errors**, 4 assertions. These failures reproduce the first three findings below.
- Existing suite evidence: `scratch/commerce-review-junit.xml`. Additional reproductions: `scratch/CommerceReviewRegressionTest.php`, results `scratch/commerce-review-regression-junit.xml`. Temporary loader: `scratch/commerce-review-bootstrap.php`.

## Findings requiring changes

### F1 — P1: the actual sales path can sell reserved online stock

Reproduction: create 3 units, confirm an online order for 2, then POST a normal sales transaction for 2. The sales endpoint returns HTTP 200; physical FIFO stock falls to 1 while 2 units remain actively promised to the online order.

Source: `app/Http/Controllers/SaleController.php:605` directly calls `FifoService::deductStock` without HoldGuard. `PosSaleController.php:60` delegates to this same controller. The added guard at `app/Engines/SaleService.php:221` only protects callers using that engine. Woo order posting and legacy pre-sale conversion also directly use FIFO and need review.

The existing test named `test_pos_sale_cannot_consume_stock_held_by_accepted_online_order` (`tests/tests/Feature/Commerce/OrderFlowTest.php:259`) calls the V3 service directly; it does not exercise the real POS controller. Consequently the test passes while the production route's writer remains unprotected.

Required: enforce shared reservation availability at the actual stock-consuming boundary, preserve own-order exclusion for completion, and add actual POS/manual sales/channel endpoint regression coverage. The handoff's claim that all sale paths protect held stock is inaccurate.

### F2 — P1: collecting payment before fulfilment has no cancellation settlement

`app/Services/Commerce/OrderService.php:201` marks an accepted order collected and stores the amount, but writes no canonical receipt. Sale/payment posting is deferred to completion. `cancel()` at line 128 allows that collected order to become cancelled without a refund, unapplied receipt or a guard requiring settlement. A cancelled order cannot then complete through the normal flow.

Reproduction: place bank-payment order → confirm → mark payment collected → cancel. Cancellation succeeds instead of blocking for receipt/refund handling. The database transaction rolls back after the test, so no real payment was made.

Required: use canonical advance receipt/refund/allocation behavior for actual prepayments, or restrict collection to fulfilment until that behavior exists. Cancellation must account for already collected money; it cannot simply release stock. The public status UI also says cancelled orders have not been charged, which conflicts with this collected-payment state.

### F3 — P2: store opening hours do not stop checkout

Roadmap Version 1 includes stopping orders outside working hours. `app/Models/Commerce/Storefront.php:34` checks published/intake status only. `CheckoutService::assertStoreOpen` at line 320 checks tenant state, publication, pause and warehouse, but does not use OpeningHours.

Reproduction: configure all seven days closed, then place a guest order. The order is accepted. OpeningHours is used for the public open/closed label, not intake enforcement.

Required: specify whether outside-hours orders are permitted, enforce the agreed rule on the server and UI, and test timezone/overnight windows. If intentionally taking advance orders, expose that setting and revise the roadmap claim.

### F4 — P1: stock guard reads before locking the shared stock rows

Static finding; not a reproduced parallel-process test. HoldGuard at `app/Services/Commerce/HoldGuard.php:14` sums holds/stock without taking a shared authority lock. SaleService line 221 and InventoryService lines 91/219 perform this check before FIFO/transfer row locks, while order confirmation locks batches and then inserts the new hold.

A competing sale can observe no hold, wait behind a confirming transaction, then deduct after the hold is committed without checking it again. Existing sequential tests do not prove this safe under concurrency. Different batch lock orderings also deserve deadlock review.

Required: lock a common tenant/product/warehouse authority before both availability checking and hold creation/deduction, read current state under that lock, and verify with two real database connections. Fixing only the unguarded sales route does not settle this race.

## Roadmap coverage

| Requirement | Local implementation evidence | Assessment |
|---|---|---|
| Country/city → business → catalogue | Directory controller/pages and dedicated location tables | Implemented; public HTTP tests pass |
| Merchant profile/publication/QR | StoreManager settings/publish/unpublish, Home QR | Implemented; settings tests pass |
| Bulk product selection and online price rules | Products manager, OnlinePricing, pricing tests | Implemented: same, percentage and fixed overrides |
| Private draft preview | Manager links to public store; no dedicated preview route found | Not confirmed/appears missing; public route requires published status |
| Guest cart/checkout and private tracking | Store/OrderStatus pages and CheckoutService | Implemented; HTTP and lifecycle tests pass |
| Staff inbox/statuses and canonical completion | OrderInboxController, OrderService | Implemented; completion/idempotency/ledger examples pass |
| Payment/cancellation handling | Collection flags and deferred sale posting | Incomplete for cancelled prepaid orders (F2) |
| Product photos, banner, announcement, featured | Upload/manager/public components | Implemented in source and test coverage |
| In-store categories/search | PublicStoreController and Store UI | Implemented; marketplace-wide search is Version 2 |
| Sizes/colours | Separate product IDs grouped into one public card | Alternative implementation; true existing variant-table products remain blocked |
| Delivery areas, fees, minimum and prep estimate | CheckoutService and store settings | Implemented; service-layer tests pass |
| Dated offers/coupons/fixed discounts | Promotions service/controller and tests | Implemented; specific hand-picked product targeting absent |
| Automatic close-hours intake | Open/closed label only | Incomplete (F3) |
| Reorder and order changes with consent | Private reorder endpoint and OrderRevisions | Implemented; revision tests pass |
| Read-only order analytics | StoreManager insights | Implemented; verified limited metrics, not full visitor/cart funnel |
| Universal connected stock safety | Engine guards, separate commerce holds | Incomplete actual paths and concurrency (F1/F4) |
| Offline POS conflict controls | Manual intake pause; handoff acknowledges disconnected oversell | Not proven; no tested automatic allocation/freshness policy established |
| Real merchant pilot and approved release | Handoff explicitly says not deployed | Not completed/independently verified |

## Limits and next action

No independent local browser walkthrough, full frontend production build, all-ERP regression suite, concurrency stress test or production deployment validation was performed in this review. Passing the 80 existing tests confirms their scenarios, not every roadmap requirement.

Fix F1–F4, resolve intended variant/preview scope, make test bootstrapping repeatable, clean affected frontend checks, and run the actual browser/finance/offline/parallel-transaction checks before calling this Version 1 complete. Then rehearse the exact release under the repository deployment policy and start the merchant pilot. Code readiness and real pilot validation are separate milestones.

Working-tree changes made by this review are diagnostic/review files only. Seven migrations were applied to the dedicated local test database; test business/order fixtures were rolled back by the test runner. Claude's existing application edits were preserved.
