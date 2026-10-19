# Verification record and claims needing evidence

Snapshot: 16 October 2026. This is a documentation and product-discovery audit, with limited local browser inspection. It is not an exhaustive acceptance test, a deployment certification or proof that every possible scenario works.

## What was checked

| Check | Result | Limit |
| --- | --- | --- |
| Main application bootstrap and route export | Succeeded; 1,378 route entries exported | No transaction controllers invoked by this check |
| Route controller targets | No reflection errors | Existence is not correct runtime behavior |
| Vena canonical manifest | Generated in memory without collector warnings | Registry entries can include internal or legacy surfaces |
| Module page declarations | All declared paths existed | Files can still fail when rendered |
| Module route patterns | Every pattern matched at least one registered route | A match does not prove correct gate or ownership |
| Main guide entry routes | Every main entry route existed | Nested guide instructions and actual outcomes still need review |
| Broad file inventory | 36,893 file paths catalogued with scope | Installed dependencies and named generated directories pruned; audit outputs excluded |
| Source extraction | 5,134 text files read; no read failures | Automated extraction, not a claim of human semantic review of every line |
| React page coverage | 393 page/helper files indexed | 62 have no literal Inertia render reference in scanned sources; dynamic resolution or helper/legacy status needs review |
| Supporting document discovery | 832 Markdown documents indexed with headings and hashes | Their claims were not all independently established; historical documents remain historical |
| Business coverage | All 85 registered types and all 23 starting presets mapped | Configuration coverage, not 85 completed business journeys |
| Report catalogue | 43 hub destinations extracted | A particular demo showed 28 available destinations; access and enabled work areas change the visible list |
| Metric catalogue | 438 definitions exported; 436 tenant-scoped and two platform-scoped | Definitions are not independently verified calculations or universally available dashboard cards |
| Written deliverables | Source-family paths, document links, IDs and generated tables checked | The application regression suite was not run for these documentation changes |

The file scan reads relevant application source and document content to extract structural evidence. It does not read secrets to build a sales inventory. `.env` contents, databases, personal backups, uploaded customer records, private folders, logs, installed libraries and binary/media contents are excluded from product-claim inspection. Other project copies are classified rather than merged into the current product.

## Local browser observations

Local target: `http://127.0.0.1:8000`. The built-in demo was used with its owner role, switching its business-type selection between grocery, phone repair, FMCG wholesale, restaurant and furniture making. This is a shared sample dataset: changing the type changes the enabled experience but did not make its products realistic for every selected industry. Sample money values are not customer results.

No sales, payments, production runs, refunds, published shops or other financial transactions were submitted during this read-only screen inspection. Selecting a demo business updates the demo configuration/session through the application's own supported flow.

| Screen inspected | Visible behavior | What remains unproven |
| --- | --- | --- |
| Public homepage | Business-description entry, sector links, product claims and demonstration sections rendered | Accuracy of broad claims and animated sample figures |
| Login | Account sign-in form rendered | Authentication journeys across roles and recovery cases |
| Demo selector | Business picker exposed 85 options and owner/staff role choices | Every type/role combination |
| Dashboard | Cards, date ranges and arrangement controls appeared | Calculation correctness, persistence and permission isolation |
| POS | Product entry and counter-type prompt appeared | Completing sales, tenders, approvals, returns and offline replay |
| Product inventory | Product table, stock/cost/price, search/filter controls and Add Product appeared | Create/edit/import, real stock correctness and denied actions |
| Customers | Customer page rendered | Full customer CRUD, statements and settlements |
| Purchases | List, supplier details, paid/due values, search/export/print and new-purchase link rendered | Receiving, stock and ledger posting |
| Reports | Search, categories and report links rendered; available list was filtered | Every individual report and totals parity |
| Payments | In/out actions, empty-state table and summary appeared | Money movement and allocation correctness |
| Funds | Accounts, movement categories, transfer/adjust actions and charts appeared | Closing a register, posting transfers or reconciling accounts |
| Labels | Label-printing page rendered | Real printer output, barcode readability and dimensions |
| Online Store | Publication checklist, disabled Publish state, orders, preview links, analytics and offers links appeared | Store publication and a complete customer order journey |
| Service Jobs | New Work Order, statuses, assigned-tech/schedule columns and empty state appeared | Booking, assignments, tool issue, invoice conversion and collection |
| Serials | Available/Sold/Returned filters and serial table appeared | Intake, unit selection, duplicate prevention and reversals |
| Purchase Orders | New order link, status filters and empty state appeared | Partial receiving, cancellation and final supplier settlement |
| Stock Transfers | Pending/In Transit/Completed/Cancelled filters and new-transfer link appeared | Stock movement, concurrency and permissions |
| Chart of Accounts | Account types, balances, account list, export/print and new-account action appeared | Financial correctness or permission restrictions |
| Restaurant overview | Old dashboard URL redirected to FOH Overview with Tables, Takeaway and Delivery | Full order lifecycle or multi-device operation |
| Floor Plan | Areas, tables, lane controls and starter layouts appeared | Saving layout or taking an order against a table |
| Kitchen | Cooking/Ready/Served/All tabs, Stats, 86 List and customer-screen link appeared | Kitchen updates, routing, analytics calculations and unavailable-item enforcement |
| Cookbook | Recipe cards, cost/yield, New Recipe, Simulate and edit actions appeared | Simulation output, recipe persistence and material consumption |
| Production Runs | Run filters, New Run, quantities/status/cost columns and empty state appeared | Posting a batch and reconciling its input/output |

