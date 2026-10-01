<?php

namespace App\Engines;

use App\Models\ServiceJob;
use App\Models\JobLine;
use App\Models\JobAssignment;
use App\Models\JobEvent;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;

class ServiceEngine
{
    /**
     * Generate the next unique job number for a tenant.
     */
    public static function generateNumber(int $tenantId): string
    {
        $lastNumber = DB::table('service_jobs')
            ->where('tenant_id', $tenantId)
            ->max('id') ?? 0;

        return 'JOB-' . str_pad((string)($lastNumber + 1001), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Create a new field service / repair job with line items.
     */
    public function createJob(array $data): ServiceJob
    {
        return DB::transaction(function () use ($data) {
            $tenantId = $data['tenant_id'] ?? app('current.tenant')->id;
            $number   = $data['number'] ?? self::generateNumber($tenantId);

            $userId = auth()->id() ?? \App\Models\User::first()?->id;

            $job = ServiceJob::create([
                'tenant_id'       => $tenantId,
                'number'          => $number,
                'party_id'        => $data['party_id'],
                'contract_id'     => $data['contract_id'] ?? null,
                'quotation_id'    => $data['quotation_id'] ?? null,
                'occupancy_id'    => $data['occupancy_id'] ?? null,
                'title'           => $data['title'],
                'description'     => $data['description'] ?? null,
                'site_address'    => $data['site_address'] ?? null,
                'site_lat'        => $data['site_lat'] ?? null,
                'site_lng'        => $data['site_lng'] ?? null,
                'priority'        => $data['priority'] ?? 'normal',
                'status'          => $data['status'] ?? 'draft',
                'scheduled_for'   => $data['scheduled_for'] ?? null,
                'estimated_total' => $data['estimated_total'] ?? 0.00,
                'created_by'      => $data['created_by'] ?? $userId,
            ]);

            if (!empty($data['lines']) && is_array($data['lines'])) {
                foreach ($data['lines'] as $line) {
                    $job->lines()->create([
                        'kind'         => $line['kind'] ?? 'service',
                        'product_id'   => $line['product_id'] ?? null,
                        'description'  => $line['description'] ?? 'Service line',
                        'quantity'     => $line['quantity'] ?? 1,
                        'unit_price'   => $line['unit_price'] ?? 0,
                        'unit_cost'    => $line['unit_cost'] ?? 0,
                        'tax_rate'     => $line['tax_rate'] ?? 0,
                        'warehouse_id' => $line['warehouse_id'] ?? null,
                    ]);
                }
            }

            // Record creation event
            JobEvent::create([
                'job_id'  => $job->id,
                'type'    => 'created',
                'body'    => "Job {$job->number} created.",
                'user_id' => $userId,
            ]);

            return $job;
        });
    }

    /**
     * Transition job status and record audit log event.
     */
    public function updateStatus(ServiceJob $job, string $newStatus, ?string $note = null): ServiceJob
    {
        return DB::transaction(function () use ($job, $newStatus, $note) {
            $oldStatus = $job->status;
            $job->status = $newStatus;

            if ($newStatus === 'in_progress' && !$job->started_at) {
                $job->started_at = now();
            }

            if ($newStatus === 'completed' && !$job->completed_at) {
                $job->completed_at = now();
            }

            $job->save();

            $userId = auth()->id() ?? \App\Models\User::first()?->id;

            JobEvent::create([
                'job_id'  => $job->id,
                'type'    => 'status_changed',
                'body'    => "Status changed from {$oldStatus} to {$newStatus}." . ($note ? " Note: {$note}" : ''),
                'user_id' => $userId,
            ]);

            return $job;
        });
    }

    /**
     * Assign a technician/employee to a service job.
     */
    public function assignTechnician(ServiceJob $job, string|int $employeeId, ?string $role = 'primary'): JobAssignment
    {
        $assignment = JobAssignment::updateOrCreate(
            ['job_id' => $job->id, 'employee_id' => $employeeId],
            ['role' => $role, 'assigned_at' => now()]
        );

        $empName = Employee::where('tenant_id', $job->tenant_id)->find($employeeId)?->name ?? "Employee #{$employeeId}";
        $userId = auth()->id() ?? \App\Models\User::first()?->id;

        JobEvent::create([
            'job_id'  => $job->id,
            'type'    => 'technician_assigned',
            'body'    => "{$empName} assigned as {$role}.",
            'user_id' => $userId,
        ]);

        return $assignment;
    }

    /**
     * Convert completed Job lines into a clean Invoice.
     */
    public function convertJobToInvoice(ServiceJob $job): Invoice
    {
        return DB::transaction(function () use ($job) {
            if ($job->invoice_id) {
                $existing = Invoice::find($job->invoice_id);
                if ($existing) return $existing;
            }

            $subtotal = 0;
            $items = [];

            foreach ($job->lines as $line) {
                $lineTotal = $line->quantity * $line->unit_price;
                $subtotal += $lineTotal;

                $productId = $line->product_id;
                if (!$productId) {
                    $fallbackProduct = \App\Models\Product::firstOrCreate(
                        ['tenant_id' => $job->tenant_id, 'name' => 'General Service / Labor'],
                        ['sku' => 'SRV-GEN-01', 'type' => 'service', 'price' => 0, 'service_pricing' => 'fixed', 'cost_price' => 0]
                    );
                    $productId = $fallbackProduct->id;
                }

                $items[] = [
                    'product_id'      => $productId,
                    'quantity'        => $line->quantity,
                    'unit_price'      => $line->unit_price,
                    'discount_amount' => 0,
                    'tax_amount'      => ($lineTotal * ($line->tax_rate ?? 0)) / 100,
                    'total'           => $lineTotal,
                ];
            }

            $invNumber = 'INV-' . strtoupper(substr(md5(uniqid()), 0, 8));

            $invoice = Invoice::create([
                'tenant_id'      => $job->tenant_id,
                'invoice_number' => $invNumber,
                'date'           => now(),
                'due_date'       => now()->addDays(14),
                'party_id'       => $job->party_id,
                'user_id'        => auth()->id() ?? $job->created_by,
                'type'           => 'sale',
                'status'         => 'unpaid',
                'subtotal'       => $subtotal,
                'total_amount'   => $subtotal,
                'notes'          => "Generated from Job {$job->number}: {$job->title}",
            ]);

            foreach ($items as $item) {
                $invoice->items()->create($item);
            }

            $job->invoice_id = $invoice->id;
            $job->status = 'invoiced';
            $job->actual_total = $subtotal;
            $job->save();

            JobEvent::create([
                'job_id'  => $job->id,
                'type'    => 'invoiced',
                'body'    => "Job invoiced under Invoice {$invoice->invoice_number}.",
                'user_id' => auth()->id() ?? $job->created_by,
            ]);

            return $invoice;
        });
    }
}
