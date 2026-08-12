<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * V3 CONSOLIDATION — PHASE 3: BACKFILL
 * See V3_CONSOLIDATION_PLAN.md §Phase 3.
 *
 * Copies the legacy purchase island (`invoices` where type is purchase /
 * purchase_return) into `purchases` / `purchase_items` / `purchase_returns`.
 *
 * ⭐ THE WHOLE TRICK: THE UUID IS PRESERVED.
 *
 * `journal_entries.reference`, `expenses.purchase_id` and
 * `inventory_batches.purchase_invoice_id` all already point at `invoices.id`.
 * Because each row keeps its exact UUID, every one of those links stays valid
 * with zero repointing. Do not generate new ids here — that single decision is
 * what turns this from a terrifying migration into a copy.
 *
 * Non-negotiable properties (all enforced below):
 *   - IDEMPOTENT       — insertOrIgnore on the preserved UUID; safe to run twice
 *   - DRY-RUN BY DEFAULT — writing requires --commit
 *   - PER-TENANT       — --tenant= lets you pilot on one customer
 *   - TRANSACTIONAL    — one transaction per tenant, with a printed summary
 *
 * Run `php artisan purchases:reconcile --baseline` BEFORE this, and
 * `php artisan purchases:reconcile` after. The diff must be empty except the
 * expected aged-payables delta.
 */
class MigrateLegacyPurchasesCommand extends Command
{
    protected $signature = 'purchases:migrate-legacy
                            {--commit : Actually write. Without this the command is a dry run.}
                            {--tenant= : Restrict to a single tenant id.}
                            {--chunk=200 : Rows per chunk.}';

    protected $description = 'Backfill the legacy invoices purchase island into the V3 purchases tables, preserving UUIDs';

    private bool $commit = false;

    private array $stats = [
        'purchases_inserted'   => 0,
        'purchases_skipped'    => 0,
        'items_inserted'       => 0,
        'returns_inserted'     => 0,
        'returns_skipped'      => 0,
        'allocations_inserted' => 0,
        'warnings'             => [],
    ];

    public function handle(): int
    {
        $this->commit = (bool) $this->option('commit');

        if (! DB::getSchemaBuilder()->hasTable('invoices')) {
            $this->info('`invoices` table does not exist — nothing to migrate.');
            return self::SUCCESS;
        }

        foreach (['discount', 'round_off', 'notes', 'reference', 'due_date', 'workflow_status'] as $col) {
            if (! DB::getSchemaBuilder()->hasColumn('purchases', $col)) {
                $this->error("Phase 1 has not run: `purchases.{$col}` is missing.");
                $this->line('Run: php artisan migrate  (2026_08_11_000001_add_legacy_parity_columns_to_purchases)');
                return self::FAILURE;
            }
        }

        if (! $this->commit) {
            $this->warn('DRY RUN — nothing will be written. Add --commit to apply.');
        }

        $tenantIds = $this->option('tenant')
            ? [$this->option('tenant')]
            : DB::table('invoices')
                ->whereIn('type', ['purchase', 'purchase_return'])
                ->distinct()
                ->pluck('tenant_id')
                ->filter()
                ->all();

        if (empty($tenantIds)) {
            $this->info('No legacy purchase rows found.');
            return self::SUCCESS;
        }

        $this->line('Tenants to process: ' . count($tenantIds));
        $this->newLine();

        foreach ($tenantIds as $tenantId) {
            $this->migrateTenant($tenantId);
        }

        $this->summary();

        return self::SUCCESS;
    }

    private function migrateTenant($tenantId): void
    {
        $this->line("── tenant {$tenantId}");

        $warehouseId = DB::table('warehouses')
            ->where('tenant_id', $tenantId)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->value('id');

        if (! $warehouseId) {
            $this->stats['warnings'][] = "tenant {$tenantId}: no warehouse — skipped entirely";
            $this->warn('   no warehouse for this tenant, skipping');
            return;
        }

        $run = function () use ($tenantId, $warehouseId) {
            $this->migratePurchases($tenantId, $warehouseId);
            $this->migrateReturns($tenantId);
            $this->backfillAllocations($tenantId);
        };

        if ($this->commit) {
            DB::transaction($run);
        } else {
            // Dry run still executes the reads and counting, inside a transaction
            // that is always rolled back, so the numbers reported are real.
            DB::beginTransaction();
            try {
                $run();
            } finally {
                DB::rollBack();
            }
        }
    }

