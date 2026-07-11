╔══════════════════════════════════════════════════════════════════╗
║  PHASE 07 — PROCUREMENT                                          ║
║  Status: IN PROGRESS                                             ║
╚══════════════════════════════════════════════════════════════════╝

◈ REGISTER CHECK
  Open findings targeted at this phase: None
  Actions taken on each: N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 1 — SCOPE INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Controllers:
    - App\Http\Controllers\PurchaseController
    - App\Http\Controllers\PurchaseOrderController
    - App\Http\Controllers\SupplierController
    - App\Http\Controllers\V3\PurchaseController
    - App\Http\Controllers\V3\PurchaseReturnController
  Models:
    - App\Models\Invoice (used as Purchase)
    - App\Models\PurchaseOrder
    - App\Models\PurchaseOrderItem
    - App\Models\Supplier
    - App\Models\Party (Shadow party used for Suppliers)
    - App\Models\InventoryBatch
    - App\Models\Product
    - App\Models\Stock
    - App\Models\StockMovement
  Policies:
    - None (Destroy authorization handled via custom logic check)
  Form Requests:
    - App\Http\Requests\V3\StorePurchaseRequest
  Services / Actions:
    - App\Services\V3\FifoService
  Jobs / Events:
    - None
  Observers / Traits:
    - App\Traits\HasTenant
  Middleware:
    - tenant (applied via store group)
    - auth (applied globally or group-level)
  Routes:
    - POST /s/{slug}/purchases {purchases.store}
    - GET  /s/{slug}/purchases/{purchase}/receive {purchases.receive}
    - POST /s/{slug}/purchases/{purchase}/receive {purchases.storeReceive}
    - POST /s/{slug}/purchase-orders/{purchaseOrder}/receive {purchase-orders.receive}
    - POST /s/{slug}/v3/purchases {store.v3.purchases.store}
    - POST /s/{slug}/v3/purchases/{purchase}/return {store.v3.purchases.return.store}
  Frontend Pages:
    - Tester/resources/js/Pages/Purchases/PurchasesList.jsx
    - Tester/resources/js/Pages/Purchases/Create.jsx
    - Tester/resources/js/Pages/Purchases/Receive.jsx
    - Tester/resources/js/Pages/PurchaseOrders/PurchaseOrdersList.jsx
    - Tester/resources/js/Pages/PurchaseOrders/Create.jsx
    - Tester/resources/js/Pages/V3/Purchases/Index.jsx
    - Tester/resources/js/Pages/V3/Purchases/Create.jsx
    - Tester/resources/js/Pages/V3/Purchases/Return.jsx
  Database Tables:
    - purchases (legacy and v3 shared invoices table)
    - purchase_items (V1 legacy is invoice_items, V3 uses purchase_items)
    - purchase_returns
    - inventory_batches
    - products
    - stocks
    - stock_movements
  Factories / Seeders:
    - None
  Existing Test Files:
    - Tester/tests/Feature/Module07/ProcurementTest.php
  Existing Test Count:
    - 3 tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 2 — EXISTING COVERAGE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Verified Coverage:
    - FIFO Batch creation on standard purchase receiving.
    - Purchase price tracking inside FIFO batches does not overwrite a product's static base cost_price.
    - Partial receiving increments physical stock and updates the purchase order status to 'partial' or 'received'.

  Coverage Gaps Identified:
    - Lack of parameter range check inside FIFO batch initialization (`FifoService@receiveBatch`) allowing negative/zero unit costs.
    - Multi-click/concurrency vulnerability on the partial receiving route (`storeReceive`) and purchase order fulfillment.
    - Complete desynchronization between FIFO batch deductions and physical product stock counts in purchase returns (`V3\PurchaseReturnController`).

  False Confidence Areas:
    - The existing `partial_receiving_updates_order_status_and_stock_correctly` test validates sequential, single-threaded execution. It does not check that receiving more than the expected remainder is blocked, nor does it simulate concurrent double-clicks.

  Pre-Audit Confidence Score:   65%
  Target Confidence Score:      ≥95%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 3 — ROUTE INTEGRITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  METHOD  URI                                              ROUTE NAME                     ZIGGY  TENANT  STATUS
  ──────  ───────────────────────────────────────────────  ─────────────────────────────  ─────  ──────  ──────
  POST    /s/{slug}/purchases                              purchases.store                 ✅     ✅      ✅ VERIFIED
  GET     /s/{slug}/purchases/{purchase}/receive           purchases.receive               ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/purchases/{purchase}/receive           purchases.storeReceive          ✅     ✅      ⚠️ UNGUARDED LOCK
  POST    /s/{slug}/purchase-orders/{purchaseOrder}/receive purchase-orders.receive        ✅     ✅      ⚠️ UNGUARDED LOCK
  POST    /s/{slug}/v3/purchases                           store.v3.purchases.store        ✅     ✅      ✅ VERIFIED
  POST    /s/{slug}/v3/purchases/{purchase}/return         store.v3.purchases.return.store ✅     ✅      ⚠️ DESYNCED

  Summary:
    ✅ Verified:          3
    ⚠️  Partial:          3
    ❌ Broken:            0

  Ziggy Mismatches Found:    None
  Missing Named Routes:      None
  Tenant Scope Gaps:         None

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 4 — DATABASE SCHEMA REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TABLE: purchases (shared via invoices)
    Columns:          id (UUID), tenant_id (FK), total_amount (decimal), status (string)
    Indexes:          tenant_id, status
    Foreign Keys:     tenant_id references tenants(id)
    Cascade Risks:    None
    Soft Delete:      Yes
    Transaction Use:  Fully wrapped in controllers.
    Tenant ID:        Present and indexed.
    Risk Flags:       None.

  TABLE: inventory_batches
    Columns:          id (UUID), tenant_id (FK), product_id (FK), warehouse_id (FK), unit_cost (decimal), remaining_qty (decimal)
    Indexes:          tenant_id, product_id, warehouse_id, remaining_qty
    Foreign Keys:     tenant_id references tenants(id)
    Cascade Risks:    None
    Soft Delete:      Yes (voiding deletes the batch)
    Transaction Use:  Yes, wrapped in FifoService transactions.
    Tenant ID:        Present and indexed.
    Risk Flags:       Zero or negative values accepted on unit_cost without database constraints.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 5 — CROSS-MODULE AFFILIATION MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MODULE / AREA     CONNECTION TYPE            DIRECTION       RISK      TEST REQUIRED
  ───────────────   ────────────────────────   ─────────────   ───────   ─────────────
  V3 / FIFO         Cost calculation source    Inbound         CRITICAL  Yes
  Module08          Inventory allocation       Outbound        HIGH      Yes
  Module05          Double-entry bookkeeping   Outbound        CRITICAL  Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 6 — LOGIC VULNERABILITIES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ID:                 VULN-07-001
  Issue:              FIFO Batch Cost Poisoning in `FifoService@receiveBatch`.
  Impact:             Negative or zero unit costs are stored directly in `inventory_batches`, poisoning downstream cost calculations (COGS) during subsequent sales.
  Failure Scenario:   1. Inbound stock received with `-10` unit cost due to a typo or promo error.
                      2. Database records unit_cost as `-10.00`.
                      3. Stock is sold; FIFO COGS calculation subtracts cost, inflating gross profit to invalid levels.
  Financial Risk:     Yes, CRITICAL.
  Tenant Risk:        No.
  DB Risk:            No.
  Required Action:    Assert unit_cost is positive ($unitCost >= 0) and qty is strictly positive ($qty > 0) in `FifoService@receiveBatch`, throwing `InvalidArgumentException` on violation.
  Logged to Register: FINDING-07-001

  ID:                 VULN-07-002
  Issue:              Multi-click Double-Receiving on Inbound Stock.
  Impact:             Concurrency race condition on `storeReceive` and `purchase-orders.receive` causes duplicate stock increments and inventory batches.
  Failure Scenario:   1. Operator clicks "Receive Stock" twice quickly.
                      2. Both requests execute concurrently, reading initial received_qty.
                      3. Stock increments twice; two distinct inventory batches are generated for the same line item.
  Financial Risk:     Yes, HIGH.
  Tenant Risk:        No.
  DB Risk:            No.
  Required Action:    Implement atomic cache locks (`Cache::lock`) and status/remaining checks in `storeReceive` and `receive` endpoints.
  Logged to Register: FINDING-07-002

  ID:                 VULN-07-003
  Issue:              Purchase Return Double-Entry Inventory Asset & Stock Desync.
  Impact:             Stock is removed from `inventory_batches` but aggregate counters (`products.stock_quantity`, `stocks.quantity`) and stock movement records are completely omitted.
  Failure Scenario:   1. Operator returns 10 units of Product A to supplier.
                      2. AP ledger decreases by $500, and `inventory_batches` decrements.
                      3. `products.stock_quantity` remains at 10, causing a desync between aggregate count and FIFO batches.
  Financial Risk:     Yes, HIGH.
  Tenant Risk:        No.
  DB Risk:            Yes, HIGH.
  Required Action:    In `PurchaseReturnController@store`, explicitly decrement `products.stock_quantity`, `stocks.quantity`, and record a `StockMovement` row.
  Logged to Register: FINDING-07-003

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 7 — UI / UX RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  State Sync Risks:        If receipt fails, frontend state can show received items when database rolled back.
  Loading State Gaps:      No disabled state on button while transaction is in progress, leading to double-click requests.
  Error Handling Gaps:     If quantity received exceeds remaining, the error message returned is an unhandled validation error.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 8 — SECURITY RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Policy Gaps:               Purchase return operations do not have specific policies, relying on generic tenant membership checking.
  Privilege Escalation:      No specific checks preventing managers from creating purchase returns.
  Tenant Boundary Risks:     None. Tenant isolation is enforced via the `tenant` middleware.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 9 — NEW MODULE / DOMAIN DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Confirmed: All logic belongs to existing modules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 10 — PERSISTENT FINDINGS REGISTER UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  New findings logged this phase:
    - FINDING-07-001 (FIFO Cost Poisoning)
    - FINDING-07-002 (Multi-click Double-Receiving)
    - FINDING-07-003 (Purchase Return Inventory Desync)
  Existing findings resolved this phase: None
  Findings deferred with target phase: None

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 11 — MANDATORY NEW TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tests added this phase:   3
  Previous total:           3
  New running total:        6

  // ─────────────────────────────────────────────────────────────
  // UNIT TESTS — isolated logic, no HTTP, no DB
  // ─────────────────────────────────────────────────────────────

  // N/A - FifoService and Controllers require DB/HTTP contexts

  // ─────────────────────────────────────────────────────────────
  // FEATURE TESTS — full HTTP stack, database interactions
  // ─────────────────────────────────────────────────────────────

  test('fifo_batch_poisoning_prevented_on_negative_or_zero_values', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);

      $fifo = app(\App\Services\V3\FifoService::class);
      $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main']);
      $product = Product::factory()->create(['tenant_id' => $tenant->id]);

      // Assert receive negative throws exception
      $failed = false;
      try {
          $fifo->receiveBatch($product->id, $warehouse->id, 10, -5.00);
      } catch (\InvalidArgumentException $e) {
          $failed = true;
          expect($e->getMessage())->toBe('Unit cost cannot be negative.');
      }
      expect($failed)->toBeTrue();

      // Assert receive zero or negative quantity throws exception
      $failedQty = false;
      try {
          $fifo->receiveBatch($product->id, $warehouse->id, 0, 10.00);
      } catch (\InvalidArgumentException $e) {
          $failedQty = true;
          expect($e->getMessage())->toBe('Quantity must be strictly positive.');
      }
      expect($failedQty)->toBeTrue();
  });

  test('multi_click_receiving_prevents_duplicate_batches_and_stock_bloat', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $supplier = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'supplier']);
      $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'stock_quantity' => 0]);
      $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main']);

      $purchase = \App\Models\Invoice::create([
          'tenant_id' => $tenant->id,
          'type' => 'purchase',
          'invoice_number' => 'PUR-12345',
          'party_id' => $supplier->id,
          'date' => now()->toDateString(),
          'total_amount' => 500,
          'status' => 'pending',
          'user_id' => auth()->id() ?? 1,
      ]);

      $invoiceItem = \Illuminate\Support\Facades\DB::table('invoice_items')->insertGetId([
          'id' => \Illuminate\Support\Str::uuid()->toString(),
          'invoice_id' => $purchase->id,
          'product_id' => $product->id,
          'quantity' => 10,
          'unit_price' => 50,
          'base_unit_cost' => 50,
          'effective_unit_cost' => 50,
          'total' => 500,
          'received_qty' => 0,
      ]);

      // Mock first receive request
      $payload = [
          'items' => [
              [
                  'item_id' => $invoiceItem,
                  'receiving_qty' => 10,
              ]
          ]
      ];

      // Send first request - should succeed
      $response1 = $this->postJson("/s/{$tenant->slug}/purchases/{$purchase->id}/receive", $payload);
      $response1->assertOk();

      // Send duplicate request - should fail with 422 because item is fully received
      $response2 = $this->postJson("/s/{$tenant->slug}/purchases/{$purchase->id}/receive", $payload);
      $response2->assertStatus(422);

      // Assert final stock is exactly 10, not 20
      expect($product->fresh()->stock_quantity)->toEqual(10.0);
      expect(InventoryBatch::where('product_id', $product->id)->count())->toEqual(1);
  });

  test('purchase_returns_synchronizes_physical_stock_and_movement_records', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $supplier = Party::factory()->create(['tenant_id' => $tenant->id, 'type' => 'supplier']);
      $product = Product::factory()->create(['tenant_id' => $tenant->id, 'cost_price' => 50, 'stock_quantity' => 10]);
      $warehouse = \App\Models\Warehouse::create(['tenant_id' => $tenant->id, 'name' => 'Main']);

      \App\Models\Stock::create([
          'tenant_id' => $tenant->id,
          'product_id' => $product->id,
          'warehouse_id' => $warehouse->id,
          'quantity' => 10,
      ]);

      $purchase = DB::table('purchases')->insertGetId([
          'id' => \Illuminate\Support\Str::uuid()->toString(),
          'tenant_id' => $tenant->id,
          'invoice_number' => 'PUR-RET',
          'party_id' => $supplier->id,
          'warehouse_id' => $warehouse->id,
          'purchase_date' => now()->toDateString(),
          'subtotal' => 500,
          'tax' => 0,
          'total' => 500,
          'payment_status' => 'paid',
          'payment_method' => 'cash',
          'journal_entry_id' => \Illuminate\Support\Str::uuid()->toString(),
          'created_by' => auth()->id() ?? 1,
          'created_at' => now(),
          'updated_at' => now(),
      ]);

      $batchId = \Illuminate\Support\Str::uuid()->toString();
      DB::table('inventory_batches')->insert([
          'tenant_id' => $tenant->id,
          'id' => $batchId,
          'product_id' => $product->id,
          'warehouse_id' => $warehouse->id,
          'purchase_invoice_id' => $purchase,
          'batch_type' => 'purchase',
          'unit_cost' => 50.00,
          'original_qty' => 10.00,
          'initial_qty' => 10.00,
          'remaining_qty' => 10.00,
          'created_at' => now(),
          'updated_at' => now(),
      ]);

      $purchaseItemId = \Illuminate\Support\Str::uuid()->toString();
      DB::table('purchase_items')->insert([
          'id' => $purchaseItemId,
          'tenant_id' => $tenant->id,
          'purchase_id' => $purchase,
          'product_id' => $product->id,
          'qty' => 10,
          'unit_cost' => 50.00,
          'line_total' => 500.00,
          'inventory_batch_id' => $batchId,
          'created_at' => now(),
      ]);

      $payload = [
          'return_date' => now()->toDateString(),
          'reason' => 'Defective batch',
          'items' => [
              [
                  'purchase_item_id' => $purchaseItemId,
                  'inventory_batch_id' => $batchId,
                  'return_qty' => 6, // returning 6 units
              ]
          ]
      ];

      $response = $this->post("/s/{$tenant->slug}/v3/purchases/{$purchase}/return", $payload);
      $response->assertRedirect();

      // Assert FIFO batch updated (remaining_qty = 10 - 6 = 4)
      $batch = DB::table('inventory_batches')->where('id', $batchId)->first();
      expect((float) $batch->remaining_qty)->toEqual(4.0);

      // Assert physical product and stock quantities updated (10 - 6 = 4)
      expect($product->fresh()->stock_quantity)->toEqual(4.0);
      $stock = DB::table('stocks')->where('product_id', $product->id)->first();
      expect((float) $stock->quantity)->toEqual(4.0);

      // Assert StockMovement generated
      $movement = DB::table('stock_movements')
          ->where('product_id', $product->id)
          ->where('type', 'purchase_return')
          ->first();
      expect($movement)->not->toBeNull();
      expect((float) $movement->quantity)->toEqual(-6.0);
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
