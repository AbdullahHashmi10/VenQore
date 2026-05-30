<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\User;
use App\Services\V3\SaleService;
use Carbon\Carbon;

class DemoSalesSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command?->error("Tenant ID required for DemoSalesSeeder.");
            return;
        }

        $warehouse = Warehouse::where('tenant_id', $tenantId)->first();
        $products  = Product::where('tenant_id', $tenantId)->get();
        $customers = Party::where('tenant_id', $tenantId)->where('type', 'customer')->get();

        if (!$warehouse || $products->isEmpty() || $customers->isEmpty()) {
            $this->command?->error("Required base data missing for DemoSalesSeeder.");
            return;
        }

        $saleService = app(SaleService::class);

        // Authenticate as the demo owner for the service
        $user = User::where('email', 'owner@venqore-demo.internal')->first()
            ?? User::where('email', 'demo-owner@venqore-demo.internal')->first()
            ?? User::where('email', 'master@venqore.com')->first()
            ?? User::first();
        if ($user) auth()->login($user);

        // S-curve growth: 2020 → 2026
        $years = [
            2020 => 200,
            2021 => 320,
            2022 => 460,
            2023 => 580,
            2024 => 650,
            2025 => 750,
            2026 => 350, // current partial year up to today
        ];

        $totalYears = count($years);
        $yearsCompleted = 0;
        $this->command?->info("Starting {$totalYears}-year sales history (2020–2026)...");

        foreach ($years as $year => $targetSales) {
            // For current year, only seed up to today
            $yearStart = Carbon::parse("$year-01-01");
            $yearEnd   = $year === now()->year
                ? now()
                : Carbon::parse("$year-12-31 23:59:59");

            $daysInRange   = $yearStart->diffInDays($yearEnd) + 1;
            $salesPerDay   = $targetSales / max($daysInRange, 1);
            $currentDate   = $yearStart->copy()->setTime(9, 0);
            $salesCompleted = 0;

            while ($currentDate <= $yearEnd) {
                $dailyTarget = $salesPerDay;

                // Weekend boost
                if ($currentDate->isWeekend()) $dailyTarget *= 1.4;
                // Month-end boost
                if ($currentDate->day >= 25)    $dailyTarget *= 1.2;
                // December seasonal boost
                if ($currentDate->month === 12) $dailyTarget *= 1.6;
                // Eid / major sale event (May, July spike)
                if (in_array($currentDate->month, [5, 7])) $dailyTarget *= 1.3;

                $count = (int) floor($dailyTarget)
                    + ((rand(0, 100) / 100 <= ($dailyTarget - floor($dailyTarget))) ? 1 : 0);

                for ($s = 0; $s < $count; $s++) {
                    $simulatedTime = $currentDate->copy()->addMinutes(rand(30, 540));
                    Carbon::setTestNow($simulatedTime);

                    $customer  = $customers->random();
                    $numItems  = rand(1, 4);
                    $itemsData = [];
                    $total     = 0;

                    for ($i = 0; $i < $numItems; $i++) {
                        $prod = $products->random();
                        $qty  = rand(1, 3);
                        $disc = [0, 0, 0, 5, 10][rand(0, 4)]; // occasional discount
                        $itemsData[] = [
                            'product_id'       => $prod->id,
                            'qty'              => $qty,
                            'unit_price'       => $prod->price,
                            'discount_percent' => $disc,
                            'tax_rate'         => 0,
                            'sale_uom'         => 'PCS',
                        ];
                        $total += $prod->price * $qty * (1 - $disc / 100);
                    }

                    // Mix of payment methods
                    $method = ['cash', 'cash', 'cash', 'credit', 'bank'][rand(0, 4)];

                    try {
                        $saleService->post([
                            'customer_id'    => $customer->id,
                            'warehouse_id'   => $warehouse->id,
                            'sale_date'      => $simulatedTime->toDateString(),
                            'payment_method' => $method,
                            'amount_received'=> $method === 'credit' ? 0 : $total,
                            'tenant_id'      => $tenantId,
                            'items'          => $itemsData,
                        ]);
                        $salesCompleted++;
                    } catch (\Exception $e) {
                        $this->command?->error("  ⚠️ Sale failed: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
                    }
                }

                $currentDate->addDay();
            }

            $yearsCompleted++;
            $yearsLeft = $totalYears - $yearsCompleted;
            $this->command?->info("  ✅ Year $year: ~{$salesCompleted} sales seeded. ({$yearsLeft} years remaining)");
        }

        // Always add fresh sales TODAY so dashboard widgets show non-zero
        Carbon::setTestNow(null);
        $today = now();
        for ($s = 0; $s < 6; $s++) {
            Carbon::setTestNow($today->copy()->subMinutes(rand(5, 180)));
            $customer = $customers->random();
            $prod     = $products->random();
            try {
                $saleService->post([
                    'customer_id'    => $customer->id,
                    'warehouse_id'   => $warehouse->id,
                    'sale_date'      => now()->toDateString(),
                    'payment_method' => 'cash',
                    'amount_received'=> $prod->price,
                    'tenant_id'      => $tenantId,
                    'items'          => [['product_id' => $prod->id, 'qty' => 1, 'unit_price' => $prod->price, 'discount_percent' => 0, 'tax_rate' => 0, 'sale_uom' => 'PCS']],
                ]);
            } catch (\Exception $e) {}
        }

        Carbon::setTestNow(null);
        $this->command?->info("✅ Sales seeding complete.");
    }
}
