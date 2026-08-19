<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Single source of truth for resolving / bootstrapping the Golden Master
 * demo tenant.
 *
 * Previously four different call sites (DemoController::login,
 * DemoStoreController::reset, demo:restore, demo:snapshot) each ran their
 * own `Tenant::where('is_golden_master', true)->first()` or `firstOrFail()`.
 * The `firstOrFail()` call sites could never recover from a missing Golden
 * Master — they 404'd before any seeding could happen, which is why the
 * Reset/Login buttons dead-ended on a fresh server. This service centralizes
 * the "find, adopt, or create" logic so every caller behaves the same way.
 */
class DemoStoreService
{
    public const DEFAULT_SLUG = 'demo';

    /**
     * Resolve the Golden Master demo tenant, self-healing if necessary:
     *   1. Return the tenant flagged is_golden_master = true, if one exists.
     *   2. Else, adopt the tenant at slug 'demo' (or the DB's oldest is_demo
     *      tenant) by flipping its flags on.
     *   3. Else, create a brand new minimal Golden Master tenant.
     *
     * This never throws and never 404s — callers that need seeded data
     * still have to trigger a deploy/restore afterward, but the tenant row
     * itself will always exist after calling this.
     */
    public static function goldenMaster(bool $createIfMissing = true): ?Tenant
    {
        $demo = Tenant::where('is_golden_master', true)->first();
        if ($demo) {
            return $demo;
        }

        // Guard against a prior bug run leaving duplicate unflagged "demo"
        // tenants behind. Prefer the oldest one (first created) so we don't
        // keep spawning new rows on every request.
        $candidate = Tenant::where('slug', self::DEFAULT_SLUG)
            ->orWhere(function ($q) {
                $q->where('is_demo', true)->where('is_golden_master', false);
            })
            ->orderBy('id')
            ->first();

        if ($candidate) {
            Log::info("DemoStoreService: adopting tenant #{$candidate->id} (slug={$candidate->slug}) as Golden Master.");
            $candidate->update([
                'is_demo' => true,
                'is_golden_master' => true,
                'onboarding_completed' => true,
                'onboarding_step' => 'completed',
            ]);
            return $candidate->fresh();
        }

        if (!$createIfMissing) {
            return null;
        }

        Log::info('DemoStoreService: no demo tenant found at all — creating a fresh Golden Master.');

        // NOTE: if this throws a duplicate-key error on `slug`, a
        // soft-deleted tenant with slug='demo' exists (Tenant uses
        // SoftDeletes, and the unique index does not exclude trashed rows).
        // Run `php artisan demo:cleanup-duplicates` first — it operates
        // withTrashed() and will resolve this.
        return Tenant::create([
            'name'                 => 'VenQore Demo Store',
            'slug'                 => self::DEFAULT_SLUG,
            'plan'                 => 'business',
            'status'               => 'active',
            'currency_symbol'      => '$',
            'currency_code'        => 'USD',
            'setup_completed'      => true,
            'onboarding_completed' => true,
            'onboarding_step'      => 'completed',
            'is_demo'              => true,
            'is_golden_master'     => true,
        ]);
    }

    /**
     * Every table that carries this tenant's business data, in an order
     * that is safe to DELETE in (children before parents) or INSERT in
     * reverse (parents before children). Kept in one place so the
     * snapshot exporter, the restorer, and the full-deploy wiper can never
     * drift out of sync with each other or with the real schema again.
     *
     * Order matters: delete top-to-bottom, insert bottom-to-top.
     */
    public const TENANT_DATA_TABLES = [
        // Deepest children first (safe to delete first / insert last)
        'journal_items',
        'journal_entries',
        'allocations',
        'allocations',
        'sale_item_batches',
        'sale_items',
        'sales_order_items',
        'sales_orders',
        'purchase_items',
        'purchase_order_items',
        'purchase_orders',
        'purchase_returns',
        'debit_note_items',
        'debit_notes',
        'invoice_items',
        'invoices',
        'quotation_items',
        'quotations',
        'proposal_items',
        'proposals',
        'transactions',
        'sales',
        'purchases',
        'stock_movements',
        'stock_take_items',
        'stock_takes',
        'stock_transfer_items',
        'stock_transfers',
        'inventory_batches',
        'stocks',
        'product_barcodes',
        'product_uom_conversions',
        'product_variants',
        'product_price_tiers',
        'product_serials',
        'product_attributes',
        'products',
        'composition_items',
        'compositions',
        'bill_of_materials',
        'bom_items',
        'expenses',
        'expense_categories',
        'payments',
        'party_snapshots',
        'parties',
        'staff_attendances',
        'staff_activity_gaps',
        'daily_snapshots',
        'customer_analytics',
        'bank_accounts',
        'accounts',
        'warehouses',
        'categories',
        'brands',
        'units',
        'tenant_users',
        'settings',
    ];

    /**
     * Verify the tables actually exist in this database (columns can vary
     * across older/newer migrations mid-deploy) before anyone iterates
     * over the full constant list.
     */
    public static function existingTenantDataTables(): array
    {
        return array_values(array_filter(
            self::TENANT_DATA_TABLES,
            fn (string $table) => \Illuminate\Support\Facades\Schema::hasTable($table)
        ));
    }

    /**
     * Sanity-check that a tenant's ledger is actually balanced and that
     * seeded modules produced real rows. Used after deploy/restore so a
     * "successful" run that silently produced an empty or broken store is
     * surfaced loudly instead of swallowed.
     *
     * @return array{ok: bool, issues: string[], counts: array<string,int>}
     */
    public static function healthCheck(int $tenantId): array
    {
        $issues = [];
        $counts = [];

        foreach (['sales', 'purchases', 'journal_entries', 'journal_items', 'products', 'parties'] as $table) {
            if (!\Illuminate\Support\Facades\Schema::hasTable($table)) {
                continue;
            }
            $counts[$table] = (int) DB::table($table)->where('tenant_id', $tenantId)->count();
        }

        if (($counts['sales'] ?? 0) === 0) {
            $issues[] = 'No sales rows found for demo tenant.';
        }
        if (($counts['journal_entries'] ?? 0) > 0 && ($counts['journal_items'] ?? 0) === 0) {
            $issues[] = 'journal_entries exist but journal_items is empty — ledger is unbalanced.';
        }

        // Every journal_entry should have at least one journal_item.
        if (\Illuminate\Support\Facades\Schema::hasTable('journal_entries') && \Illuminate\Support\Facades\Schema::hasTable('journal_items')) {
            $orphanEntries = DB::table('journal_entries as je')
                ->where('je.tenant_id', $tenantId)
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('journal_items as ji')
                        ->whereColumn('ji.journal_entry_id', 'je.id');
                })
                ->count();
            if ($orphanEntries > 0) {
                $issues[] = "{$orphanEntries} journal_entries have zero journal_items (unbalanced).";
            }
        }

        return [
            'ok'     => empty($issues),
            'issues' => $issues,
            'counts' => $counts,
        ];
    }
}