    private function migratePurchases($tenantId, $warehouseId): void
    {
        DB::table('invoices')
            ->where('tenant_id', $tenantId)
            ->where('type', 'purchase')
            ->orderBy('id')
            ->chunkById((int) $this->option('chunk'), function ($invoices) use ($tenantId, $warehouseId) {
                foreach ($invoices as $inv) {
                    $exists = DB::table('purchases')->where('id', $inv->id)->exists();
                    if ($exists) {
                        $this->stats['purchases_skipped']++;
                        continue;
                    }

                    $journalEntryId = DB::table('journal_entries')
                        ->where('tenant_id', $tenantId)
                        ->where('reference', $inv->id)
                        ->where('reference_type', 'purchase')
                        ->where('is_reversed', 0)
                        ->value('id');

                    // Legacy overloaded `status` with BOTH meanings. Split it.
                    $legacyStatus  = strtolower((string) ($inv->status ?? ''));
                    $paymentStatus = in_array($legacyStatus, ['paid', 'partial', 'unpaid'], true)
                        ? $legacyStatus
                        : 'unpaid';
                    $workflowStatus = in_array($legacyStatus, ['pending', 'partial', 'received'], true)
                        ? $legacyStatus
                        : 'received';

                    DB::table('purchases')->insertOrIgnore([
                        'id'               => $inv->id,          // ⭐ preserved
                        'tenant_id'        => $tenantId,
                        'invoice_number'   => $inv->invoice_number,
                        'reference'        => $inv->reference ?? null,
                        'party_id'         => $inv->party_id,
                        'warehouse_id'     => $warehouseId,
                        'purchase_date'    => $inv->date,
                        'due_date'         => $inv->due_date ?? null,
                        'subtotal'         => $inv->subtotal ?? $this->deriveSubtotal($inv),
                        'tax'              => $inv->tax ?? $inv->tax_amount ?? 0,
                        'discount'         => $inv->discount ?? $inv->discount_amount ?? 0,
                        'round_off'        => $inv->round_off ?? 0,
                        'total'            => $inv->total_amount ?? 0,
                        'payment_status'   => $paymentStatus,
                        'workflow_status'  => $workflowStatus,
                        'payment_method'   => $inv->payment_method ?? null,
                        'notes'            => $inv->notes ?? null,
                        'journal_entry_id' => $journalEntryId,
                        'is_jit'           => $inv->is_jit ?? false,
                        'jit_sale_id'      => $inv->jit_sale_id ?? null,
                        'approval_status'  => $inv->approval_status ?? 'approved',
                        'user_id'          => $inv->user_id ?? null,
                        'created_by'       => $inv->user_id ?? null,
                        'created_at'       => $inv->created_at ?? now(),
                        'updated_at'       => $inv->updated_at ?? now(),
                    ]);

                    $this->stats['purchases_inserted']++;
                    $this->migrateItems($tenantId, $inv->id);
                }
            });
    }

    private function migrateItems($tenantId, string $invoiceId): void
    {
        $items = DB::table('invoice_items')->where('invoice_id', $invoiceId)->get();

        foreach ($items as $it) {
            if (DB::table('purchase_items')->where('id', $it->id)->exists()) {
                continue;
            }

            DB::table('purchase_items')->insertOrIgnore([
                'id'                 => $it->id,   // ⭐ preserved
                'tenant_id'          => $tenantId,
                'purchase_id'        => $invoiceId,
                'product_id'         => $it->product_id,
                'variant_id'         => $it->product_variant_id ?? null,
                'qty'                => $it->quantity,
                'received_qty'       => $it->received_qty ?? 0,
                'unit_cost'          => $it->unit_price,
                'discount_amount'    => $it->discount_amount ?? 0,
                'tax_rate'           => $it->tax_rate ?? 0,
                'business_pct'       => 100,   // legacy had no ITC split
                'line_total'         => $it->total,
                'inventory_batch_id' => $it->batch_id ?? null,
                'created_at'         => $it->created_at ?? now(),
                'updated_at'         => $it->updated_at ?? now(),
            ]);

            $this->stats['items_inserted']++;
        }
    }

