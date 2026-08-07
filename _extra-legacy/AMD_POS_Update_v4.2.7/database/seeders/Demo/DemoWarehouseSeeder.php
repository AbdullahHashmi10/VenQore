<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use Illuminate\Support\Str;

class DemoWarehouseSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command->error("Tenant ID required for DemoWarehouseSeeder.");
            return;
        }

        Warehouse::updateOrCreate(
            ['tenant_id' => $tenantId, 'name' => 'Main Showroom'],
            [
                'id' => Str::uuid()->toString(),
                'location' => 'Los Angeles, CA',
            ]
        );

        $this->command->info("✓ Warehouse seeded for Golden Master.");
    }
}
