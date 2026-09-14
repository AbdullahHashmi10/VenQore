<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default warehouses if no warehouses exist
        if (Warehouse::count() === 0) {
            Warehouse::create([
                'name' => 'Main Warehouse',
                'location' => 'Main Location',
                'is_active' => true,
            ]);

            Warehouse::create([
                'name' => 'Secondary Warehouse',
                'location' => 'Secondary Location',
                'is_active' => true,
            ]);

            Warehouse::create([
                'name' => 'Storage',
                'location' => 'Storage Area',
                'is_active' => true,
            ]);
        }
    }
}
