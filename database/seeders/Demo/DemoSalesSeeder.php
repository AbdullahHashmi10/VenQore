<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\User;
use App\Models\TenantUser;
use App\Services\V3\SaleService;
use Carbon\Carbon;
use Illuminate\Support\Str;

class DemoSalesSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command->error("Tenant ID required for DemoSalesSeeder.");
            return;
        }

        $warehouse = Warehouse::where('tenant_id', $tenantId)->first();
        $products = Product::where('tenant_id', $tenantId)->get();
        $customers = Party::where('tenant_id', $tenantId)->where('type', 'customer')->get();

        if (!$warehouse || $products->isEmpty() || $customers->isEmpty()) {
            $this->command->error("Required base data missing for DemoSalesSeeder.");
            return;
        }

        $saleService = app(SaleService::class);
        $startDate = Carbon::parse('2015-01-01');
        $endDate = Carbon::parse('2019-12-31');
        
        $years = [
            2015 => 40,
            2016 => 70,
            2017 => 95,
            2018 => 130,
            2019 => 165
        ];

        // Ensure user auth for sale service if it relies on auth()->id()
        $user = User::firstOrCreate(['email' => 'master@venqore.com'], [
            'name' => 'Demo Admin',
            'password' => bcrypt('password'),
        ]);
        auth()->login($user);

        $this->command->info("Starting simulated time traversal from 2015 to 2019...");

        // We will loop day by day, distributing the annual targets
        foreach ($years as $year => $targetSales) {
            $daysInYear = Carbon::parse("$year-01-01")->daysInYear;
            $salesPerDayBase = $targetSales / $daysInYear;

            $currentDate = Carbon::parse("$year-01-01 09:00:00");
            $endOfYear = Carbon::parse("$year-12-31 23:59:59");

            $salesCompleted = 0;

            while ($currentDate <= $endOfYear) {
                // Determine how many sales today
                $dailySalesTarget = $salesPerDayBase;

                // Weekends add 40%
                if ($currentDate->isWeekend()) {
                    $dailySalesTarget *= 1.4;
                }

                // Month end adds 20%
                if ($currentDate->day >= 25) {
                    $dailySalesTarget *= 1.2;
                }

                // December adds 60%
                if ($currentDate->month === 12) {
                    $dailySalesTarget *= 1.6;
                }

                // Convert to whole numbers using probability for remainder
                $baseInt = floor($dailySalesTarget);
                $remainder = $dailySalesTarget - $baseInt;
                $actualSalesToday = $baseInt + ((rand(0, 100) / 100 <= $remainder) ? 1 : 0);

                for ($s = 0; $s < $actualSalesToday; $s++) {
                    // Set test time to fake exactly when it happened
                    $simulatedTime = tap(clone $currentDate)->addMinutes(rand(1, 500));
                    Carbon::setTestNow($simulatedTime);

                    // Pick random customer
                    $customer = $customers->random();

                    // Pick 1-4 random products
                    $numItems = rand(1, 4);
                    $itemsData = [];
                    $totalAmount = 0;

                    for ($i = 0; $i < $numItems; $i++) {
                        $prod = $products->random();
                        $qty = rand(1, 2);
                        
                        $itemsData[] = [
                            'product_id' => $prod->id,
                            'qty' => $qty,
                            'unit_price' => $prod->price,
                            'discount_percent' => 0,
                            'tax_rate' => 0,
                            'sale_uom' => 'PCS'
                        ];
                        $totalAmount += ($prod->price * $qty);
                    }

                    $saleData = [
                        'customer_id' => $customer->id,
                        'warehouse_id' => $warehouse->id,
                        'sale_date' => $simulatedTime->toDateString(),
                        'payment_method' => 'cash',
                        'amount_received' => $totalAmount,
                        'tenant_id' => $tenantId,
                        'items' => $itemsData
                    ];

                    try {
                        $saleService->post($saleData);
                        $salesCompleted++;
                    } catch (\Exception $e) {
                        // Log all errors for debugging
                        $this->command->info("Sale Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
                    }
                }

                $currentDate->addDay();
            }

            $this->command->info("✓ Year $year populated with ~{$salesCompleted} sales.");
            $targetSalesTotal = $salesCompleted;
        }

        // Add 4-6 sales "today" just before DEMO_EPOCH (2020-01-01)
        Carbon::setTestNow(Carbon::parse('2019-12-31 23:00:00'));
        for ($s = 0; $s < 5; $s++) {
             // Generate standard sale
             $customer = $customers->random();
             $prod = $products->random();
             $totalAmount = $prod->price * 1;
             
             $saleData = [
                 'customer_id' => $customer->id,
                 'warehouse_id' => $warehouse->id,
                 'sale_date' => now()->toDateString(),
                 'payment_method' => 'cash',
                 'amount_received' => $totalAmount,
                 'tenant_id' => $tenantId,
                 'items' => [
                     [
                         'product_id' => $prod->id,
                         'qty' => 1,
                         'unit_price' => $prod->price,
                         'discount_percent' => 0,
                         'tax_rate' => 0,
                         'sale_uom' => 'PCS'
                     ]
                 ]
             ];
             try { $saleService->post($saleData); } catch (\Exception $e) {}
        }
        
        Carbon::setTestNow(); // Reset time to real reality
        $this->command->info("✓ 500+ Algorithmic sales fully seeded.");
    }
}
