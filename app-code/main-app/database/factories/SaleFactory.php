<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    protected $model = Sale::class;

    public function definition(): array
    {
        return [
            'tenant_id'        => null,
            'reference_number' => 'INV-' . strtoupper(Str::random(10)),
            'customer_id'      => null,
            'user_id'          => User::factory(),
            'warehouse_id'     => null,
            'subtotal'         => 100.00,
            'tax'              => 0.00,
            'discount'         => 0.00,
            'total'            => 100.00,
            'status'           => 'posted', // posted, draft, returned, cancelled
            'payment_status'   => 'paid',
            'payment_method'   => 'cash',
            'notes'            => $this->faker->sentence(),
            
            // Waterfall columns
            'subtotal_gross'       => 100.00,
            'total_item_discounts' => 0.00,
            'global_discount'      => 0.00,
            'net_sales'            => 100.00,
            'total_tax'            => 0.00,
            'shipping_charges'     => 0.00,
            'invoice_total'        => 100.00,
            'posted_at'            => now(),
        ];
    }
}
