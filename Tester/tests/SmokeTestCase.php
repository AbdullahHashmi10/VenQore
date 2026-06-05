<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

/**
 * SmokeTestCase — Read-Only Production Test Base
 *
 * Intentionally does NOT use RefreshDatabase.
 * Smoke tests are read-only health checks that run against the live
 * MySQL database after a deployment. They must NEVER wipe or migrate.
 *
 * DB resolution order (highest priority first):
 *  1. SMOKE_DB_DATABASE env var (set this on the live server to 'venqore_pos')
 *  2. DB_DATABASE from phpunit.xml / .env.testing (e.g. 'amd_pos_test' locally)
 *  3. Whatever is already configured — no forced override
 */
abstract class SmokeTestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Allow an explicit override for live-server runs via env var.
        // Locally, DB_DATABASE from phpunit.xml ('amd_pos_test') is used as-is.
        $smokeDb = env('SMOKE_DB_DATABASE');
        if ($smokeDb) {
            config(['database.connections.mysql.database' => $smokeDb]);
            DB::purge('mysql');
            DB::reconnect('mysql');
        }

        // Bind a fake tenant context so middleware doesn't crash on routes
        // that require a bound tenant (e.g. /s/{slug}/... routes).
        if (!app()->bound('current.tenant')) {
            $fakeTenant = new \stdClass();
            $fakeTenant->id = null;
            $fakeTenant->slug = 'smoke-test';
            $fakeTenant->currency_symbol = 'Rs';
            $fakeTenant->is_demo = false;
            app()->instance('current.tenant', $fakeTenant);
        }
    }

    protected function tearDown(): void
    {
        if (app()->bound('current.tenant')) {
            app()->forgetInstance('current.tenant');
        }
        if (app()->bound('current.membership')) {
            app()->forgetInstance('current.membership');
        }

        parent::tearDown();
    }
}

