<?php

namespace Database\Factories;

use App\Models\InventoryBatch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<InventoryBatch>
 */
class InventoryBatchFactory extends Factory
{
    protected $model = InventoryBatch::class;

    public function definition(): array
    {
        $qty = $this->faker->numberBetween(10, 100);

        return [
            'id'            => (string) Str::orderedUuid(),
            'tenant_id'     => null,
            'product_id'    => null, // must be set by caller
            'warehouse_id'  => null, // must be set by caller
            'original_qty'  => $qty,
            'remaining_qty' => $qty,
            'unit_cost'     => $this->faker->randomFloat(2, 10, 500),
            'notes'         => 'Test purchase batch',
        ];
    }

    public function depleted(): static
    {
        return $this->state(['remaining_qty' => 0]);
    }

    public function partial(int $remaining): static
    {
        return $this->state(['remaining_qty' => $remaining]);
    }
}
