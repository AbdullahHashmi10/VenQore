╔══════════════════════════════════════════════════════════════════╗
║  PHASE 04 — PAYMENT PROCESSING                                   ║
║  Status: IN PROGRESS                                             ║
╚══════════════════════════════════════════════════════════════════╝

◈ REGISTER CHECK
  Open findings targeted at this phase: None
  Actions taken on each: N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 1 — SCOPE INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Controllers:           
    - App\Http\Controllers\PaymentController
    - App\Http\Controllers\V3\CustomerPaymentController
    - App\Http\Controllers\V3\SupplierPaymentController
    - App\Http\Controllers\V3\SaleController
    - App\Http\Controllers\SaleController
  Models:                
    - App\Models\Payment
    - App\Models\PaymentAllocation
    - App\Models\JournalEntry
    - App\Models\JournalItem
    - App\Models\Account
    - App\Models\Party
    - App\Models\Sale
    - App\Models\TenantPlanOverride
  Policies:              None
  Form Requests:         
    - App\Http\Requests\V3\StoreSupplierPaymentRequest
    - App\Http\Requests\V3\StoreSaleRequest
  Services / Actions:    
    - App\Services\V3\PaymentService
    - App\Services\V3\AccountingService
    - App\Services\V3\PartyService
    - App\Services\SaleReversalService
    - App\Services\V3\SaleService
  Jobs / Events:         None
  Observers / Traits:    None
  Middleware:            
    - auth (web/api)
    - tenant (store scope)
    - verified
  Routes:                
    - GET /s/{store_slug}/payments {payments.index}
    - GET /s/{store_slug}/payments/in {payments.in}
    - GET /s/{store_slug}/payments/out {payments.out}
    - POST /s/{store_slug}/payments {payments.store}
    - GET /s/{store_slug}/payments/{payment} {payments.show}
    - POST /s/{store_slug}/v3/supplier-payments {store.v3.supplier-payments.store}
    - POST /s/{store_slug}/v3/customer-payments {store.v3.customer-payments.store}
    - POST /s/{store_slug}/v3/sales {store.v3.sales.store}
  Frontend Pages:        
    - resources/js/Pages/Payments/PaymentsList.jsx
    - resources/js/Pages/Payments/In.jsx
    - resources/js/Pages/Payments/Out.jsx
    - resources/js/Pages/Payments/Show.jsx
  Frontend Components:   None
  Hooks / Stores:        None
  Database Tables:       
    - payments
    - payment_allocations
    - journal_entries
    - journal_items
    - accounts
    - parties
    - sales
  Factories / Seeders:   
    - database/factories/PaymentFactory.php
  Existing Test Files:   
    - Tester/tests/Feature/Module04/PaymentProcessingTest.php
  Existing Test Count:   4 tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 2 — EXISTING COVERAGE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Verified Coverage:
    - Split payments processing (cash, bank, and credit ledger legs).
    - Monthly transaction limit enforcement (limit overridden to 5, 6th checkout blocked).
    - Negative stock blocking/allowing based on `stop_sale_negative_stock` system setting.
    - Discount waterfall precision (calculations matching retail subtotal, net sales, tax, and invoice total).

  Coverage Gaps Identified:
    - **Reversal / cancellation of split payments:** Reversals correctly update the double-entry ledger, but do not reverse or void matching payment records in the `payments` table or pro-rate operational cash refunds, leading to cash drawer leaks.
    - **Overpayment and over-allocation exceptions:** Over-allocations trigger raw `OverAllocationException` exceptions which bubble up as unhandled 500 errors.
    - **Plan limit check concurrency:** Count queries run outside any transactional isolation or lock, exposing checkouts to concurrency bypasses.

  False Confidence Areas:
    - The existing `split payment` test only asserts the posting of the sale and three payment legs, but does not test what happens when that split payment is returned or cancelled. In reality, the operational payments table remains un-reversed or gets incorrectly refunded in full via a single method.

  Pre-Audit Confidence Score:   60%
  Target Confidence Score:      95%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 3 — ROUTE INTEGRITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  METHOD  URI                                       ROUTE NAME                        ZIGGY  TENANT  STATUS
  ──────  ────────────────────────────────────────  ────────────────────────────────  ─────  ──────  ──────
  GET     /s/{store_slug}/payments                  payments.index                    ✅     ✅      ✅ VERIFIED
  GET     /s/{store_slug}/payments/in               payments.in                       ✅     ✅      ✅ VERIFIED
  GET     /s/{store_slug}/payments/out              payments.out                      ✅     ✅      ✅ VERIFIED
  POST    /s/{store_slug}/payments                  payments.store                    ✅     ✅      ✅ VERIFIED
  GET     /s/{store_slug}/payments/{payment}        payments.show                     ✅     ✅      ✅ VERIFIED
  POST    /s/{store_slug}/v3/supplier-payments      store.v3.supplier-payments.store  ✅     ✅      ✅ VERIFIED
  POST    /s/{store_slug}/v3/customer-payments      store.v3.customer-payments.store  ✅     ✅      ✅ VERIFIED
  POST    /s/{store_slug}/v3/sales                  store.v3.sales.store              ✅     ✅      ✅ VERIFIED

  Summary:
    ✅ Verified:          8
    ⚠️  Partial:          0
    ❌ Broken:            0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 4 — DATABASE SCHEMA REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TABLE: payments
    Columns:          id (char 36, PK), tenant_id (bigint, FK), sale_id (char 36, nullable, FK), party_id (bigint, nullable, FK), amount (decimal 15,2), method (varchar 50), type (enum in/out), reference (string, nullable), date (date), created_at, updated_at
    Indexes:          tenant_id, sale_id, party_id, date
    Foreign Keys:     tenant_id references tenants(id) ON DELETE CASCADE, sale_id references sales(id) ON DELETE SET NULL, party_id references parties(id) ON DELETE SET NULL
    Cascade Risks:    None (uses SET NULL or CASCADE safely)
    Soft Delete:      No (financial records are reversed, not soft-deleted)
    Transaction Use:  Fully wrapped inside sale store and return actions.
    Tenant ID:        Present and indexed (Yes)

  TABLE: payment_allocations
    Columns:          id (char 36, PK), tenant_id (bigint, FK), payment_journal_entry_id (char 36, FK), sale_id (char 36, nullable, FK), purchase_id (char 36, nullable, FK), allocated_amount (decimal 15,2), status (enum active/reversed), created_at, updated_at
    Indexes:          tenant_id, payment_journal_entry_id, sale_id, purchase_id
    Foreign Keys:     tenant_id references tenants(id) ON DELETE CASCADE
    Cascade Risks:    None
    Soft Delete:      No
    Transaction Use:  Fully wrapped in PaymentService transactions.
    Tenant ID:        Present and indexed (Yes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 5 — CROSS-MODULE AFFILIATION MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MODULE / AREA     CONNECTION TYPE            DIRECTION       RISK      TEST REQUIRED
  ───────────────   ────────────────────────   ─────────────   ───────   ─────────────
  Module05 (Ledger) Double-Entry Sync          Outbound        CRITICAL  Yes
  Module06 (Checkout)Payment allocation/status  Inbound         CRITICAL  Yes
  Module03 (POS)    Cash Drawer Session Sync   Bidirectional   HIGH      Yes
  Billing           Plan limit gate enforcementInbound         HIGH      Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 6 — LOGIC VULNERABILITIES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ID:                 VULN-04-001
  Issue:              Split Payment Reversal Journal Leak (Payments mismatch).
  Impact:             When a split-paid sale is cancelled, the ledger accounts are correctly reversed, but the operational `payments` table records are not reversed or voided. For returns, a single-leg refund payment is logged, which fails to match the original payment distribution, leading to cash drawer leaks (refunding cash when bank transfer/ledger was used).
  Failure Scenario:   A customer pays PKR 400 cash + PKR 350 bank + PKR 250 credit. The sale is returned. The operator processes a return and selects a cash refund. The system returns PKR 1,000 in cash, leaking PKR 600 cash out of the drawer compared to what was received.
  Financial Risk:     Yes — HIGH severity.
  Tenant Risk:        No.
  DB Risk:            No.
  Required Action:    Modify `SaleReversalService` and `SaleController@returnSale` to void/refund payments proportionally matching the original split payment legs.
  Logged to Register: FINDING-04-001

  ID:                 VULN-04-002
  Issue:              Zero-Balance / Over-Payment Accounting Hole.
  Impact:             Over-allocating a customer or supplier payment throws a raw `OverAllocationException` which bubbles up as a 500 error instead of a 422 validation response. Furthermore, overpayments during checkout in `SaleService@post` clamp the cash ledger debit to the invoice total, dropping the overpaid surplus entirely from accounting instead of routing it to Customer Advances (`2100`) as an asset liability.
  Failure Scenario:   A customer pays PKR 1,200 on a PKR 1,000 credit invoice. The system throws a 500 crash page due to `OverAllocationException`, or in V3 checkout, the PKR 200 surplus is discarded from the ledger.
  Financial Risk:     Yes — HIGH severity (untracked cash surplus / broken books).
  Tenant Risk:        No.
  DB Risk:            No.
  Required Action:    Catch `OverAllocationException` in payment controllers and return a HTTP 422 JSON validation error. Update `SaleService` and `SaleController` to post overpayment surplus amounts to Account `2100` (Customer Advances) as a credit liability.
  Logged to Register: FINDING-04-002

  ID:                 VULN-04-003
  Issue:              Plan Limit Concurrency Bypass.
  Impact:             Count queries for monthly transaction limits run outside of any database transaction or shared lock. Under high concurrency, multiple checkouts can pass the check concurrently before either commits, allowing tenants to exceed their monthly transaction limits.
  Failure Scenario:   A tenant is at 4/5 monthly transaction limit. Two checkouts happen concurrently. Both read the count as 4, pass the check, and create sales. The count becomes 6, bypassing the plan limit gate.
  Financial Risk:     No (Plan/Billing Risk).
  Tenant Risk:        No.
  DB Risk:            No.
  Required Action:    Implement a database lock or transactional check to ensure atomic validation of transaction limits.
  Logged to Register: FINDING-04-003

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 7 — UI / UX RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  State Sync Risks:        None.
  Loading State Gaps:      None.
  Error Handling Gaps:     Unhandled 500 server crash on overpayment allocation instead of a field-level error or toast.
  POS Keyboard Risks:      None.
  Empty State Issues:      None.
  Modal Behavior Issues:   None.
  Pagination Issues:       None.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 8 — SECURITY RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Policy Gaps:               None.
  Privilege Escalation:      None.
  Tenant Boundary Risks:     Verify that `payment_allocations` query inside `PaymentService` is strictly scoped to `app('current.tenant')->id` (verified: `checkOverAllocation` and `updatePaymentBadge` apply the tenant filter correctly, preventing cross-tenant leakage).
  Session / Token Risks:     None.
  Unguarded Routes:          None.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 9 — NEW MODULE / DOMAIN DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Confirmed: All logic belongs to existing modules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 10 — PERSISTENT FINDINGS REGISTER UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  New findings logged this phase:        
    - FINDING-04-001 (Split Payment Reversal Journal Leak)
    - FINDING-04-002 (Zero-Balance / Over-Payment Accounting Hole)
    - FINDING-04-003 (Plan Limit Concurrency Bypass)
  Existing findings resolved this phase: None
  Findings deferred with target phase:   None

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 11 — MANDATORY NEW TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Tests Added: 0 (Report Draft Only)
  Previous Total: 425
  New Running Total: 425 (Blueprints proposed below)

  // ─────────────────────────────────────────────────────────────
  // 1. SPLIT PAYMENT REVERSAL JOURNAL LEAK TESTS
  // ─────────────────────────────────────────────────────────────

  it('correctly voids all payment table rows when a split-paid sale is cancelled', function () {
      $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
      $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 1000.00]);
      Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);

      // Create a sale paid with: Cash 400 + Bank 350 + Credit 250
      $data = [
          'customer_id' => $customer->id,
          'warehouse_id' => $this->warehouseId,
          'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 1000.00]],
          'payment_method' => 'split',
          'amount_paid' => 1000.00,
          'payments' => [
              ['method' => 'cash', 'amount' => 400.00],
              ['method' => 'bank', 'amount' => 350.00],
              ['method' => 'credit', 'amount' => 250.00],
          ],
          'add_to_ledger' => true,
      ];

      $response = $this->post("/s/{$this->tenant->slug}/sales", $data);
      $response->assertStatus(200);
      $saleId = $response->json('sale_id');
      $sale = Sale::find($saleId);

      // Cancel the sale
      $cancelResponse = $this->post("/s/{$this->tenant->slug}/sales/{$sale->id}/cancel", ['reason' => 'Customer return']);
      $cancelResponse->assertStatus(302); // Redirect back

      // Assert that counter payment rows are generated to balance the payments ledger
      $payments = Payment::where('sale_id', $saleId)->get();
      // Original 3 payments + 3 reversal payments = 6 payments total
      expect($payments)->toHaveCount(6);
      expect($payments->where('amount', -400.00)->where('method', 'cash'))->not->toBeNull();
      expect($payments->where('amount', -350.00)->where('method', 'bank'))->not->toBeNull();
      expect($payments->where('amount', -250.00)->where('method', 'credit'))->not->toBeNull();
  });

  it('rejects full cash refunds on split sales containing bank/credit legs to prevent cash drawer leaks', function () {
      $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
      $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 1000.00]);
      Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);

      $data = [
          'customer_id' => $customer->id,
          'warehouse_id' => $this->warehouseId,
          'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 1000.00]],
          'payment_method' => 'split',
          'amount_paid' => 1000.00,
          'payments' => [
              ['method' => 'cash', 'amount' => 400.00],
              ['method' => 'bank', 'amount' => 350.00],
              ['method' => 'credit', 'amount' => 250.00],
          ],
          'add_to_ledger' => true,
      ];

      $response = $this->post("/s/{$this->tenant->slug}/sales", $data);
      $response->assertStatus(200);
      $sale = Sale::find($response->json('sale_id'));

      // Attempt a refund entirely in cash (refundSource = cash_drawer, amount = 1000)
      // This should fail validation because the cash leg was only 400.00
      $returnResponse = $this->post("/s/{$this->tenant->slug}/sales/{$sale->id}/return", [
          'refund_method' => 'cash',
          'refund_source' => 'cash_drawer',
          'reason' => 'Customer return',
      ]);

      // Should return validation error or fail gracefully
      $returnResponse->assertSessionHasErrors(['refund_source']);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. ZERO-BALANCE / OVER-PAYMENT ACCOUNTING HOLE TESTS
  // ─────────────────────────────────────────────────────────────

  it('returns a graceful 422 validation error when allocating an overpayment instead of crashing with 500', function () {
      $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
      $sale = Sale::factory()->create([
          'tenant_id' => $this->tenant->id,
          'party_id' => $customer->id,
          'total' => 100.00,
          'payment_status' => 'unpaid',
      ]);

      // Attempt to allocate 120.00 to a 100.00 invoice
      $response = $this->postJson("/s/{$this->tenant->slug}/v3/customer-payments", [
          'customer_id' => $customer->id,
          'payment_date' => now()->toDateString(),
          'payment_method' => 'cash',
          'amount' => 120.00,
          'allocations' => [
              ['sale_id' => $sale->id, 'amount' => 120.00]
          ]
      ]);

      // Assert status is 422 and not 500
      expect($response->status())->toBe(422);
      expect($response->json('errors.allocations'))->toContain('Cannot allocate more than invoice total');
  });

  it('routes sale checkout cash overpayment to Customer Advances Account 2100 in double-entry ledgers', function () {
      $customer = Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer']);
      $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 1000.00]);
      Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);

      // Purchase PKR 1,000 invoice, but customer pays PKR 1,200 (overpayment PKR 200)
      $data = [
          'customer_id' => $customer->id,
          'warehouse_id' => $this->warehouseId,
          'items' => [['product_id' => $product->id, 'quantity' => 1, 'price' => 1000.00]],
          'payment_method' => 'cash',
          'amount_paid' => 1200.00,
          'add_to_ledger' => true,
      ];

      $response = $this->post("/s/{$this->tenant->slug}/sales", $data);
      $response->assertStatus(200);

      // Verify double-entry ledger has PKR 200 credit on Customer Advances (2100 or 2050 depending on chart)
      $this->assertDatabaseHas('journal_items', [
          'tenant_id' => $this->tenant->id,
          'debit' => 0.00,
          'credit' => 200.00,
      ]);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. PLAN LIMIT CONCURRENCY EXHAUSTION TESTS
  // ─────────────────────────────────────────────────────────────

  it('blocks concurrent checkout requests that attempt to exceed the monthly transaction limit', function () {
      // Set monthly transaction limit to 1
      TenantPlanOverride::create([
          'tenant_id' => $this->tenant->id,
          'override_key' => 'transactions_per_month',
          'override_value' => '1',
          'applied_by' => 1,
      ]);
      \App\Services\PlanRepository::invalidateTenantCache($this->tenant->id);

      $product = Product::factory()->create(['tenant_id' => $this->tenant->id, 'price' => 100.00]);
      Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 10]);

      $data = [
          'customer_id' => Party::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'customer'])->id,
          'warehouse_id' => $this->warehouseId,
          'sale_date' => now()->toDateString(),
          'payment_method' => 'cash',
          'amount_received' => 100.00,
          'items' => [[
              'product_id' => $product->id,
              'qty' => 1,
              'sale_uom' => 'PCS',
              'unit_price' => 100.00,
          ]]
      ];

      // Simulate concurrent requests
      // First checkout should succeed
      $response1 = $this->post("/s/{$this->tenant->slug}/v3/sales", $data);
      $response1->assertStatus(302);

      // Second checkout should immediately fail with 403 or 422 plan limit error
      $response2 = $this->post("/s/{$this->tenant->slug}/v3/sales", $data);
      expect($response2->status())->toBe(403);
  });

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 12 — PHASE COMPLETION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Before marking this phase COMPLETE, every item below must be checked.
  A phase with any unchecked item is not complete — it is deferred.

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
║  PHASE 04 DEFERRED FOR CODE FIX AUTHORIZATION                    ║
║  Tests Added: 0  |  Running Total: 425  |  Findings: 3 new       ║
║  → AWAITING CONFIRMATION TO PATCH VULNERABILITIES                ║
╚══════════════════════════════════════════════════════════════════╝