Initial rapid navigation sometimes captured an empty shell before React settled. Those captures were not treated as successful page checks. Screen confirmation used populated accessibility/DOM content. A wait for a shared Demo control timed out on FOH and Kitchen because those screens use a different shell; direct inspection showed their actual content. This is a test-harness assumption, not evidence that those screens failed.

## Conflicts and qualifications to preserve

| Topic | Evidence | Required treatment |
| --- | --- | --- |
| Dedicated quotations | `config/modules.php` marks `quotations` building; its recorded page list is empty | Do not sell a completed quotation workspace. A Pre-Sales guide is a separate available path, not proof of the unfinished module |
| Bank reconciliation | Registry says live, but `BankReconciliationController::index` supplies empty transactions/stats and `import` contains `to implement` | Do not promise bank-statement import, matching or autonomous reconciliation |
| E-invoicing and waybills | Registry says live, but `EInvoicingController::generate` and `generateWaybill` return HTTP 501 coming soon | Do not sell live government e-invoicing from the registry label or the existence of a provider service |
| Campaign automation | `MarketingCampaignController` supplies empty data; create/store are placeholders | No campaign creation/sending promise; earlier claims of working SMS/email campaigns are not established |
| Explicit route stubs | Current routes include HTTP 501 discount-report, finance/accounts, finance/journal, pre-sale print, purchase print and production-edit actions | Do not assume every exposed action works; alternate accounting/report/print paths must be checked individually |
| Debit-note posting and editing | Old UI/show comments say no journal exists, while current store code includes AccountingService posting and print/update routes are implemented | Treat old comments and UI warning as stale/conflicting evidence. Trace and test the current create/view/refund path before asserting posting correctness |
| Old versus current storefront | `OnlineStoreController::update` is empty, but current Commerce controllers and the merchant overview render a separate storefront workflow | Do not downgrade all online ordering because an older unused-looking controller is stubbed; classify actual route ownership |
| Landed cost | `landed_cost` status is beta | Keep out of standard guaranteed wholesale/import promises |
| Automatic composites | `composite_items` status is beta | Do not promise automatic ingredient deduction on every restaurant or manufacturing sale |
| Offline wording | October 13 audit describes older shortcomings; current `docs/OFFLINE_CONTRACT.md` describes later saved-page and FOH support | Use the current contract as intended behavior, then run its device tests before a stronger claim |
| Seven-day limit | Current offline contract, policy and Station integration | Include the limit in the operational explanation; not unlimited disconnected operation |
| Offline financial activity | Contract limits approvals, fresh reporting and posting | Cash/manual-entry sales queue locally; ledger posting occurs after sync; card processing needs internet |
| Mobile support | Mobile README calls it a business pilot shell and excludes native offline selling/hardware | Do not present it as a full native POS or customer shopping app |
| Station versions | README describes 3.2; package declares 4.0.1; 4.0.0 changes describe automatic update windows | Check current implementation and release evidence. Do not repeat the README's older restart policy without qualification |
| Hardware performance | Station README contains timing claims | No receipt benchmark or hardware qualification was run here; omit timing guarantees |
| Marketplace availability | `config/vensynq.php` defaults master enablement off and platform allowlist to Amazon/WooCommerce | Do not claim every channel live from a marketing badge. Credentials, approval, flags and a full order/stock journey are required |
| Marketplace speed | Public homepage implies updates within seconds | Establish actual scheduling, provider limits and measured latency before publishing speed claims |
| Commerce readiness | Older handoff contains multiple later amendments, including preview and stock safety changes | Date alone does not resolve it; current implementation and deployed journey take priority |
| Online product types | Commerce handoff restricts supported goods and distinguishes grouped products from internal variants | Qualify eligibility and recheck it in the actual shop |
| Offline counter versus online holds | Commerce notes describe recorded offline oversales and flagged short online orders | Do not promise zero overselling; demonstrate conflict handling |
| WhatsApp and payments | Contact buttons/manual transfer instructions are distinct from automatic notification/gateway services | Do not imply automated SMS/WhatsApp, phone OTP or integrated gateway unless separately demonstrated |
| Industry notes | Business-type descriptions mention specialist benefits, including warranty and regulatory-sounding workflows | Treat them as discovery prompts; prove exact behavior separately |
| Public counts | Homepage variously uses 140+ modules/features, 46 engines, 240+ features and several reading totals | Remove counts from new outcome-led copy; internal inventory keeps unlike units separate |
| Testing claims | Homepage advertises suite/assertion totals and verification before every release | Not substantiated by this review; no new marketing claim of that form |
| Absolute correctness | Homepage claims no drift, impossible disagreement and universally safe accounting | Balanced posting does not prove all data, definitions or workflows correct; describe inspectable records without absolutes |
| Adaptive presets | All types resolve to a smaller set of starting setups | An industry label is not a separate specialist software implementation |
| API and webhooks | Entitlement metadata is not proof of an end-user API offering | Inspect supported endpoints, documentation, auth and real customer access before promising public API scope |
| Backup and restore | A backup guide and code exist | A successful backup is not proof of a successful restore; rehearse restoration separately |
| Fiscal, payroll and tax | General engines and screens exist | Do not imply statutory compliance for every jurisdiction |

