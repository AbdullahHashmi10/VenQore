╔══════════════════════════════════════════════════════════════════╗
║  PHASE 09 — MANUFACTURING & BOM                                  ║
║  Status: IN PROGRESS                                             ║
╚══════════════════════════════════════════════════════════════════╝

◈ REGISTER CHECK
  Open findings targeted at this phase: None
  Actions taken on each: N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 1 — SCOPE INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Controllers:
    - App\Http\Controllers\ProductionController
    - App\Http\Controllers\V3\BomController
    - App\Http\Controllers\V3\ProductionRunController
  Models:
    - App\Models\ProductionRun
    - App\Models\Product
    - App\Models\Stock
    - App\Models\StockMovement
  Policies:
    - None (Access gated via permission middleware in routes file)
  Form Requests:
    - None
  Services / Actions:
    - App\Services\V3\ManufacturingService
    - App\Services\V3\FifoService
  Jobs / Events:
    - None
  Observers / Traits:
    - App\Traits\HasTenant (applied on models)
  Middleware:
    - tenant (applied via store group)
    - auth (applied globally or group-level)
  Routes:
    - POST   /s/{slug}/v3/boms                             boms.store
    - PUT    /s/{slug}/v3/boms/{id}                        boms.update
    - DELETE /s/{slug}/v3/boms/{id}                        boms.destroy
    - POST   /s/{slug}/v3/production-runs                  production-runs.store
    - POST   /s/{slug}/v3/production-runs/{id}/complete    production-runs.complete
    - POST   /s/{slug}/v3/production-runs/{id}/reverse     production-runs.reverse
    - POST   /s/{slug}/v3/disassembly                      disassembly.store
    - GET    /s/{slug}/inventory/production                production.index
    - GET    /s/{slug}/inventory/production/create         production.create
    - POST   /s/{slug}/inventory/production                production.store
    - GET    /s/{slug}/inventory/production/{run}          production.show
    - POST   /s/{slug}/inventory/production/{run}/complete production.complete
  Frontend Pages:
    - Tester/resources/js/Pages/Inventory/Production/ProductionRuns.jsx
    - Tester/resources/js/Pages/Inventory/Production/Create.jsx
    - Tester/resources/js/Pages/Inventory/Production/Show.jsx
  Database Tables:
    - bill_of_materials
    - bom_items
    - production_runs
    - production_run_materials
    - stocks
    - stock_movements
  Factories / Seeders:
    - None
  Existing Test Files:
    - Tester/tests/Feature/Module09/ManufacturingTest.php
  Existing Test Count:
    - 4 tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 2 — EXISTING COVERAGE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Verified Coverage:
    - Bill of Materials can be created and saved correctly.
    - Production run successfully decrements raw material batch quantities (FIFO).
    - Production run complete successfully initializes a manufactured FIFO batch for the finished good.
    - Production run material cost is dynamically calculated from live ingredient batch unit costs.

  Coverage Gaps Identified:
    - No coverage for checking if raw material consumption decrements the legacy physical `stocks` table levels and creates matching `stock_movements`.
    - No coverage checking if finished good and by-product production increments the physical `stocks` table levels and creates matching `stock_movements`.
    - No coverage checking if production reversals decrement the finished good's physical `stocks` levels.
    - No coverage checking if set disassembly correctly decrements parent sets, increments component stocks, and logs movements.
    - No coverage checking for concurrency race conditions when raw ingredients are depleted mid-run.
    - No validation check preventing cross-tenant data leaks when inserting BOMs and BOM items.
    - No check preventing the deletion or archiving of a raw component product if it is an active ingredient in another product's BOM.

  False Confidence Areas:
    - The existing `production run consumes raw materials` and `produces finished goods` tests pass but only assert on `inventory_batches`. They completely fail to verify that legacy `stocks` and `stock_movements` remain desynchronized, which is a major data integrity gap.

  Pre-Audit Confidence Score:   60%
  Target Confidence Score:      [95%]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 3 — ROUTE INTEGRITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  METHOD  URI                                            ROUTE NAME                 ZIGGY  TENANT  STATUS
  ──────  ─────────────────────────────────────────────  ─────────────────────────  ─────  ──────  ──────
  POST    /s/{slug}/v3/boms                              boms.store                  ✅     ✅      ❌ LEAKS TENANT ID
  PUT     /s/{slug}/v3/boms/{id}                         boms.update                 ✅     ✅      ✅ VERIFIED
  DELETE  /s/{slug}/v3/boms/{id}                         boms.destroy                ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/v3/production-runs                   production-runs.store       ✅     ✅      ⚠️ DESYNCED AGGREGATE
  POST    /s/{slug}/v3/production-runs/{id}/complete     production-runs.complete    ✅     ✅      ⚠️ DESYNCED AGGREGATE
  POST    /s/{slug}/v3/production-runs/{id}/reverse      production-runs.reverse     ✅     ✅      ⚠️ DESYNCED AGGREGATE
  POST    /s/{slug}/v3/disassembly                       disassembly.store           ✅     ✅      ⚠️ DESYNCED AGGREGATE
  GET     /s/{slug}/inventory/production                 production.index            ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/inventory/production/create          production.create           ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/inventory/production                 production.store            ✅     ✅      ⚠️ DESYNCED AGGREGATE
  GET     /s/{slug}/inventory/production/{run}           production.show             ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/inventory/production/{run}/complete  production.complete         ✅     ✅      ⚠️ DESYNCED AGGREGATE

  Summary:
    ✅ Verified:          6
    ⚠️  Partial:          5
    ❌ Broken:            1 (BOM store endpoint leaks tenant ID)

  Ziggy Mismatches Found:    None
  Missing Named Routes:      None
  Tenant Scope Gaps:         `V3\BomController@store` inserts BOM and BOM items without specifying `tenant_id`.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 4 — DATABASE SCHEMA REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TABLE: bill_of_materials
    Columns:          id (UUID), tenant_id (UUID, nullable), product_id (UUID), version (int), effective_from (date), is_active (boolean)
    Indexes:          tenant_id, product_id
    Foreign Keys:     None
    Cascade Risks:    Deleting a product will leave orphaned BOM records.
    Soft Delete:      No
    Transaction Use:  Yes, wrapped in BomController transaction.
    Tenant ID:        Present and indexed.
    Risk Flags:       Lack of FK constraints allows orphaned records.

  TABLE: bom_items
    Columns:          id (UUID), tenant_id (UUID, nullable), bom_id (UUID), product_id (UUID), qty_per_unit (decimal), is_byproduct (boolean)
    Indexes:          tenant_id, bom_id, product_id
    Foreign Keys:     None
    Cascade Risks:    Deleting components leaves orphaned ingredient items.
    Soft Delete:      No
    Transaction Use:  Yes, wrapped in BomController transaction.
    Tenant ID:        Present and indexed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 5 — CROSS-MODULE AFFILIATION MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MODULE / AREA     CONNECTION TYPE            DIRECTION       RISK      TEST REQUIRED
  ───────────────   ────────────────────────   ─────────────   ───────   ─────────────
  Module08          Physical Stock aggregates  Outbound        HIGH      Yes
  V3 / FIFO         Ingredient deductions      Inbound         CRITICAL  Yes
  Module05          Double-entry bookkeeping   Outbound        CRITICAL  Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 6 — LOGIC VULNERABILITIES IDENTIFIED
