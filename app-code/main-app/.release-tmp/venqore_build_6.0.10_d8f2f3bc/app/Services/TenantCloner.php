<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TenantCloner
{
    /**
     * Clones the Golden Master tenant in a Single-DB architecture.
     * Since we share tables using tenant_id and use UUIDs, we must 
     * deeply duplicate the records and remap the relational UUIDs.
     *
     * @param Tenant $master
     * @param array $overrides
     * @return Tenant
     */
    public static function cloneFrom(Tenant $master, array $overrides = []): Tenant
    {
        $newTenant = Tenant::create(array_merge(
            $master->only(['plan', 'currency_code', 'currency_symbol', 'setup_completed']),
            $overrides,
            ['name' => 'Demo Sandbox']
        ));

        $masterId = $master->id;
        $newId = $newTenant->id;

        // UUID Mapping Dictionary: [table => [old_uuid => new_uuid]]
        $uuidMap = [];
        
        $tableHierarchy = [
            'settings' => [],
            'accounts' => [],
            'brands' => [],
            'units' => [],
            'warehouses' => [],
            'categories' => [],
            'expense_categories' => [],
            'bank_accounts' => [],
            'parties' => [],
            'customers' => [],
            'suppliers' => [],
            'products' => ['category_id' => 'categories', 'brand_id' => 'brands', 'unit_id' => 'units'],
            'product_barcodes' => ['product_id' => 'products'],
            'product_uom_conversions' => ['product_id' => 'products', 'unit_id' => 'units'],
            'product_variants' => ['product_id' => 'products'],
            'inventory_batches' => ['product_id' => 'products', 'warehouse_id' => 'warehouses'],
            'stocks' => ['product_id' => 'products', 'warehouse_id' => 'warehouses'],
            'invoices' => ['customer_id' => 'parties', 'warehouse_id' => 'warehouses'],
            'invoice_items' => ['invoice_id' => 'invoices', 'product_id' => 'products'],
            'sales' => ['customer_id' => 'parties', 'warehouse_id' => 'warehouses'],
            'sale_items' => ['sale_id' => 'sales', 'product_id' => 'products'],
            'sale_item_batches' => ['sale_item_id' => 'sale_items', 'inventory_batch_id' => 'inventory_batches'],
            'expenses' => ['expense_category_id' => 'expense_categories'],
            'payments' => ['customer_id' => 'parties', 'bank_account_id' => 'bank_accounts'],
            'journal_entries' => ['party_id' => 'parties'],
            'journal_items' => ['journal_entry_id' => 'journal_entries', 'account_id' => 'accounts', 'party_id' => 'parties'],
            'transactions' => [],
            'production_runs' => ['warehouse_id' => 'warehouses'],
        ];

        DB::beginTransaction();

        try {
            // ── Demo Relative Timestamp Engine (V1 Section 2) ────────────────
            // Shift all date/timestamp columns so history remains "relative" to Today.
            // Dynamic Epoch: Anchor the shift to the most recent record in master.
            // Calculated once PER CLONE operation to save thousands of queries.
            $masterMaxDate = DB::table('sales')->where('tenant_id', $masterId)->max('created_at') ?: '2020-01-01';
            $offsetDays = \Carbon\Carbon::parse($masterMaxDate)->diffInDays(\Carbon\Carbon::now());

            foreach ($tableHierarchy as $table => $relations) {
                $uuidMap[$table] = [];
                
                // Fetch all master records for this table
                // Exception for users given pivot setup
                if ($table === 'users') continue;

                $records = DB::table($table)->where('tenant_id', $masterId)->get();
                $insertPayload = [];

                foreach ($records as $rec) {
                    $oldId = $rec->id;
                    $newUuid = Str::uuid()->toString();
                    $uuidMap[$table][$oldId] = $newUuid;

                    $newRec = (array)$rec;
                    $newRec['id'] = $newUuid;
                    $newRec['tenant_id'] = $newId;

                    // Remap Foreign Keys logically based on hierarchy
                    foreach ($relations as $fkColumn => $parentTable) {
                        if (isset($newRec[$fkColumn]) && isset($uuidMap[$parentTable][$newRec[$fkColumn]])) {
                            $newRec[$fkColumn] = $uuidMap[$parentTable][$newRec[$fkColumn]];
                        }
                    }

                    $dateColumns = ['created_at', 'updated_at', 'posted_at', 'date', 'due_date'];
                    foreach ($dateColumns as $col) {
                        if (!empty($newRec[$col])) {
                            try {
                                $newRec[$col] = \Carbon\Carbon::parse($newRec[$col])->addDays($offsetDays)->toDateTimeString();
                            } catch (\Exception $e) { /* skip malformed dates */ }
                        }
                    }

                    $insertPayload[] = $newRec;
                }

                \Log::info("Cloning table: $table, records: " . count($insertPayload));
                // Batch insert chunked to avoid memory limits
                foreach (array_chunk($insertPayload, 500) as $chunk) {
                    try {
                        DB::table($table)->insert($chunk);
                    } catch (\Exception $e) {
                        \Log::error("Failed to insert chunk for table $table: " . $e->getMessage(), [
                            'chunk_sample' => collect($chunk)->first(),
                        ]);
                        throw $e;
                    }
                }
            }

            // Copy Users & Pivot
            $masterUsers = DB::table('tenant_users')->where('tenant_id', $masterId)->get();
            foreach ($masterUsers as $mu) {
                DB::table('tenant_users')->insert([
                    'tenant_id' => $newId,
                    'user_id' => $mu->user_id,
                    'role' => $mu->role,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            return $newTenant;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
