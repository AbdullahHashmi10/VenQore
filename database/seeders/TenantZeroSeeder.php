<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * TenantZeroSeeder — Definitive Plan Update
 *
 * Creates "AMD Outlets" as Tenant ID 1 under the new schema:
 *  - Numeric auto-increment PK (not UUID)
 *  - Uses slug instead of subdomain
 *  - Creates TenantUser record (role=owner) for existing AMD Outlets users
 *  - Creates a consumed StoreLicense for the existing store
 *  - Sets last_store_id on existing users
 *
 * Safe to run multiple times (idempotent).
 * Usage: php artisan db:seed --class=TenantZeroSeeder
 */
class TenantZeroSeeder extends Seeder
{
    private const DATA_TABLES = [
        'products', 'sale_items', 'sales', 'purchase_items',
        'invoices', 'invoice_items', 'parties', 'accounts',
        'journal_entry_lines', 'journal_entries', 'categories',
        'warehouses', 'stocks', 'stock_movements', 'expenses',
        'payments', 'settings',
    ];

    public function run(): void
    {
        $this->command->info('══════════════════════════════════════════');
        $this->command->info('  Definitive Plan — Tenant Zero Seeder');
        $this->command->info('══════════════════════════════════════════');

        if (!Schema::hasTable('tenants')) {
            $this->command->error('❌ tenants table does not exist. Run migrations first.');
            return;
        }

        DB::transaction(function () {
            // ── 1. Create or find AMD Outlets store ────────────────────
            $existing = DB::table('tenants')->where('slug', 'amd-outlets')->first();

            if ($existing) {
                $tenantId = $existing->id;
                $this->command->info("ℹ  Tenant Zero already exists (ID: {$tenantId}).");
            } else {
                $tenantId = DB::table('tenants')->insertGetId([
                    'name'                => 'AMD Outlets',
                    'slug'                => 'amd-outlets',
                    'plan'                => 'business',
                    'status'              => 'active',
                    'trial_ends_at'       => null,
                    'timezone'            => 'Asia/Karachi',
                    'currency_code'       => 'PKR',
                    'currency_symbol'     => 'Rs.',
                    'country_code'        => 'PK',
                    'language_code'       => 'en',
                    'setup_completed'     => true,
                    'industry'            => 'retail',
                    'join_code'           => 'VQ-AMDX',
                    'feature_variants'    => false,
                    'feature_serials'     => false,
                    'feature_batches'     => false,
                    'feature_manufacturing' => false,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);

                $this->command->info("✅ Tenant Zero created (ID: {$tenantId}).");
            }

            // ── 2. Backfill tenant_id on all data tables ────────────────
            foreach (self::DATA_TABLES as $table) {
                if (!Schema::hasTable($table)) {
                    $this->command->warn("   ⚠  Table '{$table}' missing — skipping.");
                    continue;
                }
                if (!Schema::hasColumn($table, 'tenant_id')) {
                    $this->command->warn("   ⚠  '{$table}' has no tenant_id — skipping.");
                    continue;
                }
                $updated = DB::table($table)->whereNull('tenant_id')->update(['tenant_id' => $tenantId]);
                $total   = DB::table($table)->where('tenant_id', $tenantId)->count();
                $this->command->info("   ✓  {$table}: {$updated} rows filled, {$total} total.");
            }

            // ── 3. Create TenantUser records for existing users ─────────
            if (Schema::hasTable('tenant_users')) {
                $users = DB::table('users')->get();
                foreach ($users as $user) {
                    $exists = DB::table('tenant_users')
                        ->where('tenant_id', $tenantId)
                        ->where('user_id', $user->id)
                        ->exists();

                    if (!$exists) {
                        // First user becomes owner, rest become admin
                        $isFirst = DB::table('tenant_users')->where('tenant_id', $tenantId)->doesntExist();
                        DB::table('tenant_users')->insert([
                            'tenant_id'  => $tenantId,
                            'user_id'    => $user->id,
                            'role'       => $isFirst ? 'owner' : 'admin',
                            'status'     => 'active',
                            'joined_at'  => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $this->command->info("   ✓  TenantUser created for user: {$user->email}");
                    }
                }
            }

            // ── 4. Create a StoreLicense for the existing store ─────────
            if (Schema::hasTable('store_licenses')) {
                $ownerMembership = DB::table('tenant_users')
                    ->where('tenant_id', $tenantId)
                    ->where('role', 'owner')
                    ->first();

                if ($ownerMembership) {
                    $licenseExists = DB::table('store_licenses')
                        ->where('tenant_id', $tenantId)
                        ->exists();

                    if (!$licenseExists) {
                        DB::table('store_licenses')->insert([
                            'user_id'     => $ownerMembership->user_id,
                            'tenant_id'   => $tenantId,
                            'type'        => 'ltd',
                            'status'      => 'consumed',
                            'plan'        => 'business',
                            'source'      => 'manual',
                            'consumed_at' => now(),
                            'valid_until' => null,
                            'created_at'  => now(),
                            'updated_at'  => now(),
                        ]);
                        $this->command->info("   ✓  StoreLicense (LTD Business) created for store.");
                    }
                }
            }

            // ── 5. Set last_store_id on all existing users ──────────────
            if (Schema::hasColumn('users', 'last_store_id')) {
                DB::table('users')->whereNull('last_store_id')->update(['last_store_id' => $tenantId]);
                $this->command->info("   ✓  last_store_id set to {$tenantId} for all users.");
            }
        });

        $this->command->info('');
        $this->command->info('══════════════════════════════════════════');
        $this->command->info('  Verification: SELECT COUNT(*) FROM products WHERE tenant_id IS NULL;');
        $this->command->info('  ↑ Must return 0 before going live.');
        $this->command->info('══════════════════════════════════════════');
    }
}
