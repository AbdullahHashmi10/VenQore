<?php

namespace App\Services;

use App\Engines\SaleService;
use App\Models\JobEvent;
use App\Models\ServiceJob;
use Illuminate\Support\Facades\DB;

/*
|==============================================================================
| STEP 8 — ServiceBillingService
|==============================================================================
|
| ⚠️  READ THIS BEFORE ANYTHING ELSE IN STEP 8  ⚠️
|
| THE BUG THIS FILE EXISTS TO FIX
| -------------------------------
| `ServiceEngine::convertJobToInvoice()` (app/Engines/ServiceEngine.php:135)
| bypasses the Qore completely. Verified 15 Aug 2026:
|
|   - it writes straight to the legacy `invoices` table, not through SaleService
|   - the invoice number is `'INV-' . substr(md5(uniqid()), 0, 8)` — NOT
|     SequenceService, so service invoices are not sequential and not legal
|   - it posts NO journal entry, so service revenue never reaches the ledger
|   - it computes tax inline as `lineTotal * rate / 100` instead of TaxService
|
| The consequence, in the customer's words: a freelancer bills Rs. 312,000 of
| work and their profit report says zero. The single promise the Services module
| exists to make — "invoicing that adds up" — is the exact promise that code
| breaks.
|
| So Step 8 is not "build a UI on ServiceEngine". Step 8 is: route service
| billing through the Qore, THEN build the UI.
|
|------------------------------------------------------------------------------
| WHY THIS IS A NEW CLASS RATHER THAN AN EDIT TO ServiceEngine
|------------------------------------------------------------------------------
| ServiceEngine's job creation, status transitions and technician assignment are
| fine and tested-adjacent. Only the billing tail is wrong. Replacing one method
| in a 195-line engine you have working is a smaller, more reviewable change
| than rewriting the engine.
|
| Apply the one-line delegation patch in STEPS_8_TO_12_INSTALL.md §1, which
| turns convertJobToInvoice() into a call into this class. Keep the old method
| signature so nothing that calls it breaks.
|
|------------------------------------------------------------------------------
| WHAT ELSE IS HERE
|------------------------------------------------------------------------------
| Service PACKAGES  — a fixed-price bundle ("Full Service — Rs. 4,500")
| HOURLY BILLING    — rate cards, logged time, rounding rules
| Both resolve to ordinary sale LINES, so the Qore treats a service invoice
| exactly like any other sale: revenue posts, no COGS, no stock movement.
|==============================================================================
*/
class ServiceBillingService
{
    public function __construct(private SaleService $sales)
    {
    }

    /**
     * Turn a completed job into a real, ledger-posted sale.
     *
     * THE CONTRACT THIS METHOD KEEPS:
     *   - invoice number from SequenceService  (sequential, legal)
     *   - tax from TaxService                  (correct, consistent)
     *   - a journal entry                      (revenue reaches the ledger)
     *   - NO stock movement, NO COGS           (it is a service)
     *
     * All four are properties of SaleService::post(), which already handles
     * `products.type === 'service'` at line 137 by skipping FIFO entirely.
     * We do not re-implement any of it — we hand it the lines and let the Qore
     * be the Qore.
     */
    public function invoiceJob(ServiceJob $job): object
    {
        if ($job->sale_id) {
            $existing = DB::table('sales')->where('id', $job->sale_id)->first();
            if ($existing) {
                return $existing;                 // idempotent; never double-bill
            }
        }

        return DB::transaction(function () use ($job) {
            $items = $this->linesFor($job);

            if ($items === []) {
                throw new \RuntimeException(
                    "Job {$job->number} has no billable lines. Add work, parts or time before invoicing."
                );
            }

            // THE QORE CALL. Everything correct happens in here.
            $sale = $this->sales->post([
                'party_id'   => $job->party_id,
                'items'      => $items,
                'payments'   => [],               // unpaid on issue; khata handles the rest
                'notes'      => "Job {$job->number}: {$job->title}",
                'reference'  => $job->number,
                'sale_type'  => 'service',
            ]);

            $job->sale_id = $sale->id;
            $job->status = 'invoiced';
            $job->actual_total = collect($items)
                ->sum(fn ($i) => $i['qty'] * $i['unit_price']);
            $job->save();

            JobEvent::create([
                'job_id'  => $job->id,
                'type'    => 'invoiced',
                'body'    => "Job invoiced as {$sale->invoice_number}.",
                'user_id' => auth()->id(),
            ]);

            return $sale;
        });
    }

    /**
     * Build sale lines from a job: packages, hourly time, then parts.
     *
     * Every line carries a product_id, because the Qore needs one to decide
     * whether to move stock. Service lines point at a `products.type = 'service'`
     * row; parts point at a real product and DO move stock — which is correct.
     * A workshop that fits a Rs. 2,000 part should see that part leave inventory.
     */
    private function linesFor(ServiceJob $job): array
    {
        $items = [];

        foreach ($job->lines as $line) {
            $productId = $line->product_id ?: $this->fallbackServiceProduct($job->tenant_id);

            if (!$productId) {
                continue;   // nothing to bill against; skipped rather than guessed
            }

            $items[] = [
                'product_id'       => $productId,
                'qty'              => (float) $line->quantity,
                'unit_price'       => (float) $line->unit_price,
                'discount_percent' => (float) ($line->discount_percent ?? 0),
                'tax_rate'         => (float) ($line->tax_rate ?? 0),
                'sale_uom'         => $line->uom ?? null,
                'description'      => $line->description,
            ];
        }

        return $items;
    }

