<?php

namespace App\Engines;

use App\Exceptions\OverAllocationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __get($name) {
        if ($name === 'tenantId') {
            return app('current.tenant')->id;
        }
        return null;
    }

    public function __construct() {
    }
    /**
     * OWNS: allocations, sales.payment_status, purchases.payment_status
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
                DB::table('allocations')->insert([
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
                } else {
                    $this->updatePurchaseBadge($allocation['purchase_id']);
                }
            }
        });
    }

    /**
     * Recompute and write sales.payment_status from live allocation data.
     * THIS IS THE ONLY METHOD THAT WRITES payment_status FOR SALES.
     */
    public function updatePaymentBadge(string $saleId): void
    {
        $tid = $this->tenantId;
        $sale = DB::table('sales')->where('tenant_id', $tid)->where('id', $saleId)->first();
        if (!$sale) return;

        // Already written-off — never change the badge
        if ($sale->payment_status === 'written_off') return;

        $allocated = (float) DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where('sale_id', $saleId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        $total     = (float) ($sale->total ?? 0);
        $tolerance = (float) (DB::table('system_settings')
            ->where('tenant_id', $tid)
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
     * Recompute and write purchases.payment_status from live allocation data.
     * THIS IS THE ONLY METHOD THAT WRITES payment_status FOR PURCHASES.
     */
    public function updatePurchaseBadge(string $purchaseId): void
    {
        $tid = $this->tenantId;
        $purchase = DB::table('purchases')->where('tenant_id', $tid)->where('id', $purchaseId)->first();
        if (!$purchase) return;

        $allocated = (float) DB::table('allocations')
            ->where('tenant_id', $tid)
            ->where('purchase_id', $purchaseId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        $total     = (float) ($purchase->total ?? 0);
        $tolerance = (float) (DB::table('system_settings')
            ->where('tenant_id', $tid)
            ->where('key', 'roundoff_tolerance')
            ->value('value') ?? 1.00);

        $outstanding = $total - $allocated;

        if ($allocated <= 0) {
            $status = 'unpaid';
        } elseif ($outstanding <= $tolerance) {
            $status = 'paid';
        } else {
            $status = 'partial';
        }

        DB::table('purchases')
            ->where('tenant_id', $tid)
            ->where('id', $purchaseId)
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
            // Collect affected sale/purchase IDs before voiding
            $affected = DB::table('allocations')
                ->where('tenant_id', $tid)
                ->where('payment_journal_entry_id', $paymentJournalEntryId)
                ->where('status', 'active')
                ->get();

            // Void all active rows
            DB::table('allocations')
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
                } elseif ($row->purchase_id) {
                    $this->updatePurchaseBadge($row->purchase_id);
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
        $tid = $this->tenantId;

        if ($type === 'sale') {
            $invoice = DB::table('sales')
                ->where('tenant_id', $tid)
                ->where('id', $invoiceId)
                ->first();
            $invoiceTotal = (float) ($invoice->total ?? 0);
        } else {
            // V3 purchases live in the `purchases` table. This must stay in step
            // with V3\PurchaseService, V3\PurchaseController, V3\SupplierStatementController
            // and GoldenCompanySeeder, which all write/read `purchases`.
            $invoice = DB::table('purchases')
                ->where('tenant_id', $tid)
                ->where('id', $invoiceId)
                ->first();
            $invoiceTotal = (float) ($invoice->total ?? 0);
        }

        if (!$invoice) {
            throw new \InvalidArgumentException(
                "Invoice not found: {$invoiceId}. Tenant: {$tid}. Type: {$type}."
            );
        }

        $idColumn = $type === 'sale' ? 'sale_id' : 'purchase_id';

        $alreadyAllocated = (float) DB::table('allocations')
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