    private function migrateReturns($tenantId): void
    {
        DB::table('invoices')
            ->where('tenant_id', $tenantId)
            ->where('type', 'purchase_return')
            ->orderBy('id')
            ->chunkById((int) $this->option('chunk'), function ($rows) use ($tenantId) {
                foreach ($rows as $inv) {
                    if (DB::table('purchase_returns')->where('id', $inv->id)->exists()) {
                        continue;
                    }

                    $journalEntryId = DB::table('journal_entries')
                        ->where('tenant_id', $tenantId)
                        ->where('reference', $inv->id)
                        ->where('reference_type', 'purchase_return')
                        ->where('is_reversed', 0)
                        ->value('id');

                    // `purchase_returns.purchase_id` and `journal_entry_id` are
                    // both NOT NULL. A return we cannot confidently attach to a
                    // parent purchase and a journal entry is SKIPPED and
                    // reported — never inserted with a guessed or null link.
                    // A mis-attached return is worse than an unmigrated one:
                    // it moves money against the wrong supplier.
                    $purchaseId = $inv->parent_invoice_id ?? $inv->reference_invoice_id ?? null;

                    if (! $purchaseId || ! DB::table('purchases')->where('id', $purchaseId)->exists()) {
                        $this->stats['warnings'][] =
                            "return {$inv->id}: SKIPPED — parent purchase " .
                            ($purchaseId ?: '(none recorded)') . ' not present in `purchases`';
                        $this->stats['returns_skipped']++;
                        continue;
                    }

                    if (! $journalEntryId) {
                        $this->stats['warnings'][] =
                            "return {$inv->id}: SKIPPED — no live purchase_return journal entry found";
                        $this->stats['returns_skipped']++;
                        continue;
                    }

                    DB::table('purchase_returns')->insertOrIgnore([
                        'id'               => $inv->id,   // ⭐ preserved
                        'tenant_id'        => $tenantId,
                        'purchase_id'      => $purchaseId,
                        'return_date'      => $inv->date,
                        'reason'           => $inv->notes ?? 'Migrated from legacy debit note',
                        'total_amount'     => $inv->total_amount ?? 0,
                        'journal_entry_id' => $journalEntryId,
                        // NOTE: purchase_returns.created_by is unsignedBigInteger
                        // while purchases.created_by is a uuid — the schema is
                        // inconsistent. Coerce, and fall back to 1 rather than
                        // failing the whole tenant on one legacy row.
                        'created_by'       => is_numeric($inv->user_id ?? null) ? (int) $inv->user_id : 1,
                        'created_at'       => $inv->created_at ?? now(),
                        'updated_at'       => $inv->updated_at ?? now(),
                    ]);

                    $this->stats['returns_inserted']++;
                }
            });
    }

    /**
     * V3 aged payables and supplier statements read `payment_allocations`.
     * Legacy purchases never wrote it, which is precisely why migrated purchases
     * were invisible in Aged Payables. Rebuild one active allocation row per
     * live purchase_payment journal entry.
     */
    private function backfillAllocations($tenantId): void
    {
        $payments = DB::table('journal_entries as je')
            ->join('journal_items as ji', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->join('purchases as p', 'p.id', '=', 'je.reference')
            ->where('je.tenant_id', $tenantId)
            ->where('je.reference_type', 'purchase_payment')
            ->where('je.is_reversed', 0)
            ->where('a.code', '2000')
            ->where('ji.debit', '>', 0)
            ->select('je.id as journal_entry_id', 'je.reference as purchase_id', 'je.date as entry_date', 'ji.debit')
            ->get();

        foreach ($payments as $pay) {
            $already = DB::table('payment_allocations')
                ->where('tenant_id', $tenantId)
                ->where('purchase_id', $pay->purchase_id)
                ->where('payment_journal_entry_id', $pay->journal_entry_id)
                ->exists();

            if ($already) {
                continue;
            }

            DB::table('payment_allocations')->insertOrIgnore([
                'id'        => Str::uuid()->toString(),
                'tenant_id' => $tenantId,
                'purchase_id' => $pay->purchase_id,
                'sale_id'     => null,
                // The DB trigger requires a JournalEntry id here, NOT a Payment id.
                // The column is `payment_journal_entry_id` — see
                // 2026_03_05_000001_v3_foundation_schema.php and PaymentService::allocate().
                'payment_journal_entry_id' => $pay->journal_entry_id,
                'allocated_amount' => $pay->debit,
                'status'           => 'active',
                'created_at'       => $pay->entry_date ?? now(),
                'updated_at'       => now(),
            ]);

            $this->stats['allocations_inserted']++;
        }
    }

    /** Legacy sometimes stored only total_amount. Reconstruct net from the lines. */
    private function deriveSubtotal($inv): float
    {
        return (float) DB::table('invoice_items')->where('invoice_id', $inv->id)->sum('total');
    }

    private function summary(): void
    {
        $this->newLine();
        $this->table(['Metric', 'Count'], [
            ['Purchases inserted',   $this->stats['purchases_inserted']],
            ['Purchases skipped (already present)', $this->stats['purchases_skipped']],
            ['Purchase items inserted', $this->stats['items_inserted']],
            ['Purchase returns inserted', $this->stats['returns_inserted']],
            ['Purchase returns SKIPPED (unresolvable parent/journal)', $this->stats['returns_skipped']],
            ['Payment allocations backfilled', $this->stats['allocations_inserted']],
        ]);

        if (! empty($this->stats['warnings'])) {
            $this->newLine();
            $this->warn('Warnings (' . count($this->stats['warnings']) . '):');
            foreach (array_slice($this->stats['warnings'], 0, 50) as $w) {
                $this->line('  - ' . $w);
            }
        }

        $this->newLine();
        if ($this->commit) {
            $this->info('Committed. Now run: php artisan purchases:reconcile');
        } else {
            $this->warn('DRY RUN — nothing was written. Re-run with --commit to apply.');
        }
    }
}
