<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\RecurringInvoice;
use App\Engines\SaleService;
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
                    /* ── the template's discount ──────────────────────────
                       A discount on the template is a discount on the whole
                       document, and the sale engine works line by line — so it
                       is spread across the lines in proportion to what each one
                       is worth, which is exactly what the invoice screen does
                       before it sends. Spreading it here rather than teaching
                       the engine about document-level money keeps one
                       arithmetic and leaves every other caller untouched.

                       `discount` on a stored line is MONEY. The old code passed
                       it straight through as `discount_percent`, so a template
                       carrying a 500 line discount raised invoices at 500% off.
                       ---------------------------------------------------- */
                    $rawLines = collect($invoice->items)->map(function ($item) {
                        $qty   = (float) ($item['qty'] ?? $item['quantity'] ?? 1);
                        $price = (float) ($item['unit_price'] ?? $item['price'] ?? 0);
                        $gross = round($qty * $price, 2);
                        /* Money if it was stored as money, otherwise whatever
                           the percentage comes to. */
                        $off = array_key_exists('discount', $item) && $item['discount'] !== null
                            ? (float) $item['discount']
                            : round($gross * ((float) ($item['discount_percent'] ?? 0)) / 100, 2);

                        return [
                            'item'  => $item,
                            'gross' => $gross,
                            'off'   => min($off, $gross),
                            'net'   => max(0, $gross - min($off, $gross)),
                        ];
                    })->all();

                    $pool     = array_sum(array_column($rawLines, 'net'));
                    $docOff   = min((float) ($invoice->discount ?? 0), $pool);

                    $salePayload = [
                        'customer_id'     => $invoice->customer_id,
                        'warehouse_id'    => $invoice->warehouse_id,
                        'sale_date'       => now()->toDateString(),
                        'payment_method'  => 'cash',
                        'approved_by'     => $ownerId,
                        'items'           => collect($rawLines)->map(function ($l) use ($pool, $docOff) {
                            $item  = $l['item'];
                            $share = $pool > 0 ? round($docOff * ($l['net'] / $pool), 2) : 0.0;
                            $off   = min($l['gross'], $l['off'] + $share);

                            return [
                                'product_id'       => $item['product_id'],
                                'qty'              => $item['qty'] ?? $item['quantity'] ?? 1,
                                'sale_uom'         => $item['sale_uom'] ?? 'pcs',
                                'unit_price'       => $item['unit_price'] ?? $item['price'] ?? 0.00,
                                /* The engine takes a percentage, so the money
                                   above is converted back at this line's own
                                   gross — exact to the paisa, because it is the
                                   same gross the money came from. */
                                'discount_percent' => $l['gross'] > 0
                                    ? round(($off / $l['gross']) * 100, 6)
                                    : 0.00,
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
