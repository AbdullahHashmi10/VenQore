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
        $currentDbUser = config('database.connections.mysql.username');

        // On the live server, we want to use the live database configured in the environment config.
        // We detect the live server if the database username is not 'root' and the database name in config is different from the default test database 'amd_pos_test'.
        if ($smokeDb && ($currentDbUser === 'root' || $smokeDb !== 'amd_pos_test')) {
            config(['database.connections.mysql.database' => $smokeDb]);
            DB::purge('mysql');
            DB::reconnect('mysql');
        }

        // Bind a fake tenant context so middleware doesn't crash on routes
        // that require a bound tenant (e.g. /s/{slug}/... routes).
        if (!app()->bound('current.tenant')) {
            $fakeTenant = new class extends \App\Models\Tenant {
                public function __construct(array $attributes = [])
                {
                    parent::__construct();
                    $this->forceFill(array_merge([
                        'id' => null,
                        'name' => 'Smoke Store',
                        'slug' => 'smoke-test',
                        'plan' => 'ltd',
                        'status' => 'active',
                        'currency_symbol' => 'Rs',
                        'currency_code' => 'PKR',
                        'timezone' => 'UTC',
                        'trial_ends_at' => null,
                        'subscription_ends_at' => null,
                        'setup_completed' => true,
                        'onboarding_step' => 1,
                        'logo_url' => null,
                        'logo_style' => null,
                        'is_demo' => false,
                        'plan_limits' => [],
                        'limit_grace_ends_at' => null,
                        'view_only_since' => null,
                        'feature_variants' => false,
                        'feature_serials' => false,
                        'feature_batches' => false,
                        'feature_manufacturing' => false,
                    ], $attributes));
                    $this->exists = true;
                }

                public function getLimit(string $key): mixed
                {
                    return $this->plan_limits[$key] ?? null;
                }
            };
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

