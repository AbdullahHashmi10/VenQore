<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DemoExpenseSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command?->error("Tenant ID required for DemoExpenseSeeder.");
            return;
        }

        // Recurring monthly expenses with realistic amounts
        $recurring = [
            'Rent'                   => 2200,
            'Utilities'              => 380,
            'Internet & Comm'        => 95,
            'Staff Salaries'         => 8500,
            'Marketing & Ads'        => 600,
            'Office Supplies'        => 150,
            'Vehicle & Fuel'         => 280,
            'Insurance'              => 320,
        ];

        // One-off / irregular expenses (seeded randomly each quarter)
        $irregular = [
            'Equipment Repair'   => [300, 900],
            'Software License'   => [200, 600],
            'Staff Training'     => [400, 1200],
            'Packaging Materials'=> [150, 450],
        ];

        // Create categories
        $catModels = [];
        $allCats   = array_merge(array_keys($recurring), array_keys($irregular));
        foreach ($allCats as $name) {
            $catModels[$name] = ExpenseCategory::updateOrCreate(
                ['tenant_id' => $tenantId, 'name' => $name],
                ['id' => Str::uuid()->toString()]
            );
        }

        // Seed from 2020 to now, month by month
        $current = Carbon::parse('2020-01-01');
        $end     = now()->endOfMonth();

        while ($current <= $end) {
            Carbon::setTestNow($current->copy()->day(1));

            foreach ($recurring as $name => $baseAmount) {
                // Natural fluctuation ±8%
                $amount = $baseAmount * (1 + (rand(-8, 8) / 100));
                // Salaries grow 5% per year
                $yearOffset = $current->year - 2020;
                if ($name === 'Staff Salaries') {
                    $amount *= pow(1.05, $yearOffset);
                }

                Expense::create([
                    'tenant_id'          => $tenantId,
                    'expense_category_id'=> $catModels[$name]->id,
                    'category'           => $name,
                    'amount'             => round($amount, 2),
                    'date'               => $current->toDateString(),
                    'description'        => "Monthly $name — " . $current->format('M Y'),
                ]);
            }

            // Add an irregular expense every quarter (roughly)
            if ($current->month % 3 === 0 && rand(0, 1)) {
                $name   = array_keys($irregular)[rand(0, count($irregular) - 1)];
                $range  = $irregular[$name];
                $amount = rand($range[0], $range[1]);
                Expense::create([
                    'tenant_id'          => $tenantId,
                    'expense_category_id'=> $catModels[$name]->id,
                    'category'           => $name,
                    'amount'             => $amount,
                    'date'               => $current->copy()->addDays(rand(5, 25))->toDateString(),
                    'description'        => $name . ' — Q' . $current->quarter . ' ' . $current->year,
                ]);
            }

            $current->addMonth();
        }

        Carbon::setTestNow(null);
        $this->command?->info("✅ 5-year recurring & irregular expenses seeded.");
    }
}
