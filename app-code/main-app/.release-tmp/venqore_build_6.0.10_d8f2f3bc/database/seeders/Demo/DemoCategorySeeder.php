<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class DemoCategorySeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command->error("Tenant ID required for DemoCategorySeeder.");
            return;
        }

        $categories = [
            'Smartphones' => 'Mobile phones and accessories',
            'Laptops' => 'Portable computers and ultrabooks',
            'Audio' => 'Headphones, earphones, and speakers',
            'Accessories' => 'Cables, chargers, and cases',
            'Networking' => 'Routers, unmanaged and managed switches',
            'Storage' => 'SSDs, HDDs, and flash drives',
            'Displays' => 'Monitors and display panels',
            'Peripherals' => 'Keyboards, mice, and desk mats',
        ];

        foreach ($categories as $name => $desc) {
            Category::firstOrCreate([
                'tenant_id' => $tenantId,
                'name' => $name,
            ], [
                'id' => Str::uuid()->toString(),
            ]);
        }

        $this->command->info("✓ 8 Categories seeded for Golden Master.");
    }
}
