<?php

namespace Tests\Feature\Reckoner\Laws;

use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerRequest;
use Illuminate\Support\Facades\DB;
use Tests\Feature\VenQoreTestCase;

/**
 * L6 — Permission Law
 *
 * Every reading refuses with 'forbidden' when the actor lacks ALL of its
 * declared permissions, and executes ZERO database queries when it refuses.
 *
 * Extends the existing ReckonerGateTest query-count spy pattern to every
 * reading in the registry, not just one hand-picked example.
 *
 * Strategy: create a cashier user (minimal permissions). For each reading
 * that the cashier cannot access, assert: (a) result is forbidden, (b) zero
 * queries were issued after the permission cache was primed.
 */
class L6PermissionLawTest extends VenQoreTestCase
{
    public function test_every_reading_executes_zero_queries_when_forbidden(): void
    {
        $tenant = $this->createTenant();
        // Cashier role has the narrowest permission set. We verify per-reading
        // whether the cashier actually lacks all required permissions.
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashier);

        // Warm the permission cache to exclude permission lookups from query count.
        $cashier->hasPermission('__warm__');

        $reckoner = new Reckoner();
        $all      = ReckonerRegistry::all();

        $failures = [];

        foreach ($all as $key => $def) {
            if (($def['scope'] ?? 'tenant') !== 'tenant') {
                continue;
            }
            if (($def['implemented'] ?? true) === false) {
                continue;
            }

            // Determine if cashier should be forbidden for this reading.
            $permissions = $def['permissions'] ?? [];
            if (empty($permissions)) {
                continue; // no permissions declared → always allowed
            }

            $cashierHasAny = false;
            foreach ($permissions as $perm) {
                try {
                    if ($cashier->hasPermission($perm)) {
                        $cashierHasAny = true;
                        break;
                    }
                } catch (\Throwable) {
                }
            }

            if ($cashierHasAny) {
                // Cashier can access this reading — skip (nothing to assert about forbidden).
                continue;
            }

            // Cashier lacks all permissions. Now assert: forbidden + zero queries.
            $queryCount = 0;
            $listener   = DB::listen(function () use (&$queryCount) { $queryCount++; });

            $periodKey = $def['default_period'] ?? 'today';
            $result    = $reckoner->read(new ReckonerRequest($key, $periodKey), $cashier, $tenant);

            DB::getEventDispatcher()->forget('Illuminate\Database\Events\QueryExecuted');

            if ($result->ok) {
                $failures[] = "Reading '{$key}': cashier without permissions got ok=true (permission bypass!).";
                continue;
            }

            if ($result->errorCode !== 'forbidden') {
                $failures[] = "Reading '{$key}': expected errorCode='forbidden', got '{$result->errorCode}'.";
                continue;
            }

            if ($queryCount > 0) {
                $failures[] = "Reading '{$key}': forbidden result issued {$queryCount} queries (should be 0).";
            }
        }

        $this->assertEmpty(
            $failures,
            "L6 Permission Law failures:\n" . implode("\n", $failures)
        );
    }
}
