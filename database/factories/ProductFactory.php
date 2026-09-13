<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'tenant_id'       => null, // set via HasTenant or explicitly
            'name'            => $this->faker->words(3, true),
            'sku'             => strtoupper(Str::random(8)),
            'description'     => $this->faker->sentence(),
            'cost_price'      => $this->faker->randomFloat(2, 10, 500),
            'price'           => $this->faker->randomFloat(2, 20, 1000),
            'stock_quantity'  => $this->faker->numberBetween(0, 200),
            'quantity'        => 0,
            'min_stock_alert' => 5,
            'alert_quantity'  => 5,
            'tax_rate'        => 0,
            'is_active'       => true,
            'type'            => 'standard',
            'unit'            => 'pcs',
            'base_unit'       => 'pcs',
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(['stock_quantity' => 0]);
    }

    public function withTax(float $rate = 0.17): static
    {
        return $this->state(['tax_rate' => $rate]);
    }

    public function lowStock(): static
    {
        return $this->state(['stock_quantity' => 2, 'min_stock_alert' => 10]);
    }
}
