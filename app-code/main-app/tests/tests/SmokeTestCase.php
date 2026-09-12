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
 * DB resolution order (highest priority first), applied to the DEFAULT
 * connection (config('database.default')):
 *  1. SMOKE_DB_DATABASE env var, when set to something other than the
 *     phpunit.xml placeholder 'amd_pos_test' (live server: 'venqore_pos')
 *  2. DB_DATABASE (per-run value from the environment, else phpunit.xml)
 *  3. Whatever is already configured — no forced override
 */
abstract class SmokeTestCase extends BaseTestCase
{
    /** phpunit.xml's local SMOKE_DB_DATABASE placeholder — never an override. */
    private const LOCAL_PLACEHOLDER_DB = 'amd_pos_test';

    protected function setUp(): void
    {
        parent::setUp();

        // Allow an explicit override for live-server runs via env var.
        //
        // The override must target the connection the app ACTUALLY uses
        // (config('database.default') — 'mariadb' under phpunit.xml). It used
        // to hard-code the 'mysql' connection, so it silently did nothing.
        //
        // It must also never redirect a local/CI run away from its per-run
        // DB_DATABASE (that is how parallel runs stay isolated). phpunit.xml
        // ships SMOKE_DB_DATABASE with the local placeholder 'amd_pos_test';
        // that placeholder is therefore treated as "no override". Only a
        // deliberately different value (e.g. 'venqore_pos' on the live
        // server) switches the database.
        $connection = config('database.default');
        $smokeDb    = env('SMOKE_DB_DATABASE');
        $currentDb  = config("database.connections.{$connection}.database");

        if ($smokeDb
            && $smokeDb !== self::LOCAL_PLACEHOLDER_DB
            && $smokeDb !== $currentDb
        ) {
            config(["database.connections.{$connection}.database" => $smokeDb]);
            DB::purge($connection);
            DB::reconnect($connection);
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