## Remaining completion criteria

The request for every page and every possible scenario is not complete on the strength of a source inventory. Complete the finite coverage plan below and retain exceptions; there are unbounded combinations of data, configuration, time, devices and external services.

1. Classify every one of the 393 Pages files as active page, helper, redirect/compatibility or retired; resolve the 62 without literal render references. Connect active pages to their exact route and entry path.
2. Walk every active page as its intended role, including public, merchant, platform owner and record-detail pages. Mark observed pages separately from submitted-and-verified workflows.
3. Exercise all 23 starting setups and every type-specific extra. Do not substitute one grocery demo for all retail, or one phone-repair demo for all services.
4. Run the normal and exception journeys in the [customer workflow guide](CUSTOMER_PROBLEMS_AND_WORKFLOWS.md), including financial/stock evidence, permission denial and concurrency.
5. Use isolated test data for state-changing scenarios. This browser pass deliberately inspected rather than posted business transactions.
6. Run the current offline contract in a production build on browser and Station, including reload, restart, age limit, replay and conflicting FOH devices.
7. Test mobile, real printers, scanner/scale protocols, receipt/label output and app update safety on the intended devices.
8. Verify external credentials and complete live/sandbox channel, tax, billing and notification journeys in their intended environments.
9. Validate current production behavior against the reviewed source snapshot; this local review does not prove deployment parity.
10. Approve each external claim against a specific demonstrated outcome, with a dated artifact and applicable restrictions.

The three main documents are usable as a structured source-backed catalog, workflow guide and qualified marketing draft. They should not be represented as the result of a completed exhaustive operational test.
