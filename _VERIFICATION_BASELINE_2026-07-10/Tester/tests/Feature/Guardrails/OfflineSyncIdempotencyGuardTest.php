<?php

namespace Tester\Tests\Feature\Guardrails;

use App\Http\Controllers\Api\SyncController;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * OfflineSyncIdempotencyGuardTest — double-post regression guard.
 *
 * The offline POS caches sales locally (Dexie/IndexedDB) with a client-side
 * UUID and replays them to POST /api/sync/orders/batch when connectivity
 * returns. If a replay is retried (flaky network, user re-tap), the SAME sale
 * must NOT be created twice — a double-post is a double-charge and double
 * revenue in the ledger.
 *
 * Idempotency is implemented at SyncController::batchOrders:
 *     if (Sale::where('id', $orderData['id'])->exists()) continue;
 * and SaleController::store honours the incoming `id`
 * ($request->input('id', Str::uuid())), so the dedupe key matches on retry.
 *
 * This test pins that contract: re-submitting an already-synced order id does
 * not create a second sales row. If someone removes the exists() check (or
 * store() stops honouring the client id), this goes red.
 */
class OfflineSyncIdempotencyGuardTest extends VenQoreTestCase
{
    public function test_resubmitting_an_already_synced_sale_does_not_duplicate_it(): void
    {
        $tenant = $this->createTenant('sync-guard', 'ltd_3', 'active');
        $user = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($user, $tenant);
        app()->instance('current.tenant', $tenant);

        // Simulate a sale that already landed on the server on the first sync.
        $clientId = (string) Str::uuid();
        Sale::create([
            'id'               => $clientId,
            'reference_number' => 'SYNC-DEDUPE-1',
            'user_id'          => $user->id,
            'subtotal'         => 100.00,
            'total'            => 100.00,
        ]);

        $this->assertSame(1, DB::table('sales')->where('id', $clientId)->count());

        // The offline client retries the batch containing that same order id.
        $request = new Request([
            'orders' => [
                ['id' => $clientId, 'items' => []],
                ['id' => $clientId, 'items' => []], // same id twice in one batch
            ],
        ]);

        $response = app(SyncController::class)->batchOrders($request);

        // Still exactly one row — the dedupe short-circuited both retries.
        $this->assertSame(
            1,
            DB::table('sales')->where('id', $clientId)->count(),
            'DOUBLE-POST REGRESSION: an already-synced offline sale was created again on retry.'
        );

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_offline_sync_idempotency_under_missing_tenant_context(): void
    {
        $tenant = $this->createTenant('sync-guard-missing-context', 'ltd_3', 'active');
        $user = $this->createTenantUser($tenant, 'owner');
        
        // Save the sale under the tenant first
        $clientId = (string) Str::uuid();
        Sale::create([
            'id'               => $clientId,
            'reference_number' => 'SYNC-DEDUPE-MISSING-CONTEXT',
            'user_id'          => $user->id,
            'tenant_id'        => $tenant->id,
            'subtotal'         => 150.00,
            'total'            => 150.00,
        ]);

        // Break tenant context
        app()->forgetInstance('current.tenant');

        // Verify the database check without context is still functional and detects the sale
        $this->assertTrue(Sale::withoutGlobalScope('tenant')->where('id', $clientId)->exists());

        // Call the endpoint with NO bound tenant context.
        $request = new Request([
            'orders' => [
                ['id' => $clientId, 'items' => []],
            ],
        ]);

        $response = app(SyncController::class)->batchOrders($request);

        // Should not duplicate the sale, and should successfully return 200
        $this->assertSame(
            1,
            DB::table('sales')->where('id', $clientId)->count(),
            'DOUBLE-POST REGRESSION: Sale was duplicated when syncing with no bound tenant context.'
        );
        $this->assertSame(200, $response->getStatusCode());
    }
}

