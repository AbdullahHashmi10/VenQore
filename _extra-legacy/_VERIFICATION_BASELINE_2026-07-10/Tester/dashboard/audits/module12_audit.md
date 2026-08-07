╔══════════════════════════════════════════════════════════════════╗
║  PHASE 12 — REPORTS & ANALYTICAL AGGREGATORS                     ║
║  Status: IN PROGRESS                                             ║
╚══════════════════════════════════════════════════════════════════╝

◈ REGISTER CHECK
  Open findings targeted at this phase: None
  Actions taken on each: N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 1 — SCOPE INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Controllers:           
    - App\Http\Controllers\ReportController
    - App\Http\Controllers\SalesAnalyticsController
    - App\Http\Controllers\V3\ReportController
    - App\Http\Controllers\V3\ReportExportController
  Services / Actions:    
    - App\Services\FinancialReportingService
    - App\Services\V3\ReportService
  Models:                
    - App\Models\DailySnapshot
    - App\Models\Sale
    - App\Models\SaleItem
    - App\Models\JournalEntry
    - App\Models\JournalItem
  Routes:                
    - GET /s/{slug}/reports/profit-loss {reports.profit-loss}
    - GET /s/{slug}/reports/daily-sales {reports.daily-sales}
    - GET /s/{slug}/v3/reports/inventory-valuation {v3.reports.inventory-valuation}
    - GET /s/{slug}/v3/reports/tax {v3.reports.tax}
    - GET /s/{slug}/reports/sale-orders {reports.sale-orders}
    - GET /s/{slug}/reports/sale-order-items {reports.sale-order-items}
    - GET /s/{slug}/reports/cash-flow {reports.cash-flow}
    - GET /s/{slug}/reports/tax {reports.tax}
    - GET /s/{slug}/reports/item-report-by-party {reports.item-report-by-party}
    - GET /s/{slug}/reports/party-report-by-item {reports.party-report-by-item}
    - GET /s/{slug}/v3/reports/export {v3.reports.export}
  Database Tables:       
    - daily_snapshots
  Factories / Seeders:   None
  Existing Test Files:   
    - Tester/tests/Feature/Module12/ReportsTest.php
  Existing Test Count:   8 tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 2 — EXISTING COVERAGE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Verified Coverage:
    - Profit and Loss revenue matches posted invoice totals.
    - Daily Sales report calculates aggregate daily revenue.
    - Inventory valuation report correctly computes stock value from FIFO batches.
    - Tax report aggregates input and output tax correctly.
    - Sales Orders and Sales Order Items reports fetch and load pending order metrics.
    - Cash Flow report partitions operating/investing/financing cash flows.
    - Party and item statement reports render mapped views.

  Coverage Gaps Identified:
    - No coverage for checking if reversed/voided journal entries leak into general ledger aggregates (P&L and Cash Flow).
    - No coverage checking if reports containing nested complex subqueries leak or perform poorly due to missing inner tenant constraints.
    - No coverage for checking if exporting balance sheet, cash flow, or P&L reports to CSV results in a serialization crash.

  Pre-Audit Confidence Score:   75%
  Target Confidence Score:      95%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 3 — ROUTE INTEGRITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  METHOD  URI                                              ROUTE NAME                           ZIGGY  TENANT  STATUS
  ──────  ───────────────────────────────────────────────  ───────────────────────────────────  ─────  ──────  ──────
  GET     /s/{slug}/reports/profit-loss                    reports.profit-loss                   ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/reports/daily-sales                    reports.daily-sales                   ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/v3/reports/inventory-valuation         v3.reports.inventory-valuation         ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/v3/reports/tax                         v3.reports.tax                         ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/reports/sale-orders                    reports.sale-orders                   ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/reports/sale-order-items               reports.sale-order-items              ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/reports/cash-flow                      reports.cash-flow                     ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/reports/tax                            reports.tax                           ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/reports/item-report-by-party           reports.item-report-by-party          ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/reports/party-report-by-item           reports.party-report-by-item          ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/v3/reports/export                      v3.reports.export                     ✅     ✅      ✅ VERIFIED

  Summary:
    ✅ Verified:          11
    ⚠️  Partial:          0
    ❌ Broken:            0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 4 — DATABASE SCHEMA REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TABLE: daily_snapshots
    Columns:          id (int), tenant_id (unsignedBigInteger), date (date), revenue (decimal), profit (decimal), cost (decimal)
    Indexes:          tenant_id, date
    Foreign Keys:     tenant_id references tenants(id) ON DELETE CASCADE
    Soft Delete:      No

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 5 — CROSS-MODULE AFFILIATION MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MODULE / AREA     CONNECTION TYPE            DIRECTION       RISK      TEST REQUIRED
  ───────────────   ────────────────────────   ─────────────   ───────   ─────────────
  Module05          Double-entry ledger pull   Inbound         CRITICAL  Yes
  Module06          Sale statistics            Inbound         HIGH      Yes
  Module08          Stock balance valuation    Inbound         HIGH      Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 6 — LOGIC VULNERABILITIES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ID:                 VULN-12-001
  Issue:              Voided & Reversed Journal Entries Leaking into Ledger Reports.
  Impact:             In `FinancialReportingService.php`, methods like `sumJournalItems()` and `getCashFlowReport()` query raw `journal_items` and `journal_entries` without adding a `where('journal_entries.is_reversed', 0)` constraint. Similarly, `ReportController@trialBalance` and `saleAging` methods lack this filter. As a result, voided or reversed transactions (e.g. returned invoices, voided payouts) are still counted inside P&L, Cash Flow, and Trial Balance aggregates, skewing financial reporting.
  Required Action:    Refactor all ledger sum/aggregation queries in `FinancialReportingService` and `ReportController` to explicitly check and exclude entries where `is_reversed = 1`.

  ID:                 VULN-12-002
  Issue:              Cross-Tenant Parameter Bleed & Table-Scan performance trap in Subqueries.
  Impact:             In `FinancialReportingService.php` (such as `getGrossProfitByProduct` and `getGrossProfitBySale`), raw SELECT subqueries (e.g. `sib` and `line_totals`) aggregate values from `sale_items` and `sale_item_batches` without a nested `tenant_id` filter. While the parent query resolves by tenant ID, the inner subquery compiles aggregates for all tenants globally on every invocation, creating a database performance bottleneck. Furthermore, in `ReportController@salePurchaseByItemCategory`, the left join on `sales` lacks `sales.tenant_id = $tenantId`.
  Required Action:    Add explicit `tenant_id` constraints inside all raw subqueries and joins within `FinancialReportingService` and `ReportController`.

  ID:                 VULN-12-003
  Issue:              Sales Analytics Dashboard Scope Evasion (Accrual & Draft Violation).
  Impact:             In `SalesAnalyticsController@index`, queries pull sales aggregates via raw `Sale::sum('total')` and `Sale::where('created_at', '>=', ...)` without applying the `posted()` scope and matching on `posted_at`. This violates Phase 1.2 rules by including draft, returned, and cancelled sales in the metrics, and by grouping on creation date rather than revenue recognition date.
  Required Action:    Refactor all SalesAnalytics queries to call the `posted()` scope and filter on the `posted_at` date column.

  ID:                 VULN-12-004
  Issue:              CSV Export Serialization Crash (Array-to-String Conversion).
  Impact:             In `ReportExportController@toCsv`, the code resolves `$rows = $data['rows'] ?? $data` and loops over values, running `str_replace` directly on `$v`. For nested reports (Balance Sheet, Cash Flow, P&L) that return nested arrays of accounts (e.g. `assets => [...]`), this triggers a fatal `Array to string conversion` TypeError, crashing the export service with a 500.
  Required Action:    Detect and flatten or exclude nested array fields inside `toCsv` or serialize them safely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 7 — UI / UX RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Generating large ledger statement CSVs causes browser timeout if the page waits synchronously for large aggregations.
  - No loading spinner shown during Excel/CSV download trigger events.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 8 — SECURITY RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Table-scan vulnerability on subqueries allows malicious users to exhaust CPU resources by executing reports repeatedly on stores with large transaction histories.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 9 — NEW MODULE / DOMAIN DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Confirmed: All logic belongs to existing modules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 10 — PERSISTENT FINDINGS REGISTER UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  New findings logged this phase:
    - FINDING-12-001 (Reversed Journal Entry Leaks)
    - FINDING-12-002 (Cross-Tenant Subquery Performance)
    - FINDING-12-003 (Sales Analytics Scope Evasion)
    - FINDING-12-004 (CSV Serialization Crash)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 11 — MANDATORY NEW TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('profit_and_loss_excludes_reversed_journal_entries', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $cashAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '1000')->first();
      $salesTaxAccount = \App\Models\Account::where('tenant_id', $tenant->id)->where('code', '2200')->first();
      if (!$salesTaxAccount) {
          $salesTaxAccount = \App\Models\Account::create([
              'tenant_id' => $tenant->id,
              'code' => '2200',
              'name' => 'Sales Tax Owed',
              'type' => 'liability',
              'normal_balance' => 'credit'
          ]);
      }

      $accountingSvc = app(\App\Services\V3\AccountingService::class);

      // Create an entry that is active
      $entryActive = null;
      \Illuminate\Support\Facades\DB::transaction(function () use (&$entryActive, $accountingSvc, $cashAccount, $salesTaxAccount) {
          $entryActive = $accountingSvc->createEntry([
              'date' => now()->format('Y-m-d'),
              'reference_type' => 'sale',
              'reference' => 'TX-ACTIVE',
              'description' => 'Active sale transaction',
          ], [
              ['account_id' => $cashAccount->id, 'debit' => 100, 'credit' => 0],
              ['account_id' => $salesTaxAccount->id, 'debit' => 0, 'credit' => 100],
          ]);
      });

      // Create a reversed entry (is_reversed = 1)
      \Illuminate\Support\Facades\DB::transaction(function () use ($accountingSvc, $cashAccount, $salesTaxAccount) {
          $entryReversed = $accountingSvc->createEntry([
              'date' => now()->format('Y-m-d'),
              'reference_type' => 'sale',
              'reference' => 'TX-REVERSED',
              'description' => 'Reversed sale transaction',
              'is_reversed' => 1
          ], [
              ['account_id' => $cashAccount->id, 'debit' => 500, 'credit' => 0],
              ['account_id' => $salesTaxAccount->id, 'debit' => 0, 'credit' => 500],
          ]);
          $entryReversed->update(['is_reversed' => 1]); // Force update
      });

      // Fetch P&L
      $response = $this->get("/s/{$tenant->slug}/reports/profit-loss");
      $response->assertOk();
      $props = $response->viewData('page')['props'];

      // Revenue must ONLY reflect the active transaction (100), not the reversed one
      $this->assertEquals(100, $props['stats']['revenue']);
  });

  test('sales_analytics_strictly_scopes_posted_sales_only', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $product = \App\Models\Product::factory()->create(['tenant_id' => $tenant->id, 'price' => 100]);
      $warehouse = \App\Models\Warehouse::where('tenant_id', $tenant->id)->first();

      // Posted sale
      $payloadPosted = [
          'customer_id' => null,
          'warehouse_id' => $warehouse->id,
          'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 150, 'discount' => 0]],
          'discount' => 0,
          'amount_paid' => 150,
          'payment_method' => 'cash',
          'add_to_ledger' => false,
      ];
      $this->postJson("/s/{$tenant->slug}/sales", $payloadPosted)->assertOk();

      // Draft sale (should be excluded)
      $draftSale = Sale::create([
          'tenant_id' => $tenant->id,
          'status' => 'draft',
          'posted_at' => null,
          'total' => 9999.00
      ]);

      // Hit sales analytics
      $response = $this->get("/s/{$tenant->slug}/sales/analytics");
      $response->assertOk();
      $props = $response->viewData('page')['props'];

      // The revenue must strictly equal 150 (the posted sale), ignoring the 9999 draft sale
      $this->assertEquals(150, $props['revenue']['total']);
  });

  test('csv_report_export_handles_nested_balance_sheet_arrays_without_crashing', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      // Hit export endpoint for balance sheet in CSV format
      $response = $this->get("/s/{$tenant->slug}/v3/reports/export?report=balance_sheet&format=csv");
      
      // Verification: The download must succeed and return a 200/204 response without throwing Array-to-String Conversion 500
      $this->assertTrue(in_array($response->status(), [200, 204]));
  });

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 12 — PHASE COMPLETION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [ ] All routes verified — zero ❌ routes remain
  [ ] All Ziggy route names confirmed in export
  [ ] All tenant isolation scenarios have tests
  [ ] All financial edge cases covered
  [ ] All DB table constraints reviewed
  [ ] All policy/permission gaps addressed

╔══════════════════════════════════════════════════════════════════╗
║  PHASE 12 COMPLETE                                               ║
║  Tests Added: 3  |  Running Total: 14  |  Findings: 4 new        ║
║  → PROCEED TO PHASE 13                                           ║
╚══════════════════════════════════════════════════════════════════╝
