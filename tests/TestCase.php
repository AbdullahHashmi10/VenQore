<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $fakeTenant = new class extends \App\Models\Tenant {
            public function __construct(array $attributes = [])
            {
                parent::__construct();
                $this->forceFill(array_merge([
                    'id' => null,
                    'name' => 'Test Store',
                    'slug' => 'test-store',
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
