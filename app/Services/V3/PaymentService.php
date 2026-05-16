<?php

namespace App\Services\V3;

use App\Exceptions\OverAllocationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    private int $tenantId;

    public function __construct() {
        $this->tenantId = app('current.tenant')->id;
    }
    /**
     * OWNS: payment_allocations, sales.payment_status, purchases.payment_status
     * NEVER called directly for reversals — voidAllocations() is called only
     * by AccountingService::reverseEntry().
     */

    /**
     * Allocate a payment journal entry against one or more invoices.
     * Enforces over-allocation at app layer (DB trigger is the final guard).
     *
     * @param string $paymentJournalEntryId
     * @param array  $allocations  [{sale_id, amount} | {purchase_id, amount}]
     */
    public function allocate(string $paymentJournalEntryId, array $allocations): void
    {
        DB::transaction(function () use ($paymentJournalEntryId, $allocations) {

            foreach ($allocations as $allocation) {
                $isSale = isset($allocation['sale_id']);

                if ($isSale) {
                    $this->checkOverAllocation(
                        $allocation['sale_id'],
                        $allocation['amount'],
                        'sale'
                    );
                } else {
                    $this->checkOverAllocation(
                        $allocation['purchase_id'],
                        $allocation['amount'],
                        'purchase'
                    );
                }

                $tid = $this->tenantId;
                DB::table('payment_allocations')->insert([
                    'id'                        => Str::uuid()->toString(),
                    'tenant_id'                 => $tid,
                    'payment_journal_entry_id'  => $paymentJournalEntryId,
                    'sale_id'                   => $allocation['sale_id']     ?? null,
                    'purchase_id'               => $allocation['purchase_id'] ?? null,
                    'allocated_amount'          => $allocation['amount'],
                    'status'                    => 'active',
                    'created_at'                => now(),
                    'updated_at'                => now(),
                ]);

                // Update badge immediately after each allocation
                if ($isSale) {
                    $this->updatePaymentBadge($allocation['sale_id']);
                }
            }
        });
    }

    /**
     * Recompute and write sales.payment_status from live allocation data.
     * THIS IS THE ONLY METHOD THAT WRITES payment_status.
     */
    public function updatePaymentBadge(string $saleId): void
    {
        $tid = $this->tenantId;
        $sale = DB::table('sales')->where('tenant_id', $tid)->where('id', $saleId)->first();
        if (!$sale) return;

        // Already written-off — never change the badge
        if ($sale->payment_status === 'written_off') return;

        $allocated = (float) DB::table('payment_allocations')
            ->where('tenant_id', $tid)
            ->where('sale_id', $saleId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        $total     = (float) ($sale->total ?? 0);
        $tolerance = (float) (DB::table('system_settings')
            ->where('key', 'roundoff_tolerance')
            ->value('value') ?? 1.00);

        $outstanding = $total - $allocated;

        if ($allocated <= 0) {
            $status = 'unpaid';
        } elseif ($outstanding <= $tolerance) {
            // Within round-off tolerance — auto-close as paid
            $status = 'paid';
        } else {
            $status = 'partial';
        }

        DB::table('sales')
            ->where('tenant_id', $tid)
            ->where('id', $saleId)
            ->update([
                'payment_status' => $status,
                'updated_at'     => now(),
            ]);
    }

    /**
     * Void all active allocations for a given payment journal entry.
     *
     * CRITICAL: Called ONLY by AccountingService::reverseEntry().
     * Never call this directly from a controller.
     *
     * After voiding, rebuilds the payment badge for every affected sale/purchase.
     */
    public function voidAllocations(string $paymentJournalEntryId): void
    {
        DB::transaction(function () use ($paymentJournalEntryId) {

            $tid = $this->tenantId;
            // Collect affected sale IDs before voiding
            $affected = DB::table('payment_allocations')
                ->where('tenant_id', $tid)
                ->where('payment_journal_entry_id', $paymentJournalEntryId)
                ->where('status', 'active')
                ->get();

            // Void all active rows
            DB::table('payment_allocations')
                ->where('tenant_id', $tid)
                ->where('payment_journal_entry_id', $paymentJournalEntryId)
                ->where('status', 'active')
                ->update([
                    'status'     => 'reversed',
                    'updated_at' => now(),
                ]);

            // Rebuild badge for every affected invoice
            foreach ($affected as $row) {
                if ($row->sale_id) {
                    $this->updatePaymentBadge($row->sale_id);
                }
            }
        });
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private function checkOverAllocation(
        string $invoiceId,
        float  $attemptedAmount,
        string $type  // 'sale' or 'purchase'
    ): void {
        $table        = $type === 'sale' ? 'sales' : 'purchases';
        $idColumn     = $type === 'sale' ? 'sale_id' : 'purchase_id';

        $tid = $this->tenantId;
        $invoice = DB::table($table)->where('tenant_id', $tid)->where('id', $invoiceId)->first();
        if (!$invoice) {
            throw new \InvalidArgumentException("Invoice not found: {$invoiceId}");
        }

        $invoiceTotal = (float) ($invoice->total ?? 0);

        $alreadyAllocated = (float) DB::table('payment_allocations')
            ->where('tenant_id', $tid)
            ->where($idColumn, $invoiceId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        if (($alreadyAllocated + $attemptedAmount) > ($invoiceTotal + 0.001)) {
            throw new OverAllocationException(
                $invoiceId,
                $invoiceTotal,
                $alreadyAllocated,
                $attemptedAmount
            );
        }
    }
}
