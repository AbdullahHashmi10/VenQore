<?php

namespace Database\Factories;

use App\Models\Party;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Party>
 */
class PartyFactory extends Factory
{
    protected $model = Party::class;

    public function definition(): array
    {
        return [
            'tenant_id'      => null, // set via HasTenant or explicitly
            'name'           => $this->faker->company(),
            'type'           => 'customer',
            'phone'          => $this->faker->phoneNumber(),
            'email'          => $this->faker->safeEmail(),
            'address'        => $this->faker->address(),
            'credit_limit'   => 0,
            'opening_balance' => 0,
            'is_active'      => true,
        ];
    }

    public function customer(): static
    {
        return $this->state(['type' => 'customer']);
    }

    public function supplier(): static
    {
        return $this->state(['type' => 'supplier']);
    }

    public function withCreditLimit(float $limit): static
    {
        return $this->state(['credit_limit' => $limit]);
    }

    public function withOpeningBalance(float $balance): static
    {
        return $this->state(['opening_balance' => $balance]);
    }

    public function wholesale(): static
    {
        return $this->state(['is_wholesale' => true]);
    }
}
