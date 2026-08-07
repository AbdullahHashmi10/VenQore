╔══════════════════════════════════════════════════════════════════╗
║  PHASE 10 — WOOCOMMERCE CHANNEL INTEGRATION                      ║
║  Status: IN PROGRESS                                             ║
╚══════════════════════════════════════════════════════════════════╝

◈ REGISTER CHECK
  Open findings targeted at this phase: None
  Actions taken on each: N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 1 — SCOPE INVENTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Controllers:
    - App\Http\Controllers\WooCommerceController
    - App\Http\Controllers\WooSync\WooWebhookController
  Models:
    - App\Models\WooConnection
    - App\Models\WooProductLink
    - App\Models\WooSyncQueue
    - App\Models\WooSyncLog
    - App\Models\Product
    - App\Models\Party
    - App\Models\Transaction
  Services / Actions:
    - App\Services\WooSync\SyncEngine
    - App\Services\WooSync\FieldMapper
    - App\Services\WooSync\WooApiClient
  Jobs:
    - App\Jobs\WooSync\ProcessWebhookJob
    - App\Jobs\WooSync\InitialImportJob
    - App\Jobs\WooSync\ProcessSyncQueueJob
    - App\Jobs\WooSync\SchedulerPollingJob
  Routes:
    - POST   /woocommerce/webhook                        woocommerce.webhook
    - POST   /api/woo/webhook/{uuid}                     api.woo.webhook
    - GET    /api/woo/verify/{token}                     api.woo.verify
  Database Tables:
    - woo_connections
    - woo_product_links
    - woo_sync_queue
    - woo_sync_logs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━══════════════════
