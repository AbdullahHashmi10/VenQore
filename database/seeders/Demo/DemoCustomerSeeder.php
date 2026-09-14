<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Party;
use Illuminate\Support\Str;

class DemoCustomerSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command->error("Tenant ID required for DemoCustomerSeeder.");
            return;
        }

        // Generate 70 registered customers + 30 "Walk-in" generic customers
        $firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'William', 'Emily', 'David', 'Jessica', 'James', 'Ashley', 'Robert', 'Amanda', 'Johnathan', 'Elizabeth', 'Charles', 'Megan', 'Thomas', 'Melissa'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];

        $count = 1;

        // 1. Registered Customers
        for ($i = 0; $i < 70; $i++) {
            $fName = $firstNames[array_rand($firstNames)];
            $lName = $lastNames[array_rand($lastNames)];
            $name = "$fName $lName";
            
            Party::firstOrCreate([
                'tenant_id' => $tenantId,
                'name' => $name,
            ], [
                'id' => Str::uuid()->toString(),
                'type' => 'customer',
                'email' => strtolower($fName) . '.' . strtolower($lName) . rand(10, 99) . '@example.com',
                'phone' => '555-' . str_pad((string)rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                'opening_balance' => ($i % 10 === 0) ? rand(50, 500) : 0,
                'opening_balance_type' => 'receivable'
            ]);
            $count++;
        }

        // 2. Generic Walk-ins
        for ($i = 1; $i <= 30; $i++) {
            Party::firstOrCreate([
                'tenant_id' => $tenantId,
                'name' => 'Walk-In Customer ' . $i,
            ], [
                'id' => Str::uuid()->toString(),
                'type' => 'customer',
                'opening_balance' => 0,
                'opening_balance_type' => 'receivable'
            ]);
            $count++;
        }

        $this->command->info("✓ 100 Customers seeded for Golden Master.");
    }
}
