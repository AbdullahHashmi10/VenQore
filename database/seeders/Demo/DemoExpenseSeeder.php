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
            $this->command->error("Tenant ID required for DemoExpenseSeeder.");
            return;
        }

        $categories = [
            'Rent' => 2200,
            'Utilities' => 380,
            'Internet & Communication' => 95,
            'Staff Salaries' => 6500,
            'Marketing & Ads' => 800
        ];

        $expenseCatModels = [];
        foreach ($categories as $name => $defaultAmount) {
            $expenseCatModels[$name] = ExpenseCategory::updateOrCreate(
                ['tenant_id' => $tenantId, 'name' => $name],
                ['id' => Str::uuid()->toString()]
            );
        }

        $startDate = Carbon::parse('2015-01-01');
        $endDate = Carbon::parse('2019-12-31');

        $currentDate = clone $startDate;

        // Add monthly recurring expenses across the 5 years
        while ($currentDate <= $endDate) {
            $simulatedTime = clone $currentDate; 
            $simulatedTime->day = 1; // 1st of the month
            
            Carbon::setTestNow($simulatedTime);

            foreach ($categories as $name => $amount) {
                // Fluctuate the amount slightly for realism
                $fluctuation = rand(-5, 5) / 100;
                $finalAmount = $amount + ($amount * $fluctuation);

                Expense::create([
                    'tenant_id' => $tenantId,
                    'expense_category_id' => $expenseCatModels[$name]->id,
                    'amount' => $finalAmount,
                    'date' => $simulatedTime->toDateString(),
                    'description' => "Monthly $name for " . $simulatedTime->format('F Y')
                ]);
            }
            
            $currentDate->addMonth();
        }

        Carbon::setTestNow();
        $this->command->info("✓ Recurring monthly expenses seeded for 5 years.");
    }
}