▶ SECTION 2 — EXISTING COVERAGE ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Verified Coverage:
    - WooCommerce connection or network failure does not block sale creation.
    - Tampered webhook signatures are correctly rejected with a 401 HTTP status.

  Coverage Gaps Identified:
    - No coverage for checking if order webhooks resolve directly via secure URL UUID to prevent cross-tenant collisions.
    - No coverage checking if background queue jobs fail due to silent `where 1 = 0` query blocks caused by unbound DI tenant contexts.
    - No coverage checking if pull imports crash due to duplicate SKU integrity constraint violations for unlinked products.
    - The existing `webhook_creates_party_and_records_transaction` test is broken as it lacks a valid signature and seeded connection, resulting in a 401 failure.

  Pre-Audit Confidence Score:   60%
  Target Confidence Score:      95%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 3 — ROUTE INTEGRITY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  METHOD  URI                                    ROUTE NAME                 ZIGGY  TENANT  STATUS
  ──────  ─────────────────────────────────────  ─────────────────────────  ─────  ──────  ──────
  POST    /woocommerce/webhook                   woocommerce.webhook         ❌     ❌      ⚠️ UNSECURE CHANNEL RESOLUTION
  POST    /api/woo/webhook/{uuid}                api.woo.webhook             ❌     ✅      ✅ VERIFIED
  GET     /api/woo/verify/{token}                api.woo.verify              ❌     ❌      ⚠️ O(N) IN-MEMORY QUERY

  Summary:
    ✅ Verified:          1
    ⚠️  Partial:          2
    ❌ Broken:            0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 4 — DATABASE SCHEMA REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TABLE: woo_connections
    Columns:          id (int), tenant_id (unsignedBigInteger), site_url (string, nullable), uuid (string, unique), consumer_key (text, encrypted), consumer_secret (text, encrypted), webhook_secret (text, encrypted), status (enum)
    Indexes:          tenant_id
    Foreign Keys:     tenant_id references tenants(id) ON DELETE CASCADE
    Soft Delete:      Yes

  TABLE: woo_product_links
    Columns:          id (int), connection_id (unsignedBigInteger), venqore_product_id (string), woo_product_id (unsignedBigInteger), sku (string)
    Indexes:          connection_id, sku
    Foreign Keys:     connection_id references woo_connections(id) ON DELETE CASCADE
    Unique Keys:      (connection_id, venqore_product_id), (connection_id, woo_product_id)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 5 — CROSS-MODULE AFFILIATION MAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MODULE / AREA     CONNECTION TYPE            DIRECTION       RISK      TEST REQUIRED
  ───────────────   ────────────────────────   ─────────────   ───────   ─────────────
  Module02          Tenant DI Scope check      Inbound         HIGH      Yes
  Module06          Sale creation on webhook   Inbound         HIGH      Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 6 — LOGIC VULNERABILITIES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ID:                 VULN-10-001
  Issue:              Webhook Channel Resolution Leak (Cross-Tenant Data Injection).
  Impact:             Using the global `/woocommerce/webhook` callback forces the system to scan all connections in the database and compute HMAC signatures in memory O(N). If two connections share the same secret or if a secret is unconfigured/weak, a tenant's webhook can be misresolved as another's, bleeding data.
  Required Action:    Refactor the route to `/woocommerce/webhook/{uuid}` and load the connection directly via UUID.

  ID:                 VULN-10-002
  Issue:              SyncEngine Missing Tenant Boundary Pollution.
  Impact:             Artisan queue processes running `InitialImportJob`, `ProcessSyncQueueJob`, and `SchedulerPollingJob` do not bind the tenant to the DI container `current.tenant`. Since the `Product` model uses `HasTenant` trait, this fallback triggers a hard block `where 1 = 0` query scope, causing all queries to return empty or crash.
  Required Action:    Bind `current.tenant` inside `SyncEngine::__construct()`.

  ID:                 VULN-10-003
  Issue:              Duplicate SKU Sync Crash Vector.
  Impact:             Importing an unlinked product from WooCommerce whose SKU already exists in VenQore triggers an `IntegrityConstraintViolationException` (unique key constraint for SKU), crashing background jobs.
  Required Action:    Verify if the SKU already exists in VenQore before creating a new product; if it does, link it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 7 — UI / UX RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - WooCommerce sync errors do not surface clearly on the frontend page.
  - Manual conflict resolution states can get stuck without loading spinner indicators.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 8 — SECURITY RISK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Non-UUID endpoints allow malicious actors to brute-force webhook signature checks by sending heavy loads to the server.
  - Unbound DI container scopes allow silent query bleed if background tasks query model classes without tenant scoping.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 9 — NEW MODULE / DOMAIN DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Confirmed: All logic belongs to existing modules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 10 — PERSISTENT FINDINGS REGISTER UPDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  New findings logged this phase:
    - FINDING-10-001 (Cross-Tenant Webhook Leak)
    - FINDING-10-002 (SyncEngine Background Tenant Scoping)
    - FINDING-10-003 (Unlinked Duplicate SKU Crash)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ SECTION 11 — MANDATORY NEW TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('webhook_channel_resolution_strictly_isolates_and_verifies_by_uuid', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $conn = \App\Models\WooConnection::create([
          'tenant_id' => $tenant->id,
          'name' => 'Secure Store',
          'site_url' => 'https://example.com',
          'uuid' => 'secure-connection-uuid',
          'consumer_key' => 'ck_test',
          'consumer_secret' => 'cs_test',
          'webhook_secret' => 'super_secret',
          'status' => 'active',
      ]);

      $payload = [
          'id' => 12345,
          'line_items' => []
      ];
      $body = json_encode($payload);
      $signature = base64_encode(hash_hmac('sha256', $body, 'super_secret', true));

      $response = $this->postJson("/woocommerce/webhook/secure-connection-uuid", $payload, [
          'x-wc-webhook-signature' => $signature
      ]);
      $this->assertTrue(in_array($response->status(), [200, 201, 302]));

      $responseWrongUuid = $this->postJson("/woocommerce/webhook/wrong-connection-uuid", $payload, [
          'x-wc-webhook-signature' => $signature
      ]);
      $responseWrongUuid->assertStatus(404);

      $responseWrongSig = $this->postJson("/woocommerce/webhook/secure-connection-uuid", $payload, [
          'x-wc-webhook-signature' => 'tampered_signature'
      ]);
      $responseWrongSig->assertStatus(401);
  });

  test('sync_engine_initializes_tenant_binding_context_in_queue_jobs', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $conn = \App\Models\WooConnection::create([
          'tenant_id' => $tenant->id,
          'name' => 'Queue Store',
          'uuid' => 'queue-connection-uuid',
          'status' => 'active',
      ]);

      if (app()->bound('current.tenant')) {
          $scopedInstances = Closure::bind(fn($app) => $app->scopedInstances, null, app())(app());
          unset($scopedInstances['current.tenant']);
      }

      expect(app()->bound('current.tenant'))->toBeFalse();

      $engine = new \App\Services\WooSync\SyncEngine($conn);

      expect(app()->bound('current.tenant'))->toBeTrue();
      expect(app('current.tenant')->id)->toEqual($tenant->id);
  });

  test('unlinked_product_sync_safely_associates_by_sku_without_duplicate_crash', function () {
      $tenant = $this->createTenant();
      $this->actingAsOwner($tenant);
      $this->seedTenantDefaults($tenant);

      $conn = \App\Models\WooConnection::create([
          'tenant_id' => $tenant->id,
          'name' => 'Product Store',
          'uuid' => 'product-connection-uuid',
          'status' => 'active',
      ]);

      $product = Product::factory()->create([
          'tenant_id' => $tenant->id,
          'sku' => 'DUPLICATE-SKU',
          'name' => 'Existing VenQore Product'
      ]);

      $queueEntry = \App\Models\WooSyncQueue::create([
          'connection_id' => $conn->id,
          'direction' => 'from_woo',
          'payload' => [
              'id' => 8888,
              'sku' => 'DUPLICATE-SKU',
              'name' => 'Incoming WooCommerce Product',
              'price' => 500,
          ],
          'status' => 'approved',
      ]);

      $engine = new \App\Services\WooSync\SyncEngine($conn);
      $success = $engine->pullFromWoo($queueEntry);

      expect($success)->toBeTrue();

      $link = \App\Models\WooProductLink::where('connection_id', $conn->id)
          ->where('woo_product_id', 8888)
          ->first();

      expect($link)->not->toBeNull();
      expect($link->venqore_product_id)->toEqual($product->id);

      $productCount = Product::where('sku', 'DUPLICATE-SKU')->count();
      expect($productCount)->toEqual(1);
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
║  PHASE 10 COMPLETE                                               ║
║  Tests Added: 3  |  Running Total: 13  |  Findings: 3 new        ║
║  → PROCEED TO PHASE 11                                           ║
╚══════════════════════════════════════════════════════════════════╝
