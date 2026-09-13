<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Electronics',
                'base_unit' => 'pcs',
                'secondary_unit' => null,
                'conversion_rate' => null
            ],
            [
                'name' => 'Groceries',
                'base_unit' => 'pcs',
                'secondary_unit' => 'box',
                'conversion_rate' => 12
            ],
            [
                'name' => 'Fresh Produce',
                'base_unit' => 'kg',
                'secondary_unit' => 'crate',
                'conversion_rate' => 20
            ],
            [
                'name' => 'Apparel & Fashion',
                'base_unit' => 'pcs',
                'secondary_unit' => null,
                'conversion_rate' => null
            ],
            [
                'name' => 'Home & Kitchen',
                'base_unit' => 'pcs',
                'secondary_unit' => 'set',
                'conversion_rate' => 1
            ],
            [
                'name' => 'Beverages',
                'base_unit' => 'pcs',
                'secondary_unit' => 'crate',
                'conversion_rate' => 24
            ],
            [
                'name' => 'Health & Beauty',
                'base_unit' => 'pcs',
                'secondary_unit' => 'box',
                'conversion_rate' => 10
            ],
            [
                'name' => 'Toys & Games',
                'base_unit' => 'pcs',
                'secondary_unit' => 'carton',
                'conversion_rate' => 6
            ],
            [
                'name' => 'Automotive',
                'base_unit' => 'pcs',
                'secondary_unit' => null,
                'conversion_rate' => null
            ],
            [
                'name' => 'Office Supplies',
                'base_unit' => 'pcs',
                'secondary_unit' => 'pack',
                'conversion_rate' => 10
            ]
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['name' => $cat['name']],
                [
                    'base_unit' => $cat['base_unit'],
                    'secondary_unit' => $cat['secondary_unit'],
                    'conversion_rate' => $cat['conversion_rate']
                ]
            );
        }
    }
}