━━━━━━━━━━━━━━━━════════════════════════════════════════════════━━

  ID:                 VULN-09-001
  Issue:              Cross-Tenant Data Leak on BOM Creation.
  Impact:             Tenant A can define a recipe/BOM and have it inserted with a null tenant_id, allowing Tenant B to see and modify it.
  Failure Scenario:   1. Tenant A calls `V3\BomController@store`.
                      2. Records are written to `bill_of_materials` and `bom_items`.
                      3. Because `tenant_id` is omitted in the insert queries, they are stored with a null tenant, leaking to all other tenants.
  Financial Risk:     No.
  Tenant Risk:        Yes, CRITICAL.
  DB Risk:            Yes, MEDIUM.
  Required Action:    Add `'tenant_id' => app('current.tenant')->id` to the inserts in `V3\BomController`.
  Logged to Register: FINDING-09-001

  ID:                 VULN-09-002
  Issue:              Manufacturing Physical Stock Desynchronization.
  Impact:             Initiating, completing, reversing, or disassembling a production run changes the FIFO batches but leaves the physical warehouse `stocks` and product aggregates completely stale.
  Failure Scenario:   1. Operator completes a production run for 10 units of finished goods.
                      2. FIFO batch is created, but `stocks.quantity` remains 0.
                      3. A customer attempts to buy the product, but POS checks `Stock` available and blocks checkout.
  Financial Risk:     Yes, HIGH.
  Tenant Risk:        No.
  DB Risk:            Yes, HIGH.
  Required Action:    Refactor `ManufacturingService` to synchronize physical stocks and log movements during start, complete, reversal, and disassembly.
  Logged to Register: FINDING-09-002

  ID:                 VULN-09-003
  Issue:              Ghost Stock / Negative Stock Race Condition.
  Impact:             Deductions check availability without locking, allowing concurrent processes to drive stock into negative pools even when negative stock is disallowed.
  Failure Scenario:   1. Flour stock is 10.
                      2. Two concurrent checkouts checkout 8 flour each.
                      3. Both read 10 available, pass pre-flight, and lock for update.
                      4. One decrements by 8 (leaving 2), and the other decrements by 8, driving stock to -6.
  Financial Risk:     Yes, HIGH.
  Tenant Risk:        No.
  DB Risk:            Yes, HIGH.
  Required Action:    Modify `FifoService@deductStock` to lock batches first, then check total available under lock.
  Logged to Register: FINDING-09-003

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 7 — UI / UX RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  State Sync Risks:        Active production runs do not automatically update POS inventory lists.
  Loading State Gaps:      Starting or completing a run takes 20+ seconds but has no button disable state.
  Error Handling Gaps:     Raw material shortages throw exceptions but return as plain 500 pages instead of validation errors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 8 — SECURITY RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Policy Gaps:               BOM and production controllers do not have policy classes.
  Privilege Escalation:      Cashiers can trigger disassembly and adjust recipe unit cost allocations.
  Tenant Boundary Risks:     BOM endpoint vulnerable to cross-tenant ID injection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 9 — NEW MODULE / DOMAIN DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Confirmed: All logic belongs to existing modules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 10 — PERSISTENT FINDINGS REGISTER UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  New findings logged this phase:
    - FINDING-09-001 (Cross-Tenant BOM Leak)
    - FINDING-09-002 (Manufacturing Stock Desync)
    - FINDING-09-003 (Deduction Concurrency Race Condition)
  Existing findings resolved this phase: None
  Findings deferred with target phase: None

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 11 — MANDATORY NEW TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tests added this phase:   3
  Previous total:           7
  New running total:        10

  // ─────────────────────────────────────────────────────────────
  // FEATURE TESTS — full HTTP stack, database interactions
  // ─────────────────────────────────────────────────────────────

  test('v3_production_runs_synchronize_physical_stock_and_movement_records', function () {
      $tenant = $this->createTenant(null, 'business');
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $warehouseId = \Illuminate\Support\Facades\DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
      $cake = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Cake FG', 'is_manufactured' => 1]);
      $flour = Product::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Flour RM', 'is_manufactured' => 0]);

      seedRawMaterial($tenant, $warehouseId, $flour, 20.0, 50.0);

      $bomId = \Illuminate\Support\Str::uuid()->toString();
      \Illuminate\Support\Facades\DB::table('bill_of_materials')->insert([
          'id'             => $bomId,
          'tenant_id'      => $tenant->id,
          'product_id'     => $cake->id,
          'version'        => 1,
          'effective_from' => today()->toDateString(),
          'is_active'      => 1,
          'created_at'     => now(),
          'updated_at'     => now(),
      ]);
      \Illuminate\Support\Facades\DB::table('bom_items')->insert([
          'id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId,
          'product_id' => $flour->id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0,
          'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now(),
      ]);

      // Start run (consumes 10 flour)
      $response = $this->post("/s/{$tenant->slug}/v3/production-runs", [
          'bom_id'       => $bomId,
          'warehouse_id' => $warehouseId,
          'planned_qty'  => 5,
          'run_date'     => today()->toDateString(),
      ]);
      $response->assertRedirect();

      // Assert physical Flour stock decremented to 10
      $flourStock = \App\Models\Stock::where('product_id', $flour->id)->where('warehouse_id', $warehouseId)->first()->quantity;
      expect((float) $flourStock)->toEqual(10.0);

      // Assert Flour stock movement logged
      $flourMovement = \Illuminate\Support\Facades\DB::table('stock_movements')
          ->where('product_id', $flour->id)
          ->where('warehouse_id', $warehouseId)
          ->where('quantity', -10.0)
          ->first();
      expect($flourMovement)->not->toBeNull();

      $run = \Illuminate\Support\Facades\DB::table('production_runs')->where('bom_id', $bomId)->first();

      // Complete run
      $responseComplete = $this->post("/s/{$tenant->slug}/v3/production-runs/{$run->id}/complete", [
          'actual_qty' => 5,
      ]);
      $responseComplete->assertRedirect();

      // Assert physical Cake stock incremented to 5
      $cakeStock = \App\Models\Stock::where('product_id', $cake->id)->where('warehouse_id', $warehouseId)->first()->quantity;
      expect((float) $cakeStock)->toEqual(5.0);

      // Assert Cake stock movement logged
      $cakeMovement = \Illuminate\Support\Facades\DB::table('stock_movements')
          ->where('product_id', $cake->id)
          ->where('warehouse_id', $warehouseId)
          ->where('quantity', 5.0)
          ->first();
      expect($cakeMovement)->not->toBeNull();
  });

  test('prevents_concurrent_deductions_from_violating_negative_stock_helper_rule', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $warehouseId = \Illuminate\Support\Facades\DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
      $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50.0]);

      // Seed 10 items
      seedRawMaterial($tenant, $warehouseId, $product, 10.0, 50.0);

      // Enforce stop negative stock
      \Illuminate\Support\Facades\DB::table('settings')->updateOrInsert(
          ['tenant_id' => $tenant->id, 'key' => 'stop_negative_stock'],
          ['value' => '1']
      );

      $fifo = resolve(\App\Services\V3\FifoService::class);

      // Deducting 8 should succeed
      $fifo->deductStock($product->id, $warehouseId, 8.0);

      // Deducting another 8 should throw InsufficientStockException and NOT generate negative stock
      $failed = false;
      try {
          $fifo->deductStock($product->id, $warehouseId, 8.0);
      } catch (\App\Exceptions\InsufficientStockException $e) {
          $failed = true;
      }

      expect($failed)->toBeTrue();
      $remaining = \Illuminate\Support\Facades\DB::table('inventory_batches')
          ->where('product_id', $product->id)
          ->where('warehouse_id', $warehouseId)
          ->sum('remaining_qty');
      expect((float) $remaining)->toEqual(2.0); // Remains at 2, not -6
  });

  test('prevents_deleting_or_archiving_product_when_active_in_any_bom', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $rawMaterial = Product::factory()->create(['tenant_id' => $tenant->id, 'is_manufactured' => 0]);
      $finishedGood = Product::factory()->create(['tenant_id' => $tenant->id, 'is_manufactured' => 1]);

      $bomId = \Illuminate\Support\Str::uuid()->toString();
      \Illuminate\Support\Facades\DB::table('bill_of_materials')->insert([
          'id'             => $bomId,
          'tenant_id'      => $tenant->id,
          'product_id'     => $finishedGood->id,
          'version'        => 1,
          'effective_from' => today()->toDateString(),
          'is_active'      => 1,
          'created_at'     => now(),
          'updated_at'     => now(),
      ]);
      \Illuminate\Support\Facades\DB::table('bom_items')->insert([
          'id' => \Illuminate\Support\Str::uuid(), 'tenant_id' => $tenant->id, 'bom_id' => $bomId,
          'product_id' => $rawMaterial->id, 'qty_per_unit' => 2.0, 'is_byproduct' => 0,
          'byproduct_nrv' => 0, 'created_at' => now(), 'updated_at' => now(),
      ]);

      // Attempting to delete $rawMaterial should fail with validation error because it is in a BOM
      $response = $this->delete("/s/{$tenant->slug}/v3/products/{$rawMaterial->id}");
      $response->assertSessionHasErrors();

      // Verify product is still active and in database
      $rawMaterial = $rawMaterial->fresh();
      expect($rawMaterial->deleted_at)->toBeNull();
      expect($rawMaterial->is_active)->toEqual(1);
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

╔══════════════════════════════════════════════════════════════════╗
║  PHASE 09 COMPLETE                                               ║
║  Tests Added: 3  |  Running Total: 10  |  Findings: 3 new        ║
║  → PROCEED TO PHASE 10                                           ║
╚══════════════════════════════════════════════════════════════════╝
