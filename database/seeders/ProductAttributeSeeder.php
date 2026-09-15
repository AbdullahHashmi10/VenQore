<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductAttribute;

class ProductAttributeSeeder extends Seeder
{
    public function run(): void
    {
        $attributes = [
            [
                'name' => 'Color',
                'type' => 'select',
                'options' => ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Grey'],
                'sort_order' => 1,
            ],
            [
                'name' => 'Size',
                'type' => 'select',
                'options' => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
                'sort_order' => 2,
            ],
            [
                'name' => 'Material',
                'type' => 'select',
                'options' => ['Cotton', 'Polyester', 'Silk', 'Wool', 'Nylon', 'Leather', 'Denim', 'Linen'],
                'sort_order' => 3,
            ],
            [
                'name' => 'Style',
                'type' => 'select',
                'options' => ['Casual', 'Formal', 'Sport', 'Classic', 'Modern', 'Vintage'],
                'sort_order' => 4,
            ],
            [
                'name' => 'Flavor',
                'type' => 'select',
                'options' => ['Vanilla', 'Chocolate', 'Strawberry', 'Mint', 'Caramel', 'Coffee', 'Lemon'],
                'sort_order' => 5,
            ],
            [
                'name' => 'Weight',
                'type' => 'text',
                'options' => null,
                'sort_order' => 6,
            ],
        ];

        foreach ($attributes as $attribute) {
            ProductAttribute::create($attribute);
        }
    }
}
