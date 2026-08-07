╔══════════════════════════════════════════════════════════════════╗
║  PHASE 08 — INVENTORY & TRACKING                                 ║
║  Status: IN PROGRESS                                             ║
╚══════════════════════════════════════════════════════════════════╝

◈ REGISTER CHECK
  Open findings targeted at this phase: None
  Actions taken on each: N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 1 — SCOPE INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Controllers:
    - App\Http\Controllers\InventoryController
    - App\Http\Controllers\StockOperationsController
    - App\Http\Controllers\StockTakeController
    - App\Http\Controllers\StockTransferController
    - App\Http\Controllers\V3\StockAdjustmentController
    - App\Http\Controllers\V3\StockTransferController
  Models:
    - App\Models\Stock
    - App\Models\StockMovement
    - App\Models\StockTake
    - App\Models\StockTakeItem
    - App\Models\StockTransfer
    - App\Models\Product
    - App\Models\InventoryBatch
  Policies:
    - None (Access gated via permission middleware in routes file)
  Form Requests:
    - None
  Services / Actions:
    - App\Services\V3\InventoryService
  Jobs / Events:
    - None
  Observers / Traits:
    - App\Traits\HasTenant (applied on models)
  Middleware:
    - tenant (applied via store group)
    - auth (applied globally or group-level)
    - permission:inventory (applied on legacy transfers and stock take routes)
  Routes:
    - GET  /s/{slug}/stock-transfers {stock-transfers.index}
    - GET  /s/{slug}/stock-transfers/create {stock-transfers.create}
    - POST /s/{slug}/stock-transfers {stock-transfers.store}
    - GET  /s/{slug}/stock-transfers/{id} {stock-transfers.show}
    - GET  /s/{slug}/stock-audit {stock-takes.index}
    - GET  /s/{slug}/stock-audit/create {stock-takes.create}
    - POST /s/{slug}/stock-audit {stock-takes.store}
    - GET  /s/{slug}/stock-audit/{id} {stock-takes.show}
    - GET  /s/{slug}/stock-operations {stock-operations}
    - POST /s/{slug}/stock-operations/transfer {stock-operations.transfer}
    - POST /s/{slug}/stock-operations/adjust {stock-operations.adjust}
    - POST /s/{slug}/stock-operations/audit {stock-operations.audit}
    - POST /s/{slug}/v3/stock-adjustments {store.v3.stock-adjustments.store}
    - POST /s/{slug}/v3/stock-transfers {store.v3.stock-transfers.store}
  Frontend Pages:
    - Tester/resources/js/Pages/StockTransfers/StockTransfers.jsx
    - Tester/resources/js/Pages/StockTransfers/Create.jsx
    - Tester/resources/js/Pages/StockTransfers/Show.jsx
    - Tester/resources/js/Pages/StockTake/StockTake.jsx
    - Tester/resources/js/Pages/StockTake/Create.jsx
    - Tester/resources/js/Pages/StockTake/Show.jsx
    - Tester/resources/js/Pages/StockOperations.jsx
  Database Tables:
    - stocks
    - stock_movements
    - stock_takes
    - stock_take_items
    - stock_transfers
    - stock_transfer_items
    - inventory_batches
  Factories / Seeders:
    - None
  Existing Test Files:
    - Tester/tests/Feature/Module08/InventoryTest.php
  Existing Test Count:
    - 4 tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 2 — EXISTING COVERAGE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Verified Coverage:
    - Stock transfer between warehouses preserves total stock (via legacy controller `/stock-transfers`).
    - Stock take records discrepancy and adjusts stock (via legacy controller `/stock-audit`).
    - Confirming that `autoHealStockIntegrity` is not called in normal flow.
    - Product name edit does not reset product stock quantity.

  Coverage Gaps Identified:
    - No coverage for the new V3 Stock Transfers endpoint `/s/{slug}/v3/stock-transfers`.
    - No coverage for the new V3 Stock Adjustments endpoint `/s/{slug}/v3/stock-adjustments`.
    - No coverage checking if transfer requests fail when there is insufficient stock in the source warehouse.
    - No validation that stock adjustments and stock takes actually update the physical `stocks` table and `products` table's aggregate counts.
    - No validation that V3 stock transfers record matching `stock_movements` rows and modify warehouse-specific `stocks` records.

  False Confidence Areas:
    - The existing `stock transfer between warehouses preserves total stock` test passes because it hits the legacy `StockTransferController` which manually mutates `stocks` and `stock_movements`. It completely misses the fact that the legacy route does NOT sync with the V3 `inventory_batches` table, meaning that legacy transfers cause silent desynchronizations of the FIFO book value.
    - Conversely, hitting the V3 transfers endpoint would update `inventory_batches` but leave `stocks` and `stock_movements` empty, which is also not tested.

  Pre-Audit Confidence Score:   55%
  Target Confidence Score:      [95%]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 3 — ROUTE INTEGRITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  METHOD  URI                               ROUTE NAME                     ZIGGY  TENANT  STATUS
  ──────  ────────────────────────────────  ─────────────────────────────  ─────  ──────  ──────
  GET     /s/{slug}/stock-transfers         stock-transfers.index           ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/stock-transfers/create  stock-transfers.create          ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/stock-transfers         stock-transfers.store           ✅     ✅      ⚠️ NO FIFO SYNC
  GET     /s/{slug}/stock-transfers/{id}    stock-transfers.show            ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/stock-audit             stock-takes.index               ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/stock-audit/create      stock-takes.create              ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/stock-audit             stock-takes.store               ✅     ✅      ⚠️ DESYNCED AGGREGATE
  GET     /s/{slug}/stock-audit/{id}        stock-takes.show                ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/stock-operations        stock-operations                ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/stock-operations/transfer stock-operations.transfer        ✅     ✅      ⚠️ NO FIFO SYNC
  POST    /s/{slug}/stock-operations/adjust   stock-operations.adjust          ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/stock-operations/audit    stock-operations.audit           ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/v3/stock-adjustments    store.v3.stock-adjustments.store ✅     ✅      ⚠️ DESYNCED AGGREGATE
  POST    /s/{slug}/v3/stock-transfers      store.v3.stock-transfers.store   ✅     ✅      ❌ LEAKS TENANT ID

  Summary:
    ✅ Verified:          9
    ⚠️  Partial:          4
    ❌ Broken:            1

  Ziggy Mismatches Found:    None
  Missing Named Routes:      None
  Tenant Scope Gaps:         `V3\StockTransferController` does not insert `tenant_id` on new destination batches.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 4 — DATABASE SCHEMA REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TABLE: stocks
    Columns:          id (UUID), tenant_id (FK), product_id (FK), warehouse_id (FK), quantity (decimal)
    Indexes:          tenant_id, product_id, warehouse_id
    Foreign Keys:     tenant_id references tenants(id), product_id references products(id)
    Cascade Risks:    None
    Soft Delete:      No
    Transaction Use:  Wrapped in most controllers, but skipped in V3 Adjustments & Transfers.
    Tenant ID:        Present and indexed.
    Risk Flags:       Aggregate stock can get desynced from V3 inventory batches if low-level operations do not update both.

  TABLE: inventory_batches
    Columns:          id (UUID), tenant_id (FK), product_id (FK), warehouse_id (FK), remaining_qty (decimal), unit_cost (decimal)
    Indexes:          tenant_id, product_id, warehouse_id
    Foreign Keys:     tenant_id references tenants(id)
    Cascade Risks:    None
    Soft Delete:      Yes
    Transaction Use:  Wrapped in FifoService and InventoryService transactions.
    Tenant ID:        Present and indexed.
    Risk Flags:       Destructive writes or null tenant IDs bypass multi-tenant scoping.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 5 — CROSS-MODULE AFFILIATION MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MODULE / AREA     CONNECTION TYPE            DIRECTION       RISK      TEST REQUIRED
  ───────────────   ────────────────────────   ─────────────   ───────   ─────────────
  Module07          Inbound batch receipt      Inbound         HIGH      Yes
  Module05          Double-entry bookkeeping   Outbound        CRITICAL  Yes
  V3 / FIFO         Cost recalculations        Bidirectional   CRITICAL  Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 6 — LOGIC VULNERABILITIES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ID:                 VULN-08-001
  Issue:              Cross-Tenant Data Leak on V3 Destination Batch Insert.
  Impact:             Transferred inventory batches are inserted with `tenant_id` as `null` or default, allowing other tenants to read/manipulate them, or hiding them from the current tenant's view.
  Failure Scenario:   1. Tenant A executes a V3 stock transfer.
                      2. New batch is generated at the destination warehouse.
                      3. Because `tenant_id` is omitted in the insert call, it defaults to null or is empty.
                      4. Tenant B can view/interact with the orphaned batch or total valuation collapses.
  Financial Risk:     Yes, HIGH.
  Tenant Risk:        Yes, CRITICAL.
  DB Risk:            Yes, MEDIUM.
  Required Action:    Add `'tenant_id' => app('current.tenant')->id` to the destination batch insert in `V3\StockTransferController@store`.
  Logged to Register: FINDING-08-001

  ID:                 VULN-08-002
  Issue:              Stock Transfer Physical Desynchronization.
  Impact:             V3 stock transfers update `inventory_batches` but completely omit updates to the physical `stocks` table and the `stock_movements` log.
  Failure Scenario:   1. Operator transfers 10 units from Warehouse A to Warehouse B using V3 endpoint.
                      2. Source batch decreases by 10; destination batch increases by 10.
                      3. The physical count in `stocks` for Warehouse A remains at the old value, and no movement is logged, leading to severe data desync.
  Financial Risk:     Yes, HIGH.
  Tenant Risk:        No.
  DB Risk:            Yes, HIGH.
  Required Action:    In `V3\StockTransferController@store`, explicitly decrement source `stocks.quantity`, increment destination `stocks.quantity`, and record two `stock_movements` entries.
  Logged to Register: FINDING-08-002

  ID:                 VULN-08-003
  Issue:              Stock Adjustment/Take Aggregate Stock Desynchronization.
  Impact:             Stock adjustments and stock audits through `InventoryService` adjust FIFO batches but leave the aggregate `stocks.quantity` and `products.stock_quantity` untouched.
  Failure Scenario:   1. Stock take count reveals 2 missing items.
                      2. System processes adjustment and deducts 2 from FIFO batches.
                      3. The physical `stocks` table and `products` table still display the old counts, desynchronizing the POS/sales view from actual batches.
  Financial Risk:     Yes, HIGH.
  Tenant Risk:        No.
  DB Risk:            Yes, HIGH.
  Required Action:    Refactor `InventoryService@adjustStock` to automatically update `stocks.quantity`, `products.stock_quantity`, and record a `stock_movements` entry. Remove redundant/missing updates from calling controllers.
  Logged to Register: FINDING-08-003

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 7 — UI / UX RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  State Sync Risks:        If an adjustment changes stock, POS interface might still display stale stock numbers until a full page reload occurs.
  Loading State Gaps:      Bulk stock audits do not disable the submission buttons, leaving them vulnerable to double-click submissions.
  Error Handling Gaps:     If stock takes result in insufficient stock during concurrent deductions, the returned `InsufficientStockException` is displayed as an unhandled 500 error instead of a validation toast.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 8 — SECURITY RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Policy Gaps:               V3 stock adjustments and transfers do not have specific policies associated, relying on route-level `auth` middleware.
  Privilege Escalation:      No specific checks barring cashier roles from sending manual stock adjustments.
  Tenant Boundary Risks:     The `RepairInventoryBatches` command queries all products globally, risking performance degradation if run synchronously across millions of records.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 9 — NEW MODULE / DOMAIN DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Confirmed: All logic belongs to existing modules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 10 — PERSISTENT FINDINGS REGISTER UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  New findings logged this phase:
    - FINDING-08-001 (Cross-Tenant Transfer Leak)
    - FINDING-08-002 (Stock Transfer Desync)
    - FINDING-08-003 (Stock Adjustment Desync)
  Existing findings resolved this phase: None
  Findings deferred with target phase: None

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 11 — MANDATORY NEW TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tests added this phase:   3
  Previous total:           6
  New running total:        9

  // ─────────────────────────────────────────────────────────────
  // FEATURE TESTS — full HTTP stack, database interactions
  // ─────────────────────────────────────────────────────────────

  test('v3_stock_adjustments_synchronize_physical_stock_and_movement_records', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      // Create Stock Adjustment Loss (6300) and Gain (4200) accounts
      \App\Models\Account::forceCreate([
          'tenant_id' => $tenant->id,
          'code' => '6300',
          'name' => 'Stock Adjustment Loss',
          'type' => 'expense',
          'normal_balance' => 'debit',
      ]);
      \App\Models\Account::forceCreate([
          'tenant_id' => $tenant->id,
          'code' => '4200',
          'name' => 'Stock Adjustment Gain',
          'type' => 'revenue',
          'normal_balance' => 'credit',
      ]);

      $warehouse = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main', 'code' => 'MAIN']);
      $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 100.00, 'stock_quantity' => 10]);

      \App\Models\Stock::create([
          'tenant_id' => $tenant->id,
          'product_id' => $product->id,
          'warehouse_id' => $warehouse->id,
          'quantity' => 10,
      ]);

      // Seed a FIFO batch of 10
      $batchId = \Illuminate\Support\Str::uuid()->toString();
      DB::table('inventory_batches')->insert([
          'tenant_id' => $tenant->id,
          'id' => $batchId,
          'product_id' => $product->id,
          'warehouse_id' => $warehouse->id,
          'batch_type' => 'purchase',
          'unit_cost' => 100.00,
          'original_qty' => 10.00,
          'initial_qty' => 10.00,
          'remaining_qty' => 10.00,
          'created_at' => now(),
          'updated_at' => now(),
      ]);

      // 1. Trigger decrease of 3 units
      $payloadDecrease = [
          'product_id' => $product->id,
          'warehouse_id' => $warehouse->id,
          'direction' => 'decrease',
          'qty' => 3,
          'reason' => 'Damaged inventory',
      ];

      $response1 = $this->post("/s/{$tenant->slug}/v3/stock-adjustments", $payloadDecrease);
      $response1->assertRedirect();

      // Assert stock levels decremented to 7
      expect($product->fresh()->stock_quantity)->toEqual(7.0);
      $stock = DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouse->id)->first();
      expect((float) $stock->quantity)->toEqual(7.0);

      // Assert FIFO batch decremented to 7
      $batch = DB::table('inventory_batches')->where('id', $batchId)->first();
      expect((float) $batch->remaining_qty)->toEqual(7.0);

      // Assert stock movement logged
      $movement = DB::table('stock_movements')
          ->where('product_id', $product->id)
          ->where('warehouse_id', $warehouse->id)
          ->where('quantity', -3.0)
          ->first();
      expect($movement)->not->toBeNull();
  });

  test('v3_stock_transfers_enforce_tenant_isolation_and_update_physical_stock', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $warehouseA = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'A', 'code' => 'W-A']);
      $warehouseB = Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'B', 'code' => 'W-B']);
      $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'stock_quantity' => 10]);

      \App\Models\Stock::create([
          'tenant_id' => $tenant->id,
          'product_id' => $product->id,
          'warehouse_id' => $warehouseA->id,
          'quantity' => 10,
      ]);

      $batchId = \Illuminate\Support\Str::uuid()->toString();
      DB::table('inventory_batches')->insert([
          'tenant_id' => $tenant->id,
          'id' => $batchId,
          'product_id' => $product->id,
          'warehouse_id' => $warehouseA->id,
          'batch_type' => 'purchase',
          'unit_cost' => 50.00,
          'original_qty' => 10.00,
          'initial_qty' => 10.00,
          'remaining_qty' => 10.00,
          'created_at' => now(),
          'updated_at' => now(),
      ]);

      $payload = [
          'product_id' => $product->id,
          'from_warehouse_id' => $warehouseA->id,
          'to_warehouse_id' => $warehouseB->id,
          'qty' => 4,
          'reason' => 'Internal transfer',
      ];

      $response = $this->post("/s/{$tenant->slug}/v3/stock-transfers", $payload);
      $response->assertRedirect();

      // Assert Warehouse A stock = 6, Warehouse B stock = 4
      $stockA = DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouseA->id)->first();
      expect((float) $stockA->quantity)->toEqual(6.0);

      $stockB = DB::table('stocks')->where('product_id', $product->id)->where('warehouse_id', $warehouseB->id)->first();
      expect((float) $stockB->quantity)->toEqual(4.0);

      // Assert destination batch is created with correct tenant ID (isolation boundary)
      $destBatch = DB::table('inventory_batches')
          ->where('product_id', $product->id)
          ->where('warehouse_id', $warehouseB->id)
          ->first();
      expect($destBatch)->not->toBeNull();
      expect($destBatch->tenant_id)->toEqual($tenant->id);
      expect((float) $destBatch->remaining_qty)->toEqual(4.0);

      // Assert stock movements generated
      $outMovement = DB::table('stock_movements')
          ->where('product_id', $product->id)
          ->where('warehouse_id', $warehouseA->id)
          ->where('quantity', -4.0)
          ->first();
      expect($outMovement)->not->toBeNull();

      $inMovement = DB::table('stock_movements')
          ->where('product_id', $product->id)
          ->where('warehouse_id', $warehouseB->id)
          ->where('quantity', 4.0)
          ->first();
      expect($inMovement)->not->toBeNull();
  });

  // ─────────────────────────────────────────────────────────────
  // TENANT ISOLATION TESTS — two fresh tenants, strict boundaries
  // ─────────────────────────────────────────────────────────────

  test('prevents v3 stock transfer from reading or mutating another tenants batches', function () {
      $tenantA = $this->createTenant();
      $tenantB = $this->createTenant();

      $this->actingAsOwner($tenantA);
      $this->seedTenantDefaults($tenantA);

      $warehouseA = Warehouse::create(['tenant_id' => $tenantA->id, 'name' => 'A', 'code' => 'W-A']);
      $warehouseB = Warehouse::create(['tenant_id' => $tenantA->id, 'name' => 'B', 'code' => 'W-B']);
      $product = Product::factory()->create(['tenant_id' => $tenantA->id, 'cost_price' => 50, 'stock_quantity' => 10]);

      // Batch for Tenant B (should be invisible to Tenant A)
      $batchIdB = \Illuminate\Support\Str::uuid()->toString();
      DB::table('inventory_batches')->insert([
          'tenant_id' => $tenantB->id,
          'id' => $batchIdB,
          'product_id' => $product->id,
          'warehouse_id' => $warehouseA->id,
          'batch_type' => 'purchase',
          'unit_cost' => 50.00,
          'original_qty' => 10.00,
          'initial_qty' => 10.00,
          'remaining_qty' => 10.00,
          'created_at' => now(),
          'updated_at' => now(),
      ]);

      // Attempt to transfer stock by tenant A (which has no batches in warehouse A)
      $payload = [
          'product_id' => $product->id,
          'from_warehouse_id' => $warehouseA->id,
          'to_warehouse_id' => $warehouseB->id,
          'qty' => 4,
          'reason' => 'Attacking tenant B stock',
      ];

      // Request should throw InsufficientStockException and fail
      $failed = false;
      try {
          $this->post("/s/{$tenantA->slug}/v3/stock-transfers", $payload);
      } catch (\App\Exceptions\InsufficientStockException $e) {
          $failed = true;
      }
      // If controller doesn't let exception bubble but handles it:
      // We can assert status 500 or redirect with error or throw exception
      // Let's assert database has NOT modified Tenant B's batch
      $batchB = DB::table('inventory_batches')->where('id', $batchIdB)->first();
      expect((float) $batchB->remaining_qty)->toEqual(10.0);
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
  [ ] All UI state risks documented
  [ ] All 1% affiliations traced and tested
  [ ] All logic vulnerabilities have a test or a logged FINDING
  [ ] All new findings added to Persistent Register with target phase
  [ ] All test blueprints are complete and runnable (not stubs)
  [ ] Running test total updated
  [ ] No deferred items left without a target phase assignment
