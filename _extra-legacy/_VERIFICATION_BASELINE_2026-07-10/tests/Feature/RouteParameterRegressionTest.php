<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RouteParameterRegressionTest extends TestCase
{
    /** @test */
    public function test_route_parameter_names_match_frontend_expectations(): void
    {
        $expectedRoutes = [
            // ── Existing routes ────────────────────────────────────────────────
            'store.sales.edit'                          => ['store_slug', 'sale'],
            'store.sales.show'                          => ['store_slug', 'sale'],
            'store.sales.destroy'                       => ['store_slug', 'sale'],
            'store.sales.print'                         => ['store_slug', 'sale'],
            'store.sales.cancel'                        => ['store_slug', 'sale'],
            'store.sales.update'                        => ['store_slug', 'sale'],
            'store.staff-attendance.approve-gap'        => ['store_slug', 'id'],
            'store.staff-attendance.reject-gap'         => ['store_slug', 'id'],
            'store.staff-attendance.show'               => ['store_slug', 'id'],
            'store.stock-operations.warehouse.update'   => ['store_slug', 'id'],
            'store.inventory.update'                    => ['store_slug', 'id'],
            'store.inventory.destroy'                   => ['store_slug', 'id'],
            'store.e-invoicing.generate'                => ['store_slug'],
            'store.e-invoicing.waybill'                 => ['store_slug'],
            'store.v3.products.uom.index'               => ['store_slug', 'productId'],
            'store.v3.products.tiers.index'             => ['store_slug', 'productId'],
            'store.production.show'                     => ['store_slug', 'run'],
            'store.production.edit'                     => ['store_slug', 'run'],

            // ── Owner's Daily Pulse routes (added 2026-06-04) ──────────────────
            'store.reports.owner-daily-pulse'           => ['store_slug'],
            'store.reports.owner-daily-pulse.verify'    => ['store_slug'],
            'store.reports.owner-daily-pulse.setup'     => ['store_slug'],
            'store.reports.owner-daily-pulse.lock'      => ['store_slug'],
            'store.reports.owner-daily-pulse.note'      => ['store_slug'],

            // ── Recycle Bin routes (fixed 2026-06-04) ──────────────────────────
            'store.admin.recycle-bin.restore'           => ['store_slug', 'id'],
            'store.admin.recycle-bin.force-delete'      => ['store_slug', 'id'],

            // ── Backup routes (fixed 2026-06-04) ──────────────────────────────
            'store.backups.delete'                      => ['store_slug', 'filename'],
            'store.backups.download'                    => ['store_slug', 'filename'],
            'store.backups.email'                       => ['store_slug', 'filename'],

            // ── Debit Notes (fixed 2026-06-04) ────────────────────────────────
            'store.debit-notes.update'                  => ['store_slug', 'id'],
            'store.debit-notes.print'                   => ['store_slug', 'id'],

            // ── Customers search (fixed 2026-06-04) ───────────────────────────
            'store.customers.search'                    => ['store_slug'],

            // ── Regression Fixes (added 2026-06-06) ───────────────────────────
            'store.bank-accounts.transactions'          => ['store_slug', 'bankAccount'],
            'store.expenses.category.store'             => ['store_slug'],
            'store.parties.show'                        => ['store_slug', 'party'],
            'store.parties.ledger'                      => ['store_slug', 'party'],
        ];

        foreach ($expectedRoutes as $name => $expectedParams) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull($route, "Route '{$name}' is not registered.");
            
            $actualParams = $route->parameterNames();
            // Sort to prevent array order discrepancies from failing the test
            sort($expectedParams);
            sort($actualParams);
            
            $this->assertEquals(
                $expectedParams, 
                $actualParams, 
                "Route '{$name}' parameter mismatch. Expected [" . implode(', ', $expectedParams) . "], got [" . implode(', ', $actualParams) . "]."
            );
        }
    }
}
