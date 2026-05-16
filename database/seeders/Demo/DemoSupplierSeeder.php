<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Party;
use Illuminate\Support\Str;

class DemoSupplierSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command->error("Tenant ID required for DemoSupplierSeeder.");
            return;
        }

        $suppliers = [
            'Global Electronics Distribution',
            'Apple Inc Wholesale',
            'Samsung Authorized Supply',
            'Logitech Corp Direct',
            'Tech Accessories Co.',
            'Peripheral Master Ltd',
            'Display Dynamics Inc',
            'Audio Technix Supplies',
            'Fast Storage Vendors',
            'Networking Giants Depot'
        ];

        foreach ($suppliers as $name) {
            Party::firstOrCreate([
                'tenant_id' => $tenantId,
                'name' => $name,
            ], [
                'id' => Str::uuid()->toString(),
                'type' => 'supplier',
                'email' => 'sales@' . strtolower(str_replace([' ', '.'], ['', ''], $name)) . '.com',
                'phone' => '800-' . str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                'opening_balance' => (rand(1, 4) === 1) ? rand(1000, 5000) : 0, 
                'opening_balance_type' => 'payable'
            ]);
        }

        $this->command->info("✓ 10 Suppliers seeded for Golden Master.");
    }
}
