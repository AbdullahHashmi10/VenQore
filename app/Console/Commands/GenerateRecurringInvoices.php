<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\RecurringInvoice;
use App\Services\V3\SaleService;
use Carbon\Carbon;

class GenerateRecurringInvoices extends Command
{
    protected $signature = 'recurring-invoices:generate';

    protected $description = 'Generates invoices for active recurring templates due today.';

    public function handle()
    {
        $this->info("Starting Recurring Invoice generation...");

        $tenants = Tenant::whereIn('status', ['active', 'trial'])->get();

        foreach ($tenants as $tenant) {
            $this->info("Processing Tenant [{$tenant->id}] — {$tenant->name}");
            
            // Scope context to tenant
            app()->instance('current.tenant', $tenant);

            // Fetch active templates due today or earlier
            $dueInvoices = RecurringInvoice::where('status', 'active')
                ->whereDate('next_run_date', '<=', now()->toDateString())
                ->get();

            if ($dueInvoices->isEmpty()) {
                continue;
            }

            // Resolve SaleService fresh for this tenant context
            $saleService = app(SaleService::class);

            // Find an approved_by user
            $owner = $tenant->users()->wherePivot('role', 'owner')->first();
            $ownerId = $owner ? $owner->id : \App\Models\User::whereHas('memberships', function ($q) use ($tenant) {
                $q->where('tenant_id', $tenant->id);
            })->first()?->id ?? \App\Models\User::first()?->id;

            foreach ($dueInvoices as $invoice) {
                $this->info("   Generating invoice for template [{$invoice->id}]...");
                try {
                    $salePayload = [
                        'customer_id'     => $invoice->customer_id,
                        'warehouse_id'    => $invoice->warehouse_id,
                        'sale_date'       => now()->toDateString(),
                        'payment_method'  => 'cash',
                        'approved_by'     => $ownerId,
                        'items'           => collect($invoice->items)->map(function ($item) {
                            return [
                                'product_id'       => $item['product_id'],
                                'qty'              => $item['qty'] ?? $item['quantity'] ?? 1,
                                'sale_uom'         => $item['sale_uom'] ?? 'pcs',
                                'unit_price'       => $item['unit_price'] ?? $item['price'] ?? 0.00,
                                'discount_percent' => $item['discount_percent'] ?? $item['discount'] ?? 0.00,
                                'tax_rate'         => $item['tax_rate'] ?? 0.00,
                                'is_promotional'   => $item['is_promotional'] ?? false,
                            ];
                        })->toArray(),
                    ];

                    $sale = $saleService->post($salePayload);

                    // Update next_run_date based on frequency
                    $nextRunDate = Carbon::parse($invoice->next_run_date);
                    match ($invoice->frequency) {
                        'daily'   => $nextRunDate->addDay(),
                        'weekly'  => $nextRunDate->addWeek(),
                        'monthly' => $nextRunDate->addMonth(),
                        default   => $nextRunDate->addMonth(),
                    };

                    $invoice->update([
                        'last_run_at'   => now(),
                        'next_run_date' => $nextRunDate->toDateString(),
                    ]);

                    $this->info("   ✅ Created sale/invoice [{$sale->id}] for tenant [{$tenant->id}]");
                } catch (\Exception $e) {
                    $this->error("   ❌ Error generating recurring invoice [{$invoice->id}]: " . $e->getMessage());
                }
            }
        }

        $this->info("Completed Recurring Invoice generation.");
        return 0;
    }
}