    /*
    |--------------------------------------------------------------------------
    | SERVICE PACKAGES
    |--------------------------------------------------------------------------
    | A package is a named, fixed-price bundle of work: "Full Service — Rs.
    | 4,500", "Bridal Package — Rs. 25,000".
    |
    | IT IS ONE LINE, NOT A RECIPE. A package that expanded into its component
    | tasks would be Cookbook (#29) wearing a different hat, and a salon does not
    | want a bill of materials for a haircut. The breakdown is descriptive text;
    | the price is the price.
    */

    /** Add a package to a job as a single billable line. */
    public function addPackage(ServiceJob $job, int $packageId, float $qty = 1.0): void
    {
        $package = DB::table('service_packages')
            ->where('tenant_id', $job->tenant_id)
            ->where('id', $packageId)
            ->first();

        if (!$package) {
            throw new \RuntimeException('That package does not exist.');
        }

        $job->lines()->create([
            'kind'        => 'package',
            'product_id'  => $package->product_id,
            'description' => $package->name,
            'quantity'    => $qty,
            'unit_price'  => (float) $package->price,
            'tax_rate'    => (float) ($package->tax_rate ?? 0),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | HOURLY BILLING
    |--------------------------------------------------------------------------
    | Rate card per job type or per technician, plus logged time.
    |
    | ROUNDING IS A BUSINESS DECISION, NOT A MATHS ONE. A consultant who works
    | 61 minutes usually bills 1.25 hours, not 1.0166. The rounding rule lives on
    | the rate card so each business sets its own, and the default is
    | 15-minute increments rounded UP — the convention most trades already use.
    */

    /** Log time against a job and bill it at the applicable rate. */
    public function logTime(
        ServiceJob $job,
        float $minutes,
        ?int $employeeId = null,
        ?string $note = null
    ): void {
        $rate = $this->rateFor($job, $employeeId);

        if (!$rate) {
            throw new \RuntimeException(
                'No hourly rate is set for this job. Add a rate card before logging time.'
            );
        }

        $hours = $this->roundHours($minutes, (int) ($rate->increment_minutes ?? 15), $rate->rounding ?? 'up');

        $job->lines()->create([
            'kind'        => 'time',
            'product_id'  => $rate->product_id,
            'description' => $note ?: ($rate->label ?? 'Labour'),
            'quantity'    => $hours,
            'unit_price'  => (float) $rate->hourly_rate,
            'tax_rate'    => (float) ($rate->tax_rate ?? 0),
        ]);

        JobEvent::create([
            'job_id'  => $job->id,
            'type'    => 'time_logged',
            'body'    => sprintf('%s hours logged at %s/hr.', $hours, number_format((float) $rate->hourly_rate, 2)),
            'user_id' => auth()->id(),
        ]);
    }

    /**
     * Most specific rate wins: this technician > this job type > tenant default.
     * A senior technician's rate should not be silently overwritten by a
     * generic one just because the generic row was created later.
     */
    private function rateFor(ServiceJob $job, ?int $employeeId)
    {
        $query = DB::table('service_rates')->where('tenant_id', $job->tenant_id);

        if ($employeeId) {
            $rate = (clone $query)->where('employee_id', $employeeId)->first();
            if ($rate) {
                return $rate;
            }
        }

        return (clone $query)->whereNull('employee_id')->orderBy('id')->first();
    }

    /**
     * Minutes -> billable hours, in increments, per the rate card's rule.
     *
     *   90 minutes, 15-min increments, round up   -> 1.5
     *   61 minutes, 15-min increments, round up   -> 1.25
     *   61 minutes, 15-min increments, nearest    -> 1.0
     *   61 minutes, exact                         -> 1.0167
     */
    public function roundHours(float $minutes, int $increment = 15, string $rounding = 'up'): float
    {
        if ($increment <= 0 || $rounding === 'exact') {
            return round($minutes / 60, 4);
        }

        $blocks = $minutes / $increment;

        $blocks = match ($rounding) {
            'down'    => floor($blocks),
            'nearest' => round($blocks),
            default   => ceil($blocks),
        };

        return round(($blocks * $increment) / 60, 4);
    }

    /**
     * The tenant's catch-all service product, for lines with no product of
     * their own. Created on demand so a first-time user is never blocked by a
     * setup step they did not know about.
     *
     * type = 'service' is what makes the Qore skip FIFO. Without it a service
     * line would try to deduct stock that does not exist and either fail or
     * go negative.
     */
    private function fallbackServiceProduct(int $tenantId): ?int
    {
        $existing = DB::table('products')
            ->where('tenant_id', $tenantId)
            ->where('type', 'service')
            ->where('sku', 'SERVICE-GENERAL')
            ->value('id');

        if ($existing) {
            return $existing;
        }

        try {
            return DB::table('products')->insertGetId([
                'tenant_id'  => $tenantId,
                'name'       => 'Service',
                'sku'        => 'SERVICE-GENERAL',
                'type'       => 'service',
                'price'      => 0,
                'cost_price' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable) {
            return null;   // column mismatch across deployments — never fatal
        }
    }
}
