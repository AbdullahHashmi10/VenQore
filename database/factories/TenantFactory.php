<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = $this->faker->company();

        return [
            'name'             => $name,
            'slug'             => Str::slug($name) . '-' . Str::random(4),
            'plan'             => 'trial',
            'status'           => 'trial',
            'trial_ends_at'    => now()->addDays(14),
            'currency_code'    => 'PKR',
            'currency_symbol'  => 'Rs.',
            'timezone'         => 'Asia/Karachi',
            'industry'         => 'retail',
            'setup_completed'  => true,   // default: skip setup wizard in tests
            'join_code'        => 'VQ-' . strtoupper(Str::random(4)),
            'feature_variants'      => false,
            'feature_serials'       => false,
            'feature_batches'       => false,
            'feature_manufacturing' => false,
        ];
    }

    /** Active subscription store */
    public function active(): static
    {
        return $this->state(['status' => 'active', 'trial_ends_at' => null]);
    }

    /** Suspended store */
    public function suspended(): static
    {
        return $this->state(['status' => 'suspended']);
    }

    /** Trial with an expired trial date */
    public function trialExpired(): static
    {
        return $this->state([
            'status'        => 'trial',
            'trial_ends_at' => now()->subDay(),
        ]);
    }

    /** LTD Tier 1 plan */
    public function ltd1(): static
    {
        return $this->state([
            'plan'        => 'ltd_1',
            'status'      => 'active',
            'trial_ends_at' => null,
        ]);
    }

    /** LTD Tier 2 plan */
    public function ltd2(): static
    {
        return $this->state([
            'plan'        => 'ltd_2',
            'status'      => 'active',
            'trial_ends_at' => null,
        ]);
    }

    /** LTD Tier 3 plan */
    public function ltd3(): static
    {
        return $this->state([
            'plan'        => 'ltd_3',
            'status'      => 'active',
            'trial_ends_at' => null,
        ]);
    }

    /** Setup not yet completed (triggers setup wizard redirect) */
    public function notSetup(): static
    {
        return $this->state(['setup_completed' => false]);
    }
}
