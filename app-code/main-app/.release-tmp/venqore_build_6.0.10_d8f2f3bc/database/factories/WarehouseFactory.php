<?php

namespace Database\Factories;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Warehouse>
 */
class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition(): array
    {
        return [
            'tenant_id'  => null, // set via HasTenant or explicitly
            'name'       => $this->faker->city() . ' Warehouse',
            'location'   => $this->faker->address(),
            'is_default' => false,
        ];
    }

    public function default(): static
    {
        return $this->state(['name' => 'Main Warehouse', 'is_default' => true]);
    }
}
