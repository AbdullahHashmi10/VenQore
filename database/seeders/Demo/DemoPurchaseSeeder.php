<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DemoPurchaseSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command?->error("Tenant ID required for DemoPurchaseSeeder.");
            return;
        }

        $warehouse  = Warehouse::where('tenant_id', $tenantId)->first();
        $products   = Product::where('tenant_id', $tenantId)->get();
        $suppliers  = Party::where('tenant_id', $tenantId)->where('type', 'supplier')->get();
        $user       = User::where('email', 'demo-owner@venqore-demo.internal')->first();

        if (!$warehouse || $products->isEmpty() || $suppliers->isEmpty()) {
            $this->command?->warn("Skipping purchases — missing dependencies.");
            return;
        }

        if ($user) auth()->login($user);

        // ~2 purchases per week across 5 years
        $current = Carbon::parse('2020-01-01');
        $end     = now();
        $count   = 0;
        $invoiceNum = 1;

        // Calculate exact total steps
        $temp = $current->copy();
        $totalSteps = 0;
        while ($temp <= $end) {
            if (in_array($temp->dayOfWeek, [1, 4])) {
                $totalSteps++;
            }
            $temp->addDay();
        }

        $step = 0;
        $this->command?->info("Starting purchase history generation (~{$totalSteps} days to seed)...");

        while ($current <= $end) {
            // Skip to next "purchase day" (roughly Mon & Thu)
            if (!in_array($current->dayOfWeek, [1, 4])) {
                $current->addDay();
                continue;
            }

            // Occasionally skip a week (holidays, etc.)
            if (rand(0, 10) === 0) {
                $current->addDay();
                continue;
            }

            Carbon::setTestNow($current->copy()->setTime(10, rand(0, 3)));

            $supplier = $suppliers->random();
            $numItems = rand(1, 5);
            $subtotal = 0;
            $items    = [];

            for ($i = 0; $i < $numItems; $i++) {
                $prod    = $products->random();
                $qty     = rand(5, 50);
                $cost    = $prod->cost_price ?? ($prod->price * 0.75);
                $cost    = $cost * (1 + rand(-5, 10) / 100); // ±10% cost variance
                $lineTotal = $qty * $cost;
                $subtotal += $lineTotal;

                $items[] = [
                    'id'          => Str::uuid()->toString(),
                    'tenant_id'   => $tenantId,
                    'purchase_id' => null, // filled below
                    'product_id'  => $prod->id,
                    'qty'         => $qty,
                    'unit_cost'   => round($cost, 2),
                    'tax_rate'    => 0,
                    'business_pct'=> 100,
                    'line_total'  => round($lineTotal, 2),
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            }

            $paid = (rand(0, 3) > 0); // 75% paid

            $purchaseId = Str::uuid()->toString();
            DB::table('purchases')->insert([
                'id'             => $purchaseId,
                'tenant_id'      => $tenantId,
                'party_id'       => $supplier->id,
                'warehouse_id'   => $warehouse->id,
                'invoice_number' => 'PO-' . str_pad($invoiceNum++, 5, '0', STR_PAD_LEFT),
                'purchase_date'  => now()->toDateString(),
                'subtotal'       => round($subtotal, 2),
                'tax'            => 0,
                'total'          => round($subtotal, 2),
                'payment_status' => $paid ? 'paid' : 'unpaid',
                'payment_method' => $paid ? ['cash', 'bank', 'bank'][rand(0, 2)] : null,
                'user_id'        => $user?->id,
                'created_by'     => $user?->id,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            foreach ($items as &$item) {
                $item['purchase_id'] = $purchaseId;
                DB::table('purchase_items')->insert($item);
            }

            $count++;
            $step++;
            if ($step % 50 === 0 || $step === $totalSteps) {
                $percent = round(($step / $totalSteps) * 100);
                $left = $totalSteps - $step;
                $this->command?->info("  -> Seeding purchases: {$step}/{$totalSteps} days processed ({$percent}% done, {$left} remaining)");
            }
            $current->addDay();
        }

        Carbon::setTestNow(null);
        $this->command?->info("✅ ~{$count} purchase records seeded (2020–now).");
    }
}
