<?php

namespace Database\Factories;

use App\Models\StoreLicense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StoreLicense>
 */
class StoreLicenseFactory extends Factory
{
    protected $model = StoreLicense::class;

    public function definition(): array
    {
        return [
            'user_id'     => null, // must be set by caller
            'tenant_id'   => null,
            'type'        => 'appsumo',
            'plan'        => 'ltd_1',
            'source'      => 'appsumo',
            'status'      => 'available',
            'valid_until' => now()->addYears(10),
        ];
    }

    public function consumed(): static
    {
        return $this->state(['status' => 'consumed', 'consumed_at' => now()]);
    }

    public function ltd1(): static
    {
        return $this->state(['plan' => 'ltd_1']);
    }

    public function ltd2(): static
    {
        return $this->state(['plan' => 'ltd_2']);
    }

    public function ltd3(): static
    {
        return $this->state(['plan' => 'ltd_3']);
    }

    public function trial(): static
    {
        return $this->state(['type' => 'trial', 'source' => 'registration', 'plan' => 'starter']);
    }
}
