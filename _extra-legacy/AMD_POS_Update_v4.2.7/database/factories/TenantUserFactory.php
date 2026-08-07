<?php

namespace Database\Factories;

use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TenantUser>
 */
class TenantUserFactory extends Factory
{
    protected $model = TenantUser::class;

    public function definition(): array
    {
        return [
            'tenant_id'    => null, // must be set by caller
            'user_id'      => null, // must be set by caller
            'role'         => 'cashier',
            'status'       => 'active',
            'display_name' => $this->faker->name(),
            'joined_at'    => now(),
        ];
    }

    public function owner(): static
    {
        return $this->state(['role' => 'owner']);
    }

    public function manager(): static
    {
        return $this->state(['role' => 'manager']);
    }

    public function cashier(): static
    {
        return $this->state(['role' => 'cashier']);
    }

    public function viewer(): static
    {
        return $this->state(['role' => 'viewer']);
    }

    public function admin(): static
    {
        return $this->state(['role' => 'admin']);
    }

    public function suspended(): static
    {
        return $this->state(['status' => 'suspended']);
    }
}
